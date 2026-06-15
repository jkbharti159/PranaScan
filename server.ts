import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { dbService } from "./server/dbService.js";
import { analyzeMedicalReport, diagnosePossibleDisease, translatePatientSummaryHindi } from "./server/geminiService.js";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'clinical-analyzer-super-secret-key-159';

// Middleware for parsing json and urlencoded data
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Helper functions for stateless secure token signing and verification
function generateToken(userId: string): string {
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(userId).digest('hex');
  return `${userId}.${signature}`;
}

function verifyToken(token: string): string | null {
  try {
    const [userId, signature] = token.split('.');
    if (!userId || !signature) return null;
    const expectedSig = crypto.createHmac('sha256', SECRET_KEY).update(userId).digest('hex');
    if (signature === expectedSig) {
      return userId;
    }
  } catch (e) {
    // Treat any parsing errors as invalid token
  }
  return null;
}

// Authentication middleware
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required. Please log in first.' });
  }

  const token = authHeader.split(' ')[1];
  const userId = verifyToken(token);
  if (!userId) {
    return res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
  }

  const user = dbService.getUserById(userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found.' });
  }

  (req as any).user = user;
  next();
}

// Optional Auth middleware (e.g. for guest / registered trial separation)
function optionalAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const userId = verifyToken(token);
    if (userId) {
      const user = dbService.getUserById(userId);
      if (user) {
        (req as any).user = user;
      }
    }
  }
  next();
}

// ======================== API ROUTES ========================

// Health & Status Check
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Register Account
app.post("/api/auth/register", (req, res) => {
  const { username, password, fullName, role } = req.body;

  if (!username || !password || !fullName) {
    return res.status(400).json({ error: "Username, password, and full name are required." });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long." });
  }

  try {
    const newUser = dbService.registerUser(username, password, fullName, role || 'clinician');
    const token = generateToken(newUser.id);

    res.status(201).json({
      message: "Account created successfully.",
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        fullName: newUser.fullName,
        role: newUser.role
      }
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Registration failed." });
  }
});

// Login Account
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  const user = dbService.authenticate(username, password);
  if (!user) {
    return res.status(401).json({ error: "Invalid username or password." });
  }

  const token = generateToken(user.id);
  res.json({
    message: "Login successful.",
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role
    }
  });
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
      savedRecord = dbService.saveAnalysis(req.user.id, {
        title: resolvedTitle,
        patientName: patientName || "Anonymous Patient",
        age: Number(age) || 0,
        gender: gender || "Other",
        specialty: specialty || analysis.specialtyClassification,
        rawText: rawText || `[Multimodal Document Uploaded: ${uploadedFile?.name || 'Medical File'}]`,
        analysis
      });
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
app.get("/api/history", requireAuth, (req: any, res) => {
  try {
    const history = dbService.getAnalysesByUser(req.user.id);
    res.json({ history });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch analysis history." });
  }
});

// Fetch Specific Analysis Details
app.get("/api/history/:id", requireAuth, (req: any, res) => {
  try {
    const record = dbService.getAnalysisDetails(req.params.id, req.user.id);
    if (!record) {
      return res.status(404).json({ error: "Specific report analysis record could not be found." });
    }
    res.json({ record });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch report details." });
  }
});

// Delete Specific Saved Analysis
app.delete("/api/history/:id", requireAuth, (req: any, res) => {
  try {
    const success = dbService.deleteAnalysis(req.params.id, req.user.id);
    if (!success) {
      return res.status(404).json({ error: "Record not found or unauthorized delete operation." });
    }
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
