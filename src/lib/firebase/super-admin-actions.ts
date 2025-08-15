
'use server';

import { adminDb } from '@/lib/firebase/admin';
import { type SupportTicket } from '@/lib/types';
import type { firestore as adminFirestore } from 'firebase-admin';

export async function getSupportTickets(): Promise<SupportTicket[]> {
    if (!adminDb) {
        console.error('Firebase Admin SDK is not initialized');
        return [];
    }
    
    try {
        const supportTicketsCol = adminDb.collection('supportTickets');
        const snapshot = await supportTicketsCol.orderBy('createdAt', 'desc').get();

        if (snapshot.empty) {
            return [];
        }
        
        const tickets = snapshot.docs.map(doc => {
            const data = doc.data();
            const firestoreTimestamp = data.createdAt as adminFirestore.Timestamp;
            return {
                ...data,
                id: doc.id,
                // Manually convert to a serializable format for the client component
                createdAt: {
                    seconds: firestoreTimestamp.seconds,
                    nanoseconds: firestoreTimestamp.nanoseconds,
                }
            } as SupportTicket;
        });
        
        return tickets;
    } catch (error) {
        console.error("Error fetching support tickets:", error);
        // In a real app, you might want to log this error to a monitoring service
        return [];
    }
}
