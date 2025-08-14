// src/lib/firebase/super-admin-actions.ts
'use server';

import { adminDb } from './admin';
import type { SupportTicket } from '@/lib/types';
import type { firestore as adminFirestore } from 'firebase-admin';

// This file acts as a boundary for server actions.
// Client components can import from this file, and Next.js will ensure
// the functions are treated as server actions, keeping the admin-sdk
// code out of the client bundle.

export async function getAllSupportTickets(): Promise<SupportTicket[]> {
    if (!adminDb) {
        throw new Error("Firebase Admin SDK is not initialized. Cannot fetch support tickets.");
    }
    
    const supportTicketsCol = adminDb.collection('supportTickets');
    const q = supportTicketsCol.orderBy('createdAt', 'desc');
    const snapshot = await q.get();

    if (snapshot.empty) {
        return [];
    }
    
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            ...data,
            id: doc.id,
            createdAt: (data.createdAt as adminFirestore.Timestamp).toDate().toISOString(),
        } as unknown as SupportTicket;
    });
}
