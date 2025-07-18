
import { db } from './config';
import { collection, addDoc, getDocs, query, doc, setDoc, updateDoc, orderBy } from 'firebase/firestore';
import type { Ticket, User, ColumnId } from '@/lib/types';

type CreateTicketArgs = {
  title: string;
  description: string;
  assignedTo: User | null;
  status?: ColumnId;
};

export async function createTicket(args: CreateTicketArgs): Promise<Ticket> {
    const docRef = await addDoc(collection(db, "tickets"), {});

    const newTicketData: Ticket = {
        id: docRef.id,
        title: args.title,
        description: args.description,
        status: args.status || 'backlog',
        tags: [],
        comments: [],
        assignedTo: args.assignedTo || undefined,
    };

    await setDoc(doc(db, "tickets", docRef.id), newTicketData);

    return newTicketData;
}

export async function getTickets(): Promise<Ticket[]> {
    const ticketsCol = collection(db, 'tickets');
    // It's good practice to order tickets, e.g., by creation time, but we don't have that field yet.
    // For now, no specific order is applied.
    const q = query(ticketsCol);
    const ticketSnapshot = await getDocs(q);
    const ticketList = ticketSnapshot.docs.map(doc => doc.data() as Ticket);
    return ticketList;
}

export async function updateTicketStatus(ticketId: string, status: ColumnId): Promise<void> {
    const ticketRef = doc(db, 'tickets', ticketId);
    await updateDoc(ticketRef, {
        status: status
    });
}
