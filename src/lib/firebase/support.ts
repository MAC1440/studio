
'use server';

import { db } from './config';
import { collection, addDoc, serverTimestamp, Timestamp, doc, setDoc } from 'firebase/firestore';
import type { SupportTicket, User } from '@/lib/types';
import { getDoc } from 'firebase/firestore';


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
