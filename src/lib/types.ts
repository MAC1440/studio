export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'admin' | 'user';
};

export type Tag = {
  id: string;
  label: string;
  color: string;
};

export type Comment = {
  id:string;
  user: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  timestamp: string;
  message: string;
};

export type ColumnId = 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';

export type Ticket = {
  id: string;
  title: string;
  description: string;
  status: ColumnId;
  tags: Tag[];
  assignedTo?: User;
  epicId?: string;
  comments: Comment[];
};

export type Column = {
  id: ColumnId;
  title: string;
  tickets: Ticket[];
};
