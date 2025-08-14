// src/lib/firebase/admin.ts
import * as admin from 'firebase-admin';
import type { SupportTicket } from '@/lib/types';
import type { firestore as adminFirestore } from 'firebase-admin';

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
export const adminAuth = admin.apps.length ? admin.auth() : null;
const adminDb = admin.apps.length ? admin.firestore() : null;


export async function getAllSupportTickets(): Promise<SupportTicket[]> {
    // This function runs on the server. The AuthGuard on the page component
    // ensures only super-admins can even trigger this server-side execution.
    // We use the Admin SDK to bypass security rules and fetch all tickets.
    
    if (!adminDb) {
        throw new Error("Firebase Admin SDK is not initialized. Cannot fetch support tickets.");
    }
    
    const supportTicketsCol = adminDb.collection('supportTickets');
    const q = supportTicketsCol.orderBy('createdAt', 'desc');
    const snapshot = await q.get();

    if (snapshot.empty) {
        return [];
    }
    
    // The data from the admin SDK needs to be manually processed to match the client-side types
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            ...data,
            id: doc.id,
            // Convert Admin SDK Timestamps to a format that can be serialized
            createdAt: (data.createdAt as adminFirestore.Timestamp).toDate().toISOString(),
        } as unknown as SupportTicket; // We cast here after transformation
    });
}