
import { db } from './config';
import { collection, addDoc, getDocs, query, doc, setDoc, updateDoc, arrayUnion, serverTimestamp, deleteDoc, where, Timestamp } from 'firebase/firestore';
import type { Ticket, User, ColumnId, Tag, Comment, AppUser, TicketPriority, Project } from '@/lib/types';
import { getDoc } from 'firebase/firestore';
import { addNotification } from './notifications';
import { getProject } from './projects';


async function sendAssignmentNotification(ticketId: string, ticketTitle: string, projectId: string, user: User) {
    
    let projectName = 'Unknown Project';
    try {
        const project = await getProject(projectId);
        if (project) {
            projectName = project.name;
        }
    } catch (e) {
        console.error("Could not fetch project name for notification", e);
    }
    
    try {
        await addNotification({
            userId: user.id,
            message: `You were assigned a new ticket: "${ticketTitle}"`,
            ticketId: ticketId,
            projectId: projectId,
            projectName: projectName,
        });
    } catch (error) {
        console.error("Failed to add notification:", error);
        // We don't re-throw, as the ticket creation/update itself was successful.
    }
}


type CreateTicketArgs = {
  title: string;
  description: string;
  projectId: string;
  assignedTo?: User | null;
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
      await sendAssignmentNotification(docRef.id, newTicketData.title, newTicketData.projectId, newTicketData.assignedTo);
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
        await sendAssignmentNotification(ticketId, updates.title || currentTicket.title, currentTicket.projectId, newAssignee);
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
        timestamp: Timestamp.fromDate(new Date())
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
