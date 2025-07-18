
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { type User, type Ticket, TicketPriority, Project } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { createTicket, getTickets } from '@/lib/firebase/tickets';
import { getProjects } from '@/lib/firebase/projects';
import { getUsers } from '@/lib/firebase/users';
import { Skeleton } from '@/components/ui/skeleton';
import { Ticket as TicketIcon } from 'lucide-react';
import TicketDetails from '@/components/kanban/ticket-details';


export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchTicketsAndUsers = async () => {
      // Don't set is loading to true on refetch
      try {
        const [fetchedTickets, fetchedUsers, fetchedProjects] = await Promise.all([getTickets(), getUsers(), getProjects()]);
        setTickets(fetchedTickets.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)));
        setUsers(fetchedUsers);
        setProjects(fetchedProjects);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({
            title: "Error Fetching Data",
            description: "Could not load tickets or users. Please try again later.",
            variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    setIsLoading(true);
    fetchTicketsAndUsers();
  }, [toast]);


  const handleCreateTicket = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const assignedToId = formData.get('assignedTo') as string;
    const tagsString = formData.get('tags') as string;
    const priority = formData.get('priority') as TicketPriority;
    const projectId = formData.get('projectId') as string;

    const assignedTo = users.find(u => u.id === assignedToId) || null;
    const tags = tagsString.split(',').map(tag => ({ id: tag.trim(), label: tag.trim(), color: 'gray' })).filter(t => t.label);


    if (title && description && projectId) {
        try {
            await createTicket({ title, description, assignedTo, tags, priority, projectId });
            await fetchTicketsAndUsers();
            toast({
                title: "Ticket Created",
                description: `Ticket "${title}" has been created.`,
            });
            setIsCreateDialogOpen(false);
        } catch (error: any) {
            console.error("Failed to create ticket:", error);
            toast({
                title: "Error Creating Ticket",
                description: `Could not create ticket. Error: ${error.message}`,
                variant: "destructive",
            });
        }
    }
  };

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDetailDialogOpen(true);
  }

  const onTicketUpdate = async (isDeleted = false) => {
    await fetchTicketsAndUsers();
    if (isDeleted) {
        setIsDetailDialogOpen(false);
        setSelectedTicket(null);
    } else if (selectedTicket) {
        const freshTicket = (await getTickets()).find(t => t.id === selectedTicket?.id);
        if(freshTicket) {
          setSelectedTicket(freshTicket);
        } else {
            // Ticket was likely deleted, close the dialog
            setIsDetailDialogOpen(false);
            setSelectedTicket(null);
        }
    }
  }


  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Ticket Management</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={projects.length === 0}>Create Ticket</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Ticket</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTicket} className="space-y-4">
               <div className="space-y-2">
                  <Label htmlFor="projectId">Project</Label>
                  <Select name="projectId" required>
                    <SelectTrigger id="projectId">
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                           <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select name="priority" defaultValue="medium">
                      <SelectTrigger id="priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input id="tags" name="tags" placeholder="e.g. Frontend, Bug" />
                  <p className="text-xs text-muted-foreground">Comma-separated.</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assign To</Label>
                <Select name="assignedTo">
                  <SelectTrigger id="assignedTo">
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {users.map(user => (
                         <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">Create Ticket</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell>
                     <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-20" />
                  </TableCell>
                </TableRow>
              ))
            ) : tickets.length > 0 ? (
              tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium">{ticket.title}</TableCell>
                   <TableCell>
                      {projects.find(p => p.id === ticket.projectId)?.name || 'N/A'}
                   </TableCell>
                   <TableCell>
                    <Badge variant={ticket.priority === 'critical' || ticket.priority === 'high' ? 'destructive' : 'secondary'} className="capitalize">{ticket.priority}</Badge>
                   </TableCell>
                   <TableCell>
                    <Badge variant="secondary" className="capitalize">{ticket.status.replace('-', ' ')}</Badge>
                   </TableCell>
                  <TableCell>
                    {ticket.assignedTo ? (
                        <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                                <AvatarImage src={ticket.assignedTo.avatarUrl} alt={ticket.assignedTo.name} />
                                <AvatarFallback>{ticket.assignedTo.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{ticket.assignedTo.name}</span>
                        </div>
                    ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleViewTicket(ticket)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        <div className="flex flex-col items-center gap-2">
                            <TicketIcon className="h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground">No tickets found.</p>
                            <Button size="sm" onClick={() => setIsCreateDialogOpen(true)} disabled={projects.length === 0}>Create Ticket</Button>
                        </div>
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        {selectedTicket && <TicketDetails ticket={selectedTicket} onUpdate={onTicketUpdate} />}
      </Dialog>

    </div>
  );
}
