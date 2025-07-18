
import { db } from './config';
import { collection, addDoc, getDocs, query, doc, setDoc, updateDoc, arrayUnion, serverTimestamp, deleteDoc } from 'firebase/firestore';
import type { Ticket, User, ColumnId, Tag, Comment, AppUser, TicketPriority } from '@/lib/types';
import { getDoc } from 'firebase/firestore';
import { notifyUser } from '@/ai/flows/notify-user-flow';

type CreateTicketArgs = {
  title: string;
  description: string;
  assignedTo: User | null;
  status?: ColumnId;
  priority?: TicketPriority;
  tags?: Tag[];
};

export async function createTicket(args: CreateTicketArgs): Promise<Ticket> {
    const docRef = await addDoc(collection(db, "tickets"), {});

    const newTicketData: Omit<Ticket, 'id'> = {
        title: args.title,
        description: args.description,
        status: args.status || 'backlog',
        priority: args.priority || 'medium',
        tags: args.tags || [],
        comments: [],
        assignedTo: args.assignedTo || undefined,
        createdAt: serverTimestamp() as any, // Let server generate timestamp
    };

    await setDoc(doc(db, "tickets", docRef.id), newTicketData);

    // If assigned to a user, send a notification
    if (newTicketData.assignedTo) {
      try {
          await notifyUser({
              ticketId: docRef.id,
              ticketTitle: newTicketData.title,
              userName: newTicketData.assignedTo.name,
              userEmail: newTicketData.assignedTo.email,
          });
      } catch (error) {
          console.error("Failed to send notification email:", error);
          // We don't re-throw, as the ticket creation itself was successful.
          // In a production app, you might want to add this to a retry queue.
      }
    }


    return { ...newTicketData, id: docRef.id } as Ticket;
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

    const comment: Omit<Comment, 'id' | 'timestamp'> & { timestamp: any } = {
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


export async function deleteTicket(ticketId: string): Promise<void> {
  const ticketRef = doc(db, 'tickets', ticketId);
  await deleteDoc(ticketRef);
}
