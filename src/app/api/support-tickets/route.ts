
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
        const snapshot = await supportTicketsCol.get();

        if (snapshot.empty) {
            return NextResponse.json([]);
        }
        
        // Return the raw data as requested for debugging.
        // The client will be responsible for processing the timestamp.
        const tickets = snapshot.docs.map(doc => {
            return {
                ...doc.data(),
                id: doc.id,
            }
        });
        
        return NextResponse.json(tickets);
    } catch (error) {
        console.error("Error fetching support tickets:", error);
        return NextResponse.json({ error: 'Failed to fetch support tickets' }, { status: 500 });
    }
}
