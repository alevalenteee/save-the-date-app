import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';
import { mockDb, mockAuth, mockStorage } from './mockdb';

// Check if we're running in test mode
const isTestMode = process.env.NODE_ENV === 'development' && process.env.USE_MOCK_DB === 'true';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

let app: FirebaseApp | null;
let db: Firestore;
let auth: Auth;
let storage: FirebaseStorage;
let analytics: Analytics | null = null;

if (isTestMode) {
  console.log('Running in test mode with mock database');
  
  // Use mock implementations with type assertions
  app = null;
  db = mockDb as unknown as Firestore;
  auth = mockAuth as unknown as Auth;
  storage = mockStorage as unknown as FirebaseStorage;
} else {
  // Initialize Firebase
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
  
  // Initialize Analytics only in browser environment and if supported
  if (typeof window !== 'undefined') {
    isSupported().then(supported => {
      if (supported && app) { // Ensure app is not null
        analytics = getAnalytics(app);
      }
    }).catch(err => {
      console.error('Analytics initialization failed:', err);
    });
  }
}

export { app, db, auth, storage, analytics }; 