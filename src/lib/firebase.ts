import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';

// Conditionally import mockdb only on the server side
const mockImports = async () => {
  if (typeof window === 'undefined') {
    const { mockDb, mockAuth, mockStorage } = await import('./mockdb');
    return { mockDb, mockAuth, mockStorage };
  }
  return {
    mockDb: {} as any,
    mockAuth: {} as any,
    mockStorage: {} as any
  };
};

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

let app: FirebaseApp | null = null;
let db: Firestore;
let auth: Auth;
let storage: FirebaseStorage;
let analytics: Analytics | null = null;

// Check if we're running in test mode - only use mock in server context
const isTestMode = typeof window === 'undefined' && 
  process.env.NODE_ENV === 'development' && 
  process.env.USE_MOCK_DB === 'true';

// Initialize Firebase for client-side
if (!isTestMode) {
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
} else {
  // For server context with mock mode enabled
  // These will be properly initialized later
  db = {} as Firestore;
  auth = {} as Auth;
  storage = {} as FirebaseStorage;
  
  // Dynamic import of mock implementations in server context
  if (typeof window === 'undefined') {
    import('./mockdb').then(({ mockDb, mockAuth, mockStorage }) => {
      db = mockDb as unknown as Firestore;
      auth = mockAuth as unknown as Auth;
      storage = mockStorage as unknown as FirebaseStorage;
    });
  }
}

export { app, db, auth, storage, analytics }; 