// src/lib/firebase/admin.ts
import * as admin from 'firebase-admin';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';

let adminAuth: Auth | null = null;
let adminDb: Firestore | null = null;

function initializeFirebaseAdmin() {
  if (admin.apps.length === 0) {
    const hasRequiredEnvVars =
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY;

    if (hasRequiredEnvVars) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
          }),
        });
      } catch (error: any) {
        console.error('Firebase admin initialization error', error.stack);
        throw error; // re-throw the error to be caught by the caller
      }
    } else {
       console.warn(
        'Firebase admin initialization skipped. Missing one or more required environment variables.'
      );
      throw new Error('Missing Firebase Admin environment variables.');
    }
  }

  if (!adminAuth) {
    adminAuth = admin.auth();
  }
  if (!adminDb) {
    adminDb = admin.firestore();
  }

  return { adminAuth, adminDb };
}

export { initializeFirebaseAdmin };
