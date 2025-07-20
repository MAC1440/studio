import { db } from './config';
import { collection, addDoc, getDocs, query, doc, setDoc, updateDoc, arrayUnion, serverTimestamp, deleteDoc, where } from 'firebase/firestore';
import type { Ticket, User, ColumnId, Tag, Comment, AppUser, TicketPriority } from '@/lib/types';
import { getDoc } from 'firebase/firestore';
import { sendEmail } from '@/app/actions';
import { addNotification } from './notifications';


async function sendNotificationEmail(ticketId: string, ticketTitle: string, user: User) {
    
    const subject = `You've been assigned a new ticket: "${ticketTitle}"`;
    const htmlBody = `
      <h1>New Ticket Assignment</h1>
      <p>Hi ${user.name},</p>
      <p>You have been assigned a new ticket on KanbanFlow:</p>
      <p><b>Title:</b> ${ticketTitle}</p>
      <p>You can view the ticket on the board.</p>
      <p>Thank you,</p>
      <p>The KanbanFlow Team</p>
    `;

    try {
        await sendEmail({
            to: user.email,
            subject: subject,
            html: htmlBody,
        });
        await addNotification({
            userId: user.id,
            message: `You were assigned a new ticket: "${ticketTitle}"`,
            ticketId: ticketId,
        });
    } catch (error) {
        console.error("Failed to send notification email or add notification:", error);
        // We don't re-throw, as the ticket creation/update itself was successful.
    }
}


type CreateTicketArgs = {
  title: string;
  description: string;
  projectId: string;
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
        projectId: args.projectId,
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
      await sendNotificationEmail(docRef.id, newTicketData.title, newTicketData.assignedTo);
    }

    return { ...newTicketData, id: docRef.id } as Ticket;
}

export async function getTickets({ projectId }: { projectId?: string }): Promise<Ticket[]> {
    const ticketsCol = collection(db, 'tickets');
    
    const conditions = [];
    if (projectId) {
      conditions.push(where('projectId', '==', projectId));
    }
    
    const q = query(ticketsCol, ...conditions);
    
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

export async function updateTicket(ticketId: string, updates: Partial<Omit<Ticket, 'id' | 'comments'>>): Promise<void> {
    const ticketRef = doc(db, 'tickets', ticketId);

    // If assignee is being changed, we need to check if we should notify the new user
    if ('assignedTo' in updates) {
      const ticketSnap = await getDoc(ticketRef);
      if (!ticketSnap.exists()) {
        throw new Error("Ticket not found");
      }
      const currentTicket = ticketSnap.data() as Ticket;
      const newAssignee = updates.assignedTo;
      
      const hadOldAssignee = !!currentTicket.assignedTo;
      const hasNewAssignee = !!newAssignee;
      const wasAssignedToNewUser = hasNewAssignee && (!hadOldAssignee || newAssignee.id !== currentTicket.assignedTo?.id);

      if (wasAssignedToNewUser && newAssignee) {
        await sendNotificationEmail(ticketId, updates.title || currentTicket.title, newAssignee);
      }
    }
    
    // Firestore handles undefined values by not changing them, but for `assignedTo: null` we need to set it properly.
    const finalUpdates = 'assignedTo' in updates ? { ...updates, assignedTo: updates.assignedTo || null } : updates;

    await updateDoc(ticketRef, finalUpdates);
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
