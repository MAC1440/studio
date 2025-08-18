
'use client';

import * as React from "react";
import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { updateUserProfile } from "@/lib/firebase/users";
import { deleteUserByAdmin, resetPasswordByAdmin } from "@/lib/firebase/admin";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Search, Edit, Trash2, KeyRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function EditUserDialog({ 
    user,
    isOpen,
    onOpenChange,
    onUserUpdated 
}: { 
    user: User | null, 
    isOpen: boolean,
    onOpenChange: (open: boolean) => void,
    onUserUpdated: () => void 
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<User['role']>('user');
  const { toast } = useToast();

  React.useEffect(() => {
    if (user) {
      setName(user.name);
      setRole(user.role);
    }
  }, [user]);

  const handleUpdate = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await updateUserProfile(user.id, { name, role });
      toast({
        title: "User Updated",
        description: `Details for ${name} have been updated.`,
      });
      onUserUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: `Could not update user. ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User: {user.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Full Name</Label>
            <Input id="edit-name" value={name} onChange={e => setName(e.target.value)} disabled={isSubmitting} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email Address</Label>
            <Input id="edit-email" value={user.email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-role">Role</Label>
            <Select value={role} onValueChange={value => setRole(value as any)} disabled={isSubmitting}>
              <SelectTrigger id="edit-role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="client">Client</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleUpdate} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export function UserManagementTable({ users, organizations, onUserAction }: { users: User[], organizations: Map<string, string>, onUserAction: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userToAction, setUserToAction] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'delete' | 'reset' | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  
  const handleActionClick = (user: User, type: 'delete' | 'reset') => {
    setUserToAction(user);
    setActionType(type);
  };
  
  const handleEditClick = (user: User) => {
    setUserToEdit(user);
    setIsEditOpen(true);
  }

  const handleConfirmAction = async () => {
    if (!userToAction || !actionType) return;
    setIsSubmitting(true);
    try {
      if (actionType === 'delete') {
        await deleteUserByAdmin(userToAction.id);
        toast({ title: "User Deleted", description: `${userToAction.name} has been deleted.` });
      } else if (actionType === 'reset') {
        await resetPasswordByAdmin(userToAction.email);
        toast({ title: "Password Reset Sent", description: `A reset link has been sent to ${userToAction.name}.` });
      }
      onUserAction();
    } catch (error: any) {
      toast({ title: "Action Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setUserToAction(null);
      setActionType(null);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const searchLower = searchQuery.toLowerCase();
      return searchLower
        ? user.name.toLowerCase().includes(searchLower) || user.email.toLowerCase().includes(searchLower)
        : true;
    });
  }, [users, searchQuery]);
  
  const getRoleBadgeVariant = (role: User['role']) => {
    switch (role) {
      case 'super-admin': return 'destructive';
      case 'admin': return 'default';
      case 'client': return 'secondary';
      default: return 'outline';
    }
  }

  const actionDialogContent = {
    delete: {
      title: "Are you absolutely sure?",
      description: `This action cannot be undone. This will permanently delete the user account for ${userToAction?.name} and remove them from Firebase Authentication.`
    },
    reset: {
      title: "Reset Password?",
      description: `This will send a password reset link to ${userToAction?.email}. The user will be prompted to set a new password upon clicking the link.`
    }
  }

  return (
    <AlertDialog>
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name or email..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                const isProtected = user.role === 'super-admin' || user.id === currentUser?.uid;
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatarUrl} alt={user.name} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{organizations.get(user.organizationId || '') || 'N/A'}</TableCell>
                    <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">{user.role}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(user)} disabled={isProtected}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </Button>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="sm" onClick={() => handleActionClick(user, 'reset')} disabled={isProtected}>
                             <KeyRound className="mr-2 h-4 w-4" /> Reset Pass
                           </Button>
                        </AlertDialogTrigger>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" onClick={() => handleActionClick(user, 'delete')} disabled={isProtected}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </Button>
                        </AlertDialogTrigger>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Users className="h-8 w-8" />
                    <p>No users found.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

       <EditUserDialog 
            user={userToEdit}
            isOpen={isEditOpen}
            onOpenChange={setIsEditOpen}
            onUserUpdated={() => {
                onUserAction();
                setUserToEdit(null);
            }}
       />

      {actionType && (
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>{actionDialogContent[actionType].title}</AlertDialogTitle>
                  <AlertDialogDescription>{actionDialogContent[actionType].description}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setUserToAction(null)}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmAction} disabled={isSubmitting}>
                      {isSubmitting ? 'Processing...' : 'Continue'}
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      )}
    </AlertDialog>
  );
}
