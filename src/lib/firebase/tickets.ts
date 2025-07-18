import { db } from './config';
import { collection, addDoc, getDocs, query, doc, setDoc, updateDoc } from 'firebase/firestore';
import type { Ticket, User, ColumnId } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

type CreateTicketArgs = {
  title: string;
  description: string;
  assignedTo: User | null;
  status?: ColumnId;
};

export async function createTicket(args: CreateTicketArgs): Promise<Ticket> {
  const newTicketData: Omit<Ticket, 'id'> = {
    title: args.title,
    description: args.description,
    status: args.status || 'backlog',
    tags: [], // Default empty tags
    comments: [], // Default empty comments
  };
  
  // Conditionally add assignedTo if it's not null
  if (args.assignedTo) {
    (newTicketData as Ticket).assignedTo = args.assignedTo;
  }

  const docRef = await addDoc(collection(db, "tickets"), newTicketData);
  
  const ticketWithId: Ticket = {
      ...newTicketData,
      id: docRef.id
  } as Ticket;

  await setDoc(doc(db, "tickets", docRef.id), ticketWithId);

  return ticketWithId;
}

export async function getTickets(): Promise<Ticket[]> {
    const ticketsCol = collection(db, 'tickets');
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
