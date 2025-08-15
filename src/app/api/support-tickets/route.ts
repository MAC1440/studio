
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { type SupportTicket } from '@/lib/types';
import type { firestore as adminFirestore } from 'firebase-admin';

// This is a GET request handler for the /api/support-tickets route.
export async function GET() {
    if (!adminDb) {
        return NextResponse.json({ error: 'Firebase Admin SDK is not initialized' }, { status: 500 });
    }
    
    try {
        const supportTicketsCol = adminDb.collection('supportTickets');
        // Removed orderBy to prevent query failure without a composite index
        const snapshot = await supportTicketsCol.get();

        if (snapshot.empty) {
            return NextResponse.json([]);
        }
        
        const tickets = snapshot.docs.map(doc => {
            const data = doc.data();
            const createdAt = data.createdAt as adminFirestore.Timestamp;
            // Check if createdAt is a valid Timestamp object before calling toDate()
            const createdAtISO = (createdAt && typeof createdAt.toDate === 'function')
                ? createdAt.toDate().toISOString() 
                : new Date().toISOString();

            return {
                ...data,
                id: doc.id,
                // Convert Timestamp to a serializable format (ISO string)
                createdAt: createdAtISO,
            } as unknown as SupportTicket;
        });
        
        return NextResponse.json(tickets);
    } catch (error) {
        console.error("Error fetching support tickets:", error);
        return NextResponse.json({ error: 'Failed to fetch support tickets' }, { status: 500 });
    }
}

