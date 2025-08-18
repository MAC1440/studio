
'use server';

import * as admin from 'firebase-admin';
import { db } from './config';
import { doc, deleteDoc } from 'firebase/firestore';


// Check if the required environment variables are set
const hasRequiredEnvVars =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
  process.env.FIREBASE_ADMIN_PRIVATE_KEY;

if (!admin.apps.length) {
  if (hasRequiredEnvVars) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          // The private key must be formatted correctly.
          // In your .env file, it should be a single line string with newlines represented as \\n
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY
            ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
            : undefined,
        }),
      });
    } catch (error: any) {
      console.error('Firebase admin initialization error', error.stack);
    }
  } else {
    console.warn(
      'Firebase admin initialization skipped. Missing one or more required environment variables: NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY.'
    );
  }
}

// Export auth only if the app was initialized
const adminAuth = admin.apps.length ? admin.auth() : null;

/**
 * Deletes a user from both Firebase Authentication and Firestore.
 * This is a destructive action that should only be available to super-admins.
 */
export async function deleteUserByAdmin(uid: string): Promise<void> {
    if (!adminAuth) {
        throw new Error("Admin SDK not initialized.");
    }
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
    if (!adminAuth) {
        throw new Error("Admin SDK not initialized.");
    }
     try {
        const link = await adminAuth.generatePasswordResetLink(email);
        // Note: This only generates the link. We're not sending an email here,
        // we're relying on Firebase's default email template for this.
        // A more advanced implementation would use this link with a custom email service.
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
