
import type { Timestamp } from 'firebase/firestore';

export type OrganizationPlan = 'free' | 'startup' | 'pro';

export type Organization = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Timestamp;
  subscriptionPlan: OrganizationPlan;
  planExpiryDate?: Timestamp;
  stripeCustomerId?: string;
  aiProposalCount?: number;
  aiProposalCountLastReset?: Timestamp;
};

export type User = {
  id:string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'admin' | 'user' | 'client' | 'super-admin';
  organizationId?: string; // Optional for super-admin
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

export type Document = {
  id: string;
  title: string;
  content: string; // Rich text content
  projectId: string;
  organizationId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
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

export type ClientReport = {
    id: string;
    title: string;
    description: string; // Rich text
    clientId: string;
    clientName: string;
    projectId: string;
    projectName: string;
    organizationId: string;
    status: 'new' | 'viewed' | 'archived';
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export type SupportTicket = {
    id: string;
    requester: {
        id: string;
        name: string;
        email: string;
    };
    organization: {
        id: string;
        name: string;
        ownerId: string;
    };
    requestDetails: {
        currentPlan: string;
        requestedPlan: string;
        price: string;
    };
    status: 'open' | 'in-progress' | 'closed';
    createdAt: string; // Should be a string after serialization
};


export type ChatMessage = {
    id: string;
    sender: Pick<User, 'id' | 'name' | 'avatarUrl' | 'role'>;
    text: string;
    timestamp: Timestamp;
};

export type Chat = {
    id: string;
    projectId: string;
    organizationId: string;
    userIds: string[];
    lastMessage?: {
        text: string;
        timestamp: Timestamp;
    }
    createdAt: Timestamp;
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
  updatedAt?: Timestamp; // Add this for sorting recent activity
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
    ticketId?: string;
    proposalId?: string;
    invoiceId?: string;
    reportId?: string;
    chatId?: string;
    supportTicketId?: string;
    read: boolean;
    createdAt: Timestamp;
    expiresAt: Timestamp;
    projectId?: string;
    projectName?: string;
}
