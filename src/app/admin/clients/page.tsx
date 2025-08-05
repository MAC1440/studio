
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { type User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { createUser, getUsers, deleteUser } from '@/lib/firebase/users';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, Trash2, Send, PlusCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ClientsPage() {
  const [clients, setClients] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const fetchClients = async () => {
    try {
      const fetchedUsers = await getUsers();
      setClients(fetchedUsers.filter(u => u.role === 'client'));
    } catch (error) {
      console.error("Failed to fetch clients:", error);
      toast({
          title: "Error Fetching Clients",
          description: "Could not load client data. Check console for errors.",
          variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchClients();
  }, []);

  const handleCreateClient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    // Auto-generate a random password for clients, as it's required but they will set their own.
    const password = Math.random().toString(36).slice(-8);

    if (name && email) {
      try {
        await createUser({ name, email, password, role: 'client' });
        await fetchClients();
        toast({
          title: "Client Invited",
          description: `${name} has been sent an email to set up their password.`,
        });
        setIsDialogOpen(false);
      } catch (error: any) {
        console.error("Failed to create client:", error);
        toast({
          title: "Error Creating Client",
          description: `Could not create client. Error: ${error.message}`,
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
        setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteUser(userToDelete.id);
      toast({
        title: "Client Deleted",
        description: `Client ${userToDelete.name} has been successfully deleted.`,
      });
      setClients(clients.filter(u => u.id !== userToDelete.id));
    } catch (error: any) {
      console.error("Failed to delete client:", error);
      toast({
        title: "Deletion Failed",
        description: `Could not delete client. ${error.message}`,
        variant: "destructive",
        duration: 9000,
      });
    } finally {
        setIsSubmitting(false);
        setUserToDelete(null);
    }
  };

  return (
    <AlertDialog>
    <div className="max-w-[100vw] overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Client Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
             <Button size="sm">
              <PlusCircle className="md:mr-2"/>
              <span className="hidden md:inline">Invite Client</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New Client</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateClient} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" required disabled={isSubmitting}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" required disabled={isSubmitting}/>
              </div>
              <p className="text-sm text-muted-foreground">An email will be sent to the client with a link to set their password and access their dashboard.</p>
              <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Inviting...' : 'Send Invite'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                       <Skeleton className="h-8 w-28" />
                       <Skeleton className="h-8 w-20" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : clients.length > 0 ? (
              clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={client.avatarUrl} alt={client.name} />
                        <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {client.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                           <Link href={`/admin/invoices/create?clientId=${client.id}`}>
                                <Send className="mr-2 h-4 w-4"/>
                                Send Invoice
                           </Link>
                        </Button>
                       <AlertDialogTrigger asChild>
                         <Button
                           variant="destructive"
                           size="sm"
                           onClick={() => setUserToDelete(client)}
                         >
                           <Trash2 className="mr-2 h-4 w-4" />
                           Delete
                         </Button>
                       </AlertDialogTrigger>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
                <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">
                        <div className="flex flex-col items-center gap-2">
                            <Briefcase className="h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground">No clients found.</p>
                            <Button size="sm" onClick={() => setIsDialogOpen(true)}>Invite Client</Button>
                        </div>
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

       <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the client account
            for <span className="font-bold">{userToDelete?.name}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteUser} disabled={isSubmitting}>
            {isSubmitting ? 'Deleting...' : 'Continue'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>

    </div>
    </AlertDialog>
  );
}
