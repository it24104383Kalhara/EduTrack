import { initializeApp, getApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Demo configuration. In production, these should be securely injected 
// or read from expo-constants / .env
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "demo-key",
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo-app.firebaseapp.com",
    databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || "https://demo-app.firebaseio.com",
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "demo-app",
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-app.appspot.com",
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:123:web:abc"
};

// Safe initialization
export const FIREBASE_READY = firebaseConfig.apiKey !== "demo-key";

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getDatabase(app);
