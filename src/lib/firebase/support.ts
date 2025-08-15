
'use server';

import { db } from './config';
import { collection, addDoc, serverTimestamp, Timestamp, doc, setDoc, getDocs, query, updateDoc } from 'firebase/firestore';
import type { SupportTicket, User } from '@/lib/types';
import { getDoc } from 'firebase/firestore';
import { getSuperAdmins, getUsers } from './users';
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
    try {
        const superAdmins = await getSuperAdmins();
        const notificationPromises = superAdmins.map(admin => 
            addNotification({
                userId: admin.id,
                message: `New support request from ${args.organization.name} for plan change.`,
                supportTicketId: docRef.id,
            })
        );
        await Promise.all(notificationPromises);
    } catch(e) {
        console.error("Failed to send notification to super admins:", e);
    }
    
    // Fetch owner details to send email
    try {
        const ownerRef = doc(db, 'users', args.organization.ownerId);
        const ownerSnap = await getDoc(ownerRef);
        if (!ownerSnap.exists()) {
            throw new Error("Organization owner not found.");
        }
        const ownerData = ownerSnap.data() as User;

        const emailPayload = {
            userName: args.requester.name,
            userEmail: args.requester.email,
            organizationName: args.organization.name,
            ownerEmail: ownerData.email,
            currentPlan: args.requestDetails.currentPlan,
            requestedPlan: args.requestDetails.requestedPlan,
            planPrice: args.requestDetails.price,
        };

        // Use fetch to call our new API endpoint
        // The URL needs to be absolute when calling from a server component.
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
        const response = await fetch(`${appUrl}/api/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailPayload),
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody.error || "Failed to trigger email sending API.");
        }

    } catch(e) {
        console.error("Failed to send plan change email", e);
        // We don't re-throw, as the ticket was created successfully.
        // This can be monitored and retried separately.
    }
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
