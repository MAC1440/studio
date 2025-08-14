
'use server';

import { db } from './config';
import { collection, addDoc, serverTimestamp, Timestamp, getDocs, query, orderBy, doc, setDoc } from 'firebase/firestore';
import type { SupportTicket } from '@/lib/types';
import * as admin from 'firebase-admin';

// Initialize the admin app if it hasn't been already
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY
                    ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
                    : undefined,
            }),
        });
    } catch (error) {
        console.error('Firebase admin initialization error', error);
    }
}

const adminDb = admin.apps.length ? admin.firestore() : null;

type CreateSupportTicketArgs = Omit<SupportTicket, 'id' | 'createdAt' | 'status'>;

/**
 * Creates a new support ticket in the `supportTickets` collection.
 * This is used for internal tracking of user requests, like plan changes.
 */
export async function createSupportTicket(args: CreateSupportTicketArgs): Promise<void> {
    const supportTicketsCol = collection(db, 'supportTickets');
    const docRef = doc(supportTicketsCol); // Create a reference to get an ID first
    
    const newTicket: SupportTicket = {
        id: docRef.id, // Include the ID in the document data
        ...args,
        status: 'open',
        createdAt: serverTimestamp() as Timestamp,
    };

    await setDoc(docRef, newTicket); // Use setDoc to save the complete object
    
    // In the future, you could also add a notification for the super admin here.
}


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
            createdAt: (data.createdAt as admin.firestore.Timestamp).toDate().toISOString(),
        } as unknown as SupportTicket; // We cast here after transformation
    });
}
