import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getApp } from 'firebase-admin/app';

// Check if Firebase Admin is already initialized
const apps = getApps();

// Initialize Firebase Admin if it's not already initialized
if (!apps.length) {
  try {
    // If service account key exists as JSON, use it
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`
      });
      console.log("Initialized Firebase Admin with service account JSON");
    } 
    // If individual environment variables exist, use them
    else if (
      process.env.FIREBASE_CLIENT_EMAIL && 
      process.env.FIREBASE_PRIVATE_KEY && 
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    ) {
      initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`
      });
      console.log("Initialized Firebase Admin with individual credentials");
    }
    // For development only - use a mock app
    else if (process.env.NODE_ENV !== 'production') {
      console.warn("⚠️ Using Firebase Admin in mock mode - FOR DEVELOPMENT ONLY");
      
      // Create a minimal app configuration
      initializeApp({
        projectId: 'demo-project',
      });
    } 
    // In production, fail if credentials are missing
    else {
      throw new Error('Firebase Admin credentials are missing. Please set the FIREBASE_SERVICE_ACCOUNT_KEY or individual credential environment variables.');
    }
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    
    // In development, continue with mock app
    if (process.env.NODE_ENV !== 'production' && !apps.length) {
      console.warn("⚠️ Using fallback mock app - FOR DEVELOPMENT ONLY");
      initializeApp({
        projectId: 'demo-project',
      });
    }
  }
}

// Get a reference to the initialized app
const app = getApp();
console.log(`Firebase Admin initialized with project: ${app.options.projectId}`);

export const adminDB = getFirestore();
export const adminAuth = getAuth(); 