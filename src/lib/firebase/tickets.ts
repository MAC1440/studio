
import { db } from './config';
import { collection, addDoc, getDocs, query, doc, setDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import type { Ticket, User, ColumnId, Tag, Comment, AppUser } from '@/lib/types';
import { getDoc } from 'firebase/firestore';

type CreateTicketArgs = {
  title: string;
  description: string;
  assignedTo: User | null;
  status?: ColumnId;
  tags?: Tag[];
};

export async function createTicket(args: CreateTicketArgs): Promise<Ticket> {
    const docRef = await addDoc(collection(db, "tickets"), {});

    const newTicketData: Ticket = {
        id: docRef.id,
        title: args.title,
        description: args.description,
        status: args.status || 'backlog',
        tags: args.tags || [],
        comments: [],
        assignedTo: args.assignedTo || undefined,
    };

    await setDoc(doc(db, "tickets", docRef.id), newTicketData);

    return newTicketData;
}

export async function getTickets(): Promise<Ticket[]> {
    const ticketsCol = collection(db, 'tickets');
    const q = query(ticketsCol);
    const ticketSnapshot = await getDocs(q);
    const ticketList = ticketSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
      } as Ticket;
    });
    return ticketList;
}

export async function updateTicketStatus(ticketId: string, status: ColumnId): Promise<void> {
    const ticketRef = doc(db, 'tickets', ticketId);
    await updateDoc(ticketRef, {
        status: status
    });
}

type AddCommentArgs = {
    userId: string;
    message: string;
}
export async function addCommentToTicket(ticketId: string, {userId, message}: AddCommentArgs): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if(!userSnap.exists()){
        throw new Error("User not found");
    }
    const userData = userSnap.data() as AppUser;

    const comment: Omit<Comment, 'id'> = {
        user: {
            id: userData.id,
            name: userData.name,
            avatarUrl: userData.avatarUrl
        },
        message: message,
        timestamp: serverTimestamp()
    };
    
    const ticketRef = doc(db, 'tickets', ticketId);
    await updateDoc(ticketRef, {
        comments: arrayUnion(comment)
    });
}
