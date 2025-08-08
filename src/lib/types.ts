
import type { Timestamp } from 'firebase/firestore';

export type Organization = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Timestamp;
  subscriptionPlan?: 'free' | 'pro' | 'enterprise';
  stripeCustomerId?: string;
};

export type User = {
  id:string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'admin' | 'user' | 'client';
  organizationId: string;
};

// Renamed from User to avoid conflict with Firebase's User type
export type AppUser = User;

export type ProjectStatus = 'on-track' | 'at-risk' | 'off-track' | 'completed' | 'on-hold';

export type Project = {
  id: string;
  name: string;
  description: string;
  createdAt: Timestamp;
  clientIds?: string[];
  deadline?: Timestamp;
  status?: ProjectStatus;
  organizationId: string;
};

export type Proposal = {
  id:string;
  title: string;
  content: string; // Rich text content
  clientId: string;
  clientName: string; // denormalized for easy display
  projectId: string; // Added to link proposal to a project
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'changes-requested';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  feedback?: Comment[];
  actingUser?: { id: string; name: string }; // Temporary field for notifications
  organizationId: string;
}

export type InvoiceItem = {
    id: string;
    description: string;
    amount: number;
}

export type Invoice = {
    id: string;
    title: string;
    description?: string;
    clientId: string;
    clientName: string;
    projectId: string;
    projectName: string;
    type: 'lump-sum' | 'itemized';
    lumpSumAmount: number;
    items: InvoiceItem[];
    totalAmount: number;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'expired' | 'changes-requested';
    validUntil: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    feedback?: Comment[];
    actingUser?: { id: string; name: string }; // Temporary field for notifications
    organizationId: string;
}


export type Tag = {
  id: string;
  label: string;
  color: string;
};

export type Comment = {
  id?:string;
  user: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  timestamp: Timestamp | Date;
  message: string;
};

export type ColumnId = 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

export type ChecklistItem = {
    id: string;
    text: string;
    completed: boolean;
}

export type Ticket = {
  id: string;
  title: string;
  description: string;
  status: ColumnId;
  priority: TicketPriority;
  tags: Tag[];
  assignedTo?: User;
  projectId: string;
  comments: Comment[];
  createdAt: Timestamp;
  checklist?: ChecklistItem[];
  deadline?: Timestamp;
  loggedHours?: number;
  organizationId: string;
};

export type Column = {
  id: ColumnId;
  title: string;
  tickets: Ticket[];
};

export type Notification = {
    id: string;
    userId: string;
    message: string;
    ticketId?: string; // Optional
    proposalId?: string; // Optional
    invoiceId?: string; // Optional
    read: boolean;
    createdAt: Timestamp;
    expiresAt: Timestamp;
    projectId?: string;
    projectName?: string;
}
