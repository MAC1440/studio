
'use server';

import { db } from './config';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { SupportTicket } from '@/lib/types';

type CreateSupportTicketArgs = Omit<SupportTicket, 'id' | 'createdAt' | 'status'>;

/**
 * Creates a new support ticket in the `supportTickets` collection.
 * This is used for internal tracking of user requests, like plan changes.
 */
export async function createSupportTicket(args: CreateSupportTicketArgs): Promise<void> {
    const supportTicketsCol = collection(db, 'supportTickets');
    
    const newTicket: Omit<SupportTicket, 'id'> = {
        ...args,
        status: 'open',
        createdAt: serverTimestamp() as Timestamp,
    };

    await addDoc(supportTicketsCol, newTicket);
    
    // In the future, you could also add a notification for the super admin here.
}
