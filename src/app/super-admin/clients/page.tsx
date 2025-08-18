
'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { type User, type Organization } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { createUser, getAllUsers, deleteUser, updateUserProfile } from '@/lib/firebase/users';
import { getAllOrganizations } from '@/lib/firebase/organizations';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, Trash2, Edit, PlusCircle, Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const USERS_PER_PAGE = 10;

function EditClientDialog({ client, onUserUpdated, children }: { client: User | null, onUserUpdated: () => void, children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (client) {
      setName(client.name);
    }
  }, [client]);

  const handleUpdate = async () => {
    if (!client) return;
    setIsSubmitting(true);
    try {
      await updateUserProfile(client.id, { name });
      toast({
        title: "Client Updated",
        description: `Details for ${name} have been updated.`,
      });
      onUserUpdated();
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: "Error Updating Client",
        description: `Could not update client. Error: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!client) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Client: {client.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Full Name</Label>
            <Input id="edit-name" value={name} onChange={e => setName(e.target.value)} disabled={isSubmitting} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email Address</Label>
            <Input id="edit-email" value={client.email} disabled />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
          <Button onClick={handleUpdate} disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SuperAdminClientsPage() {
  const [clients, setClients] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [orgFilter, setOrgFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchUsersAndOrgs = async () => {
    try {
      const [fetchedUsers, fetchedOrgs] = await Promise.all([getAllUsers(), getAllOrganizations()]);
      setClients(fetchedUsers.filter(u => u.role === 'client').sort((a,b) => a.name.localeCompare(b.name)));
      setOrganizations(fetchedOrgs.sort((a,b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({
          title: "Error Fetching Data",
          description: "Could not load data. Check console for errors.",
          variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchUsersAndOrgs();
  }, []);

  const handleCreateClient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const organizationId = formData.get('organizationId') as string;

    if (name && email && organizationId) {
      try {
        await createUser({ name, email, role: 'client', organizationId });
        await fetchUsersAndOrgs();
        toast({
          title: "Client Invited",
          description: `${name} has been sent an email to set up their password.`,
        });
        setIsCreateDialogOpen(false);
      } catch (error: any) {
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
        description: `Client ${userToDelete.name} has been successfully deleted from the database.`,
      });
      setClients(clients.filter(u => u.id !== userToDelete.id));
    } catch (error: any) {
      toast({
        title: "Deletion Failed",
        description: `Could not delete client from database. ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setUserToDelete(null);
    }
  };

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchLower
        ? client.name.toLowerCase().includes(searchLower) || client.email.toLowerCase().includes(searchLower)
        : true;
      const matchesOrg = orgFilter !== 'all' ? client.organizationId === orgFilter : true;
      return matchesSearch && matchesOrg;
    });
  }, [clients, searchQuery, orgFilter]);

  const totalPages = Math.ceil(filteredClients.length / USERS_PER_PAGE);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE
  );
  
  const getOrgName = (orgId?: string) => organizations.find(o => o.id === orgId)?.name || 'N/A';

  return (
    <AlertDialog>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Client Management</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild><Button size="sm"><PlusCircle className="md:mr-2" />Invite Client</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Invite New Client</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateClient} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" required disabled={isSubmitting} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" name="email" type="email" required disabled={isSubmitting} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organizationId">Organization</Label>
                  <Select name="organizationId" required disabled={isSubmitting}>
                    <SelectTrigger><SelectValue placeholder="Select an organization" /></SelectTrigger>
                    <SelectContent>{organizations.map(org => <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                  <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Sending Invite...' : 'Send Invite'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or email..." className="pl-9" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
          </div>
          <Select value={orgFilter} onValueChange={(value) => { setOrgFilter(value); setCurrentPage(1); }}>
            <SelectTrigger className="w-full max-w-xs"><SelectValue placeholder="Filter by organization" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Organizations</SelectItem>
              {organizations.map(org => <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Client</TableHead><TableHead>Organization</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-48" /></div></div></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell className="text-right"><div className="flex justify-end gap-2"><Skeleton className="h-8 w-20" /><Skeleton className="h-8 w-20" /></div></TableCell>
                  </TableRow>
                ))
              ) : paginatedClients.length > 0 ? (
                paginatedClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar><AvatarImage src={client.avatarUrl} alt={client.name} /><AvatarFallback>{client.name.charAt(0)}</AvatarFallback></Avatar>
                        <div><p className="font-medium">{client.name}</p><p className="text-sm text-muted-foreground">{client.email}</p></div>
                      </div>
                    </TableCell>
                    <TableCell>{getOrgName(client.organizationId)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <EditClientDialog client={client} onUserUpdated={fetchUsersAndOrgs}><Button variant="ghost" size="sm"><Edit className="mr-2 h-4 w-4" />Edit</Button></EditClientDialog>
                        <AlertDialogTrigger asChild><Button variant="destructive" size="sm" onClick={() => setUserToDelete(client)}><Trash2 className="mr-2 h-4 w-4" />Delete</Button></AlertDialogTrigger>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={3} className="h-24 text-center"><p className="text-muted-foreground">No clients found.</p></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-muted-foreground">Showing {filteredClients.length > 0 ? ((currentPage - 1) * USERS_PER_PAGE) + 1 : 0} to {Math.min(currentPage * USERS_PER_PAGE, filteredClients.length)} of {filteredClients.length} clients</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Previous</Button>
            <Button size="sm" variant="outline" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>Next</Button>
          </div>
        </div>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This action will delete the client record for <span className="font-bold">{userToDelete?.name}</span> from the database. It will NOT remove their authentication account. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} disabled={isSubmitting}>{isSubmitting ? 'Deleting...' : 'Continue'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </div>
    </AlertDialog>
  );
}
