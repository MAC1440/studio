
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { type User, type Organization } from '@/lib/types';
import { getAllUsers, createUser } from '@/lib/firebase/users';
import { getAllOrganizations } from '@/lib/firebase/organizations';
import { UserManagementTable } from '../users/UserManagementTable';
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

function CreateClientDialog({
  organizations,
  onClientCreated,
}: {
  organizations: Organization[];
  onClientCreated: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organizationId, setOrganizationId] = useState('');
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
        role: 'client',
        organizationId,
      });
      toast({
        title: 'Client Invited',
        description: `${name} has been sent an email to set their password.`,
      });
      onClientCreated();
      setIsOpen(false);
      setName('');
      setEmail('');
      setOrganizationId('');
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
          <PlusCircle className="mr-2 h-4 w-4" /> Invite Client
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite New Client</DialogTitle>
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

export default function SuperAdminClientsPage() {
    const [clients, setClients] = useState<User[]>([]);
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
            setClients(allUsers.filter(u => u.role === 'client'));
            setOrganizations(allOrgs);
        } catch (error) {
            console.error("Failed to fetch data:", error);
            toast({
                title: "Error",
                description: "Could not fetch clients or organizations.",
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
                <h1 className="text-2xl md:text-3xl font-bold mb-6">Client Management</h1>
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
                <h1 className="text-2xl md:text-3xl font-bold">Client Management</h1>
                <CreateClientDialog organizations={organizations} onClientCreated={fetchData} />
            </div>
            <UserManagementTable 
                users={clients} 
                organizations={orgMap}
                onUserAction={fetchData}
            />
        </div>
    )
}
