
import type { Timestamp } from 'firebase/firestore';

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'admin' | 'user';
};

// Renamed from User to avoid conflict with Firebase's User type
export type AppUser = User;

export type Project = {
  id: string;
  name: string;
  description: string;
  createdAt: Timestamp;
};

export type Tag = {
  id: string;
  label: string;
  color: string;
};

export type Comment = {
  id?:string;
  user: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  timestamp: Timestamp;
  message: string;
};

export type ColumnId = 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

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
    ticketId: string;
    read: boolean;
    createdAt: Timestamp;
    expiresAt: Timestamp;
    projectId?: string;
    projectName?: string;
}
