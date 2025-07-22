
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LayoutGrid, User as UserIcon, LogOut, Settings, Shield, LogIn, Bell, Ticket, FolderKanban } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '../ui/skeleton';
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
import { useToast } from '@/hooks/use-toast';
import { createTicket } from '@/lib/firebase/tickets';
import { getProjects } from '@/lib/firebase/projects';
import { type User, type Notification, Project } from '@/lib/types';
import { subscribeToNotifications, markNotificationAsRead } from '@/lib/firebase/notifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Separator } from '../ui/separator';
import { useRouter } from 'next/navigation';

function CreateTicketDialog({ users, projects, onTicketCreated }: { users: User[], projects: Project[], onTicketCreated: () => void }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleCreateTicket = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(event.currentTarget);
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const assignedToId = formData.get('assignedTo') as string;
        const projectId = formData.get('projectId') as string;

        const assignedTo = users.find(u => u.id === assignedToId) || null;

        if (title && description && projectId) {
            try {
                await createTicket({ title, description, assignedTo, projectId });
                toast({
                    title: "Ticket Created",
                    description: `Ticket "${title}" has been created.`,
                });
                setIsDialogOpen(false);
                onTicketCreated();
            } catch (error: any) {
                console.error("Failed to create ticket:", error);
                toast({
                    title: "Error Creating Ticket",
                    description: `Could not create ticket. Error: ${error.message}`,
                    variant: "destructive",
                });
            } finally {
                setIsSubmitting(false);
            }
        } else {
             if (!projectId) {
                toast({
                    title: "Project Required",
                    description: `Please select a project for the ticket.`,
                    variant: "destructive",
                });
            }
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">Create Ticket</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Ticket</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateTicket} className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="projectId">Project</Label>
                        <Select name="projectId" required disabled={isSubmitting}>
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
                        <Input id="title" name="title" required disabled={isSubmitting} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" required disabled={isSubmitting} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="assignedTo">Assign To</Label>
                        <Select name="assignedTo" disabled={isSubmitting}>
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
                            <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Create Ticket'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function NotificationBell() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (user?.uid) {
            const unsubscribe = subscribeToNotifications(user.uid, setNotifications);
            return () => unsubscribe();
        }
    }, [user]);

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            await markNotificationAsRead(notification.id);
        }
        if(notification.projectId) {
            router.push(`/board/${notification.projectId}`);
        }
        setIsOpen(false);
    };
    
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
                <div className="p-4">
                    <h4 className="font-medium text-sm">Notifications</h4>
                </div>
                <Separator />
                <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                        notifications.map(n => (
                            <div key={n.id}>
                                <div
                                    className={cn(
                                        "flex items-start gap-3 p-4 hover:bg-muted/50 cursor-pointer",
                                        !n.read && "bg-accent/50"
                                    )}
                                    onClick={() => handleNotificationClick(n)}
                                >
                                    <div className="mt-1">
                                        <Ticket className={cn("h-5 w-5", !n.read ? "text-primary" : "text-muted-foreground")} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm">{n.message}</p>
                                        {n.projectName && (
                                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                                                <FolderKanban className="h-3 w-3" />
                                                {n.projectName}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {n.createdAt ? formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                                        </p>
                                    </div>
                                </div>
                                <Separator />
                            </div>
                        ))
                    ) : (
                        <p className="p-4 text-sm text-center text-muted-foreground">No new notifications</p>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

export default function AppHeader() {
  const { user, userData, logout, loading, users, reloadTickets } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
      if(user) {
          getProjects().then(setProjects).catch(console.error);
      }
  }, [user]);
  
  const handleTicketCreated = () => {
    if (reloadTickets) {
        reloadTickets();
    }
  }

  return (
    <header className="border-b border-border/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <Link href="/board" className="flex items-center gap-2">
          <LayoutGrid className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold tracking-tight">BoardR</span>
        </Link>
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="flex items-center gap-4">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          ) : user ? (
            <>
              <CreateTicketDialog users={users} projects={projects} onTicketCreated={handleTicketCreated}/>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-9 w-9 cursor-pointer">
                    <AvatarImage src={userData?.avatarUrl} alt={userData?.name} />
                    <AvatarFallback>{userData?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <p className="font-medium">{userData?.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  {userData?.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild>
              <Link href="/">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
