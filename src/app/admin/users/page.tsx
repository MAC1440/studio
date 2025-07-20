
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { type User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { createUser, getUsers, deleteUser, updateUser } from '@/lib/firebase/users';
import { updateUserAuth } from '@/app/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Users as UsersIcon, Trash2, Edit } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const fetchUsers = async () => {
    try {
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({
          title: "Error Fetching Users",
          description: "Could not load user data. Check console for errors.",
          variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchUsers();
  }, []);

  const closeDialog = () => {
    setIsDialogOpen(false);
    setUserToEdit(null);
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as 'admin' | 'user';

    try {
      if (userToEdit) {
        // --- EDIT USER LOGIC ---
        // Update Firestore document
        await updateUser(userToEdit.id, { name, email, role });

        // Update Auth if email or password changed
        if (email !== userToEdit.email || password) {
          const authResult = await updateUserAuth({ uid: userToEdit.id, email, password });
          if (!authResult.success) {
            throw new Error(authResult.error);
          }
        }
        
        toast({ title: "User Updated", description: `${name}'s details have been updated.` });
      } else {
        // --- CREATE USER LOGIC ---
        if (!password) {
            toast({ title: "Password Required", description: "A password is required for new users.", variant: "destructive" });
            setIsSubmitting(false);
            return;
        }
        await createUser({ name, email, password, role });
        toast({ title: "User Created", description: `${name} has been added to the system.` });
      }

      await fetchUsers();
      closeDialog();
    } catch (error: any) {
      console.error("Failed to save user:", error);
      toast({
        title: userToEdit ? "Error Updating User" : "Error Creating User",
        description: `Could not save user. Error: ${error.message}`,
        variant: "destructive",
        duration: 9000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteUser(userToDelete.id);
      toast({
        title: "User Deleted",
        description: `User ${userToDelete.name} has been successfully deleted from the application database.`,
      });
      setUsers(users.filter(u => u.id !== userToDelete.id));
    } catch (error: any) {
      console.error("Failed to delete user:", error);
      toast({
        title: "Deletion Failed",
        description: `Could not delete user. ${error.message}`,
        variant: "destructive",
        duration: 9000,
      });
    } finally {
        setIsSubmitting(false);
        setUserToDelete(null);
    }
  };
  
  const openEditDialog = (user: User) => {
    setUserToEdit(user);
    setIsDialogOpen(true);
  };
  
  const openCreateDialog = () => {
    setUserToEdit(null);
    setIsDialogOpen(true);
  };

  return (
    <AlertDialog>
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <Button onClick={openCreateDialog}>Create User</Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{userToEdit ? 'Edit User' : 'Create New User'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" required disabled={isSubmitting} defaultValue={userToEdit?.name ?? ''}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" required disabled={isSubmitting} defaultValue={userToEdit?.email ?? ''}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required={!userToEdit}
                  placeholder={userToEdit ? 'Leave blank to keep current password' : ''}
                  disabled={isSubmitting}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select name="role" defaultValue={userToEdit?.role ?? 'user'} disabled={isSubmitting}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline" onClick={closeDialog} disabled={isSubmitting}>Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>


      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
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
                  <TableCell>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-20" />
                       <Skeleton className="h-8 w-20" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id} className={user.id === currentUser?.uid ? 'bg-muted/50' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                        <Edit className="mr-2 h-4 w-4"/>
                        Edit
                      </Button>
                       <AlertDialogTrigger asChild>
                         <Button
                           variant="destructive"
                           size="sm"
                           onClick={() => setUserToDelete(user)}
                           disabled={user.id === currentUser?.uid}
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
                    <TableCell colSpan={3} className="h-24 text-center">
                        <div className="flex flex-col items-center gap-2">
                            <UsersIcon className="h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground">No users found.</p>
                            <Button size="sm" onClick={openCreateDialog}>Create User</Button>
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
            This action cannot be undone. This will permanently delete the user account
            for <span className="font-bold">{userToDelete?.name}</span> from the application database. Their authentication account will remain.
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
