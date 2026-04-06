// ============================================================
//  Firebase Configuration — EduTrack Transport
//  Set these values in frontend/.env (Vite prefix = VITE_)
//  Example .env:
//    VITE_FIREBASE_API_KEY=your_api_key
//    VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
//    VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.asia-southeast1.firebasedatabase.app
//    VITE_FIREBASE_PROJECT_ID=your_project_id
//    VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
//    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
//    VITE_FIREBASE_APP_ID=your_app_id
// ============================================================

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';

const databaseURL = import.meta.env.VITE_FIREBASE_DATABASE_URL || '';

// We only initialise Firebase when a real databaseURL is provided.
// Without it the SDK throws a fatal error that crashes the whole page.
const FIREBASE_READY = databaseURL.startsWith('https://');

let app: FirebaseApp | null = null;
let database: Database | null = null;

if (FIREBASE_READY) {
    app = initializeApp({
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
        databaseURL,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    });
    database = getDatabase(app);
}

export { FIREBASE_READY };
export const db = database;
export default app;
