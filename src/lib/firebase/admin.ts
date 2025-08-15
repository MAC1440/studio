
import * as admin from 'firebase-admin';

// This function initializes the Firebase Admin SDK.
// It ensures that we don't try to re-initialize it if it's already been set up.
export function initializeFirebaseAdmin() {
    // Check if the app is already initialized
    if (admin.apps.length > 0) {
        return {
            adminDb: admin.firestore(),
            adminAuth: admin.auth(),
        };
    }

    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    // Check for essential environment variables
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
        throw new Error('Firebase admin environment variables are not set.');
    }

    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
        });
    } catch (error: any) {
        // Catch and re-throw a more informative error.
        throw new Error(`Firebase admin initialization error "${error.message}"`);
    }


    return {
        adminDb: admin.firestore(),
        adminAuth: admin.auth(),
    };
}
