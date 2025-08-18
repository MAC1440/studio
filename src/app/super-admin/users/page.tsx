
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { type User, type Organization } from '@/lib/types';
import { getAllUsers, createUser } from '@/lib/firebase/users';
import { getAllOrganizations } from '@/lib/firebase/organizations';
import { UserManagementTable } from './UserManagementTable';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle } from 'lucide-react';


function CreateUserDialog({
  organizations,
  onUserCreated,
}: {
  organizations: Organization[];
  onUserCreated: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!name || !email || !organizationId) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill out all fields.',
        variant: 'destructive',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await createUser({
        name,
        email,
        role,
        organizationId,
      });
      toast({
        title: 'User Invited',
        description: `${name} has been sent an email to set their password.`,
      });
      onUserCreated();
      setIsOpen(false);
      setName('');
      setEmail('');
      setOrganizationId('');
      setRole('user');
    } catch (error: any) {
      toast({
        title: 'Creation Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" /> Invite User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite New User</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="organizationId">Organization</Label>
            <Select
              value={organizationId}
              onValueChange={setOrganizationId}
              disabled={isSubmitting}
            >
              <SelectTrigger id="organizationId">
                <SelectValue placeholder="Assign to an organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as 'admin' | 'user')}
              disabled={isSubmitting}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" disabled={isSubmitting}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Inviting...' : 'Send Invite'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SuperAdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [allUsers, allOrgs] = await Promise.all([
                getAllUsers(),
                getAllOrganizations(),
            ]);
            setUsers(allUsers.filter(u => u.role !== 'client'));
            setOrganizations(allOrgs);
        } catch (error) {
            console.error("Failed to fetch data:", error);
            toast({
                title: "Error",
                description: "Could not fetch users or organizations.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchData();
    }, []);

    const orgMap = new Map(organizations.map(org => [org.id, org.name]));
    
    if (isLoading) {
        return (
            <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-6">User Management</h1>
                <div className="border rounded-lg">
                    <div className="p-4 space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                 <h1 className="text-2xl md:text-3xl font-bold">User Management</h1>
                 <CreateUserDialog organizations={organizations} onUserCreated={fetchData} />
            </div>
            <UserManagementTable 
                users={users} 
                organizations={orgMap}
                onUserAction={fetchData}
            />
        </div>
    )
}
