import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  updateProfile,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

// Helper to race Firestore getDoc with a fast timeout
async function getDocWithTimeout(docRef: any, timeoutMs = 800) {
  return Promise.race([
    getDoc(docRef),
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Firestore operation timeout')), timeoutMs)
    )
  ]);
}

declare global {
  interface ImportMetaEnv {
    readonly VITE_FIREBASE_API_KEY?: string;
    readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
    readonly VITE_FIREBASE_PROJECT_ID?: string;
    readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
    readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
    readonly VITE_FIREBASE_APP_ID?: string;
    readonly VITE_FIREBASE_DATABASE_ID?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigData.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigData.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigData.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigData.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigData.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigData.appId
};

const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigData.firestoreDatabaseId;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, databaseId);

export interface FirestoreUserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: 'clinician' | 'patient' | 'analyst';
  createdAt: string;
}

/**
 * Register a user with email and password and store custom profile metadata.
 */
export async function registerWithFirebase(
  email: string, 
  passwordPlain: string, 
  fullName: string, 
  role: 'clinician' | 'patient' | 'analyst'
): Promise<{ user: FirebaseUser; profile: FirestoreUserProfile; idToken: string }> {
  // 1. Create firebase user
  const userCredential = await createUserWithEmailAndPassword(auth, email, passwordPlain);
  const user = userCredential.user;

  // 2. Set displayName on Firebase auth user
  await updateProfile(user, { displayName: fullName });

  // 3. Save custom properties to Firestore
  const profile: FirestoreUserProfile = {
    uid: user.uid,
    email: email.trim().toLowerCase(),
    fullName: fullName.trim(),
    role,
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'users', user.uid), profile);
  } catch (err) {
    console.warn("Failed to save profile to Firestore (client might be offline):", err);
  }

  // 4. Retrieve ID token
  const idToken = await user.getIdToken();

  return { user, profile, idToken };
}

/**
 * Login a user with email and password, retrieving their custom profile metadata.
 */
export async function loginWithFirebase(
  email: string, 
  passwordPlain: string
): Promise<{ user: FirebaseUser; profile: FirestoreUserProfile; idToken: string }> {
  // 1. Sign in with firebase auth
  const userCredential = await signInWithEmailAndPassword(auth, email, passwordPlain);
  const user = userCredential.user;

  // 2. Retrieve profile from Firestore with robust offline / error fallbacks and fast timeout
  let profile: FirestoreUserProfile;
  const userDocRef = doc(db, 'users', user.uid);

  try {
    const userDoc = await getDocWithTimeout(userDocRef, 850);
    if (userDoc.exists()) {
      profile = userDoc.data() as FirestoreUserProfile;
    } else {
      // Fallback if document doesn't exist yet
      profile = {
        uid: user.uid,
        email: user.email || email,
        fullName: user.displayName || 'Clinical User',
        role: 'clinician', // default role
        createdAt: new Date().toISOString()
      };
      try {
        await setDoc(userDocRef, profile);
      } catch (writeErr) {
        console.warn("Failed to set fallback user profile in Firestore:", writeErr);
      }
    }
  } catch (err) {
    console.warn("Failed to retrieve user profile from Firestore, falling back to local clinical identity:", err);
    profile = {
      uid: user.uid,
      email: user.email || email,
      fullName: user.displayName || 'Clinical User',
      role: 'clinician', // default role
      createdAt: new Date().toISOString()
    };
  }

  // 3. Retrieve ID token
  const idToken = await user.getIdToken();

  return { user, profile, idToken };
}

/**
 * Log out of Firebase.
 */
export async function logoutFromFirebase(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Authenticate with Google popup and retrieve or create custom user profile.
 */
export async function loginWithGoogle(): Promise<{ user: FirebaseUser; profile: FirestoreUserProfile; idToken: string }> {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  const user = userCredential.user;

  let profile: FirestoreUserProfile;
  const userDocRef = doc(db, 'users', user.uid);
  
  try {
    const userDoc = await getDocWithTimeout(userDocRef, 850);
    if (userDoc.exists()) {
      profile = userDoc.data() as FirestoreUserProfile;
    } else {
      profile = {
        uid: user.uid,
        email: user.email || '',
        fullName: user.displayName || 'Clinical User',
        role: 'clinician', // default role
        createdAt: new Date().toISOString()
      };
      try {
        await setDoc(userDocRef, profile);
      } catch (writeErr) {
        console.warn("Failed to set Google user profile in Firestore:", writeErr);
      }
    }
  } catch (err) {
    console.warn("Failed to retrieve Google user profile from Firestore, falling back to local clinical identity:", err);
    profile = {
      uid: user.uid,
      email: user.email || '',
      fullName: user.displayName || 'Clinical User',
      role: 'clinician', // default role
      createdAt: new Date().toISOString()
    };
  }

  const idToken = await user.getIdToken();

  return { user, profile, idToken };
}

