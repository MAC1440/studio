
'use server';

import * as admin from 'firebase-admin';
import { db } from './config';
import { doc, deleteDoc } from 'firebase/firestore';

const ADMIN_SDK_INITIALIZED = admin.apps.length > 0;

// Initialize Firebase Admin SDK if not already initialized
if (!ADMIN_SDK_INITIALIZED) {
  try {
    console.log("Attempting to initialize Firebase Admin SDK...");
    console.log("FIREBASE_ADMIN_CLIENT_EMAIL loaded:", !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL);
    console.log("FIREBASE_ADMIN_PRIVATE_KEY loaded:", !!process.env.FIREBASE_ADMIN_PRIVATE_KEY);
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        // The private key must be formatted correctly.
        // In your .env or Vercel environment variables, it should be a single line string
        // with newlines represented as \\n
        privateKey: (
          process.env.FIREBASE_ADMIN_PRIVATE_KEY as string
        ).replace(/\\n/g, '\n'),
      }),
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error: any) {
     console.error('Firebase admin initialization error. Make sure server-side environment variables (FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY) are set correctly.', error.stack);
  }
}

const adminAuth = admin.apps.length ? admin.auth() : null;

function ensureAdminInitialized() {
    if (!adminAuth) {
        throw new Error("Firebase Admin SDK is not initialized. Please check server-side environment variables as described in the README.");
    }
}


/**
 * Deletes a user from both Firebase Authentication and Firestore.
 * This is a destructive action that should only be available to super-admins.
 */
export async function deleteUserByAdmin(uid: string): Promise<void> {
    ensureAdminInitialized();
    try {
        // Delete from Firebase Authentication
        await adminAuth.deleteUser(uid);
        
        // Delete from Firestore
        const userDocRef = doc(db, 'users', uid);
        await deleteDoc(userDocRef);

    } catch (error: any) {
        console.error("Error deleting user with admin SDK:", error);
        throw new Error(`Failed to delete user: ${error.message}`);
    }
}

export async function resetPasswordByAdmin(email: string): Promise<void> {
    ensureAdminInitialized();
     try {
        const link = await adminAuth.generatePasswordResetLink(email);
        // Note: This only generates the link. We're not sending an email here,
        // we're relying on Firebase's default email template for this.
        // For now, we need to re-import the client-side auth to send the email.
        const { auth } = await import('./config');
        const { sendPasswordResetEmail } = await import('firebase/auth');
        await sendPasswordResetEmail(auth, email);

    } catch (error: any) {
        console.error("Error sending password reset with admin SDK:", error);
        if (error.code === 'auth/user-not-found') {
            throw new Error("This email does not exist in the authentication system.");
        }
        throw new Error(`Failed to send password reset: ${error.message}`);
    }
}
