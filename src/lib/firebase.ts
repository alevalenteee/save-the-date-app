import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';
import { mockDb, mockAuth, mockStorage } from './mockdb';

// Check if we're running in test mode
const isTestMode = process.env.NODE_ENV === 'development' && process.env.USE_MOCK_DB === 'true';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBvDHFJbKnYGB_M4BiMAnKr7WOJMJf5JDY",
  authDomain: "save-the-date-app-4888b.firebaseapp.com",
  projectId: "save-the-date-app-4888b",
  storageBucket: "save-the-date-app-4888b.firebasestorage.app",
  messagingSenderId: "537471747043",
  appId: "1:537471747043:web:257ae8fb1b7d879e30d6d6",
  measurementId: "G-RQWEYS6Q2Y"
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