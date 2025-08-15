
'use server';

import { initializeFirebaseAdmin } from '@/lib/firebase/admin';
import { type SupportTicket } from '@/lib/types';
import type { firestore as adminFirestore } from 'firebase-admin';

export async function getSupportTickets(): Promise<SupportTicket[]> {
    try {
        const { adminDb } = initializeFirebaseAdmin();
        const supportTicketsCol = adminDb.collection('supportTickets');
        const snapshot = await supportTicketsCol.orderBy('createdAt', 'desc').get();

        if (snapshot.empty) {
            return [];
        }
        
        const tickets = snapshot.docs.map(doc => {
            const data = doc.data();
            // Add a defensive check to ensure createdAt is a valid timestamp
            const firestoreTimestamp = data.createdAt as adminFirestore.Timestamp;
            const createdAt = firestoreTimestamp?.seconds 
                ? { seconds: firestoreTimestamp.seconds, nanoseconds: firestoreTimestamp.nanoseconds }
                : { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }; // Default to now if invalid

            return {
                ...data,
                id: doc.id,
                // Manually convert to a serializable format for the client component
                createdAt,
            } as SupportTicket;
        });
        
        return tickets;
    } catch (error) {
        console.error("Error fetching support tickets:", error);
        // In a real app, you might want to log this error to a monitoring service
        return [];
    }
}
