
'use server';

import { db } from './config';
import { collection, addDoc, serverTimestamp, Timestamp, getDocs, query, orderBy, doc, setDoc } from 'firebase/firestore';
import type { SupportTicket } from '@/lib/types';
import { getAuth } from 'firebase/auth';

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
    // Therefore, we don't need to re-check roles here.
    
    const supportTicketsCol = collection(db, 'supportTickets');
    const q = query(supportTicketsCol, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as SupportTicket));
}
