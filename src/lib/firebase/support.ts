
'use server';

import { db } from './config';
import { collection, addDoc, serverTimestamp, Timestamp, doc, setDoc, getDocs, query, updateDoc, deleteDoc, where, writeBatch } from 'firebase/firestore';
import type { SupportTicket, User } from '@/lib/types';
import { getDoc } from 'firebase/firestore';
import { getUsers } from './users';
import { getSuperAdmins } from './super-admin-actions';
import { addNotification } from './notifications';


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

    await setDoc(docRef, newTicket);

    // Notify all super admins
    const superAdmins = await getSuperAdmins();
    const notificationPromises = superAdmins.map(admin => 
        addNotification({
            userId: admin.id,
            message: `New support request from ${args.organization.name} for plan change.`,
            supportTicketId: docRef.id,
        })
    );
    await Promise.all(notificationPromises);
}

/**
 * Fetches all support tickets.
 * This function is intended to be called from a server component or route.
 */
export async function getSupportTickets(): Promise<SupportTicket[]> {
    const ticketsCol = collection(db, 'supportTickets');
    const snapshot = await getDocs(ticketsCol);
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupportTicket));
}

export async function updateSupportTicketStatus(ticketId: string, status: SupportTicket['status']): Promise<void> {
    const ticketRef = doc(db, 'supportTickets', ticketId);
    await updateDoc(ticketRef, { status });

    // Notify organization admins of the status change
    try {
        const ticketSnap = await getDoc(ticketRef);
        if (ticketSnap.exists()) {
            const ticket = ticketSnap.data() as SupportTicket;
            const orgUsers = await getUsers(ticket.organization.id);
            const orgAdmins = orgUsers.filter(user => user.role === 'admin');

            const notificationPromises = orgAdmins.map(admin => 
                addNotification({
                    userId: admin.id,
                    message: `Your support request for ${ticket.organization.name} was updated to "${status}".`,
                    supportTicketId: ticketId,
                })
            );
            await Promise.all(notificationPromises);
        }
    } catch (e) {
        console.error(`Failed to send status update notification for ticket ${ticketId}:`, e);
    }
}

export async function deleteSupportTicket(ticketId: string): Promise<void> {
    const ticketRef = doc(db, 'supportTickets', ticketId);
    await deleteDoc(ticketRef);
}

export async function deleteClosedSupportTickets(): Promise<void> {
    const ticketsCol = collection(db, 'supportTickets');
    const q = query(ticketsCol, where('status', '==', 'closed'));
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return;
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();
}
