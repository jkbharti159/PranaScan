import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { analyzeMedicalReport, diagnosePossibleDisease, translatePatientSummaryHindi } from "./server/geminiService.js";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

// Load configuration from firebase-applet-config.json
let firebaseConfig: any = {};
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  }
} catch (e) {
  console.error("Failed to read firebase-applet-config.json:", e);
}

// ALWAYS prefer project ID and database ID from the config file matching the user's active workspace
const projectId = firebaseConfig.projectId || process.env.FIREBASE_PROJECT_ID || "grand-trees-d07pf";
const databaseId = firebaseConfig.firestoreDatabaseId || undefined;

// Initialize Firebase Admin SDK
const privateKey = process.env.FIREBASE_PRIVATE_KEY 
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
  : undefined;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

let adminApp;
if (privateKey && clientEmail) {
  adminApp = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    projectId
  });
} else {
  adminApp = initializeApp({
    projectId
  });
}

// Helper function to connect to the correct Firestore database
function getDb() {
  return getFirestore(adminApp, databaseId);
}

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Middleware for parsing json and urlencoded data
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Helper function to verify Firebase ID tokens and retrieve/create the user profile
async function verifyFirebaseToken(token: string) {
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    const uid = decodedToken.uid;
    const email = decodedToken.email;
    const name = decodedToken.name || "User";

    const db = getDb();
    const userDocRef = db.collection("users").doc(uid);
    const userDoc = await userDocRef.get();

    if (userDoc.exists) {
      const data = userDoc.data();
      return {
        id: uid,
        username: email || "",
        fullName: data?.fullName || name,
        role: data?.role || "clinician",
        createdAt: data?.createdAt || new Date().toISOString()
      };
    } else {
      const newUser = {
        uid,
        email: email || "",
        fullName: name,
        role: "clinician",
        createdAt: new Date().toISOString()
      };
      await userDocRef.set(newUser);
      return {
        id: uid,
        username: email || "",
        fullName: name,
        role: "clinician",
        createdAt: newUser.createdAt
      };
    }
  } catch (error) {
    console.error("Firebase token verification failed:", error);
    return null;
  }
}

// Authentication middleware
async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required. Please log in first.' });
    }

    const token = authHeader.split(' ')[1];
    const user = await verifyFirebaseToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
    }

    (req as any).user = user;
    next();
  } catch (err) {
    next(err);
  }
}

// Optional Auth middleware (e.g. for guest / registered trial separation)
async function optionalAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const user = await verifyFirebaseToken(token);
      if (user) {
        (req as any).user = user;
      }
    }
    next();
  } catch (err) {
    next();
  }
}

// ======================== API ROUTES ========================

// Health & Status Check
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Register Account
app.post("/api/auth/register", (req, res) => {
  res.status(410).json({ error: "Deprecated. Please register using Firebase client-side Authentication directly." });
});

// Login Account
app.post("/api/auth/login", (req, res) => {
  res.status(410).json({ error: "Deprecated. Please log in using Firebase client-side Authentication directly." });
});

// Current User Profile
app.get("/api/auth/me", requireAuth, (req: any, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      fullName: req.user.fullName,
      role: req.user.role,
      createdAt: req.user.createdAt
    }
  });
});

// Process / Analyze Report
app.post("/api/analyze", optionalAuth, async (req: any, res) => {
  const { rawText, uploadedFile, title, patientName, age, gender, specialty } = req.body;

  if ((!rawText || !rawText.trim()) && !uploadedFile) {
    return res.status(400).json({ error: "Clinical report text or an uploaded document file is required for analysis." });
  }

  try {
    // Run clinical Gemini transcription parsing supporting multimodal elements
    const analysis = await analyzeMedicalReport(rawText || "", uploadedFile);

    let savedRecord = null;
    const resolvedTitle = title?.trim() || 
      (uploadedFile ? `Analysis of ${uploadedFile.name}` : undefined) || 
      `${analysis.specialtyClassification} Report Analysis`;

    // If the user has structured local session credentials, save to their history
    if (req.user) {
      const db = getDb();
      const analysisRecord = {
        userId: req.user.id,
        title: resolvedTitle,
        patientName: patientName || "Anonymous Patient",
        age: Number(age) || 0,
        gender: gender || "Other",
        specialty: specialty || analysis.specialtyClassification,
        rawText: rawText || `[Multimodal Document Uploaded: ${uploadedFile?.name || 'Medical File'}]`,
        analysis,
        createdAt: new Date().toISOString()
      };
      const docRef = await db.collection('analyses').add(analysisRecord);
      savedRecord = { id: docRef.id, ...analysisRecord };
    }

    res.json({
      message: "Medical report analyzed successfully.",
      saved: !!req.user,
      recordId: savedRecord ? savedRecord.id : null,
      analysis
    });
  } catch (error: any) {
    console.error("Analysis endpoint failure:", error);
    res.status(500).json({ error: error.message || "Medical text annotation failed. Please verify API configuration." });
  }
});

// Diagnose Possible Disease Based on Symptoms
app.post("/api/diagnose", optionalAuth, async (req: any, res) => {
  const { symptoms, currentMedications, previousTreatments } = req.body;

  if (!symptoms || !symptoms.trim()) {
    return res.status(400).json({ error: "Symptom description is required for diagnostics evaluation." });
  }

  try {
    const diagnosis = await diagnosePossibleDisease(
      symptoms,
      currentMedications || "",
      previousTreatments || ""
    );

    res.json({
      message: "Symptom evaluation and safety analysis completed successfully.",
      diagnosis
    });
  } catch (error: any) {
    console.error("Diagnostic endpoint failure:", error);
    res.status(500).json({ error: error.message || "Diagnostic evaluation failed. Please verify API configuration." });
  }
});

// Translate Medical Report or Summary to Hindi
app.post("/api/translate", async (req, res) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Text is required for translation." });
  }

  try {
    const translatedText = await translatePatientSummaryHindi(text.trim());
    res.json({
      message: "Clinical summary translated to Hindi successfully.",
      translatedText
    });
  } catch (error: any) {
    console.error("Translation endpoint failure:", error);
    res.status(500).json({ error: error.message || "Translation to Hindi failed. Please check network setup." });
  }
});

// Fetch Analysis History
app.get("/api/history", requireAuth, async (req: any, res) => {
  try {
    const db = getDb();
    const snapshot = await db.collection('analyses')
      .where('userId', '==', req.user.id)
      .get();
    const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    history.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ history });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch analysis history." });
  }
});

// Fetch Specific Analysis Details
app.get("/api/history/:id", requireAuth, async (req: any, res) => {
  try {
    const db = getDb();
    const doc = await db.collection('analyses').doc(req.params.id).get();
    if (!doc.exists || doc.data()?.userId !== req.user.id) {
      return res.status(404).json({ error: "Specific report analysis record could not be found." });
    }
    const record = { id: doc.id, ...doc.data() };
    res.json({ record });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch report details." });
  }
});

// Delete Specific Saved Analysis
app.delete("/api/history/:id", requireAuth, async (req: any, res) => {
  try {
    const db = getDb();
    const docRef = db.collection('analyses').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data()?.userId !== req.user.id) {
      return res.status(404).json({ error: "Record not found or unauthorized delete operation." });
    }
    await docRef.delete();
    res.json({ success: true, message: "Analysis record removed from your workspace." });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete record." });
  }
});


// ======================== FRONTEND VITE INTEGRATION ========================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Clinical Platform Server] listening closely on http://0.0.0.0:${PORT}`);
  });
}

startServer();
