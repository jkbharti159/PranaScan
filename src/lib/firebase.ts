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

  await setDoc(doc(db, 'users', user.uid), profile);

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

  // 2. Retrieve profile from Firestore
  const userDocRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userDocRef);
  
  let profile: FirestoreUserProfile;

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
    await setDoc(userDocRef, profile);
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

  const userDocRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userDocRef);
  
  let profile: FirestoreUserProfile;

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
    await setDoc(userDocRef, profile);
  }

  const idToken = await user.getIdToken();

  return { user, profile, idToken };
}

