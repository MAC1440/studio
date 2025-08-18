
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
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type Organization, OrganizationPlan, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getAllOrganizations, updateOrganizationPlan, createOrganization } from '@/lib/firebase/organizations';
import { getAllUsers } from '@/lib/firebase/users';
import { Skeleton } from '@/components/ui/skeleton';
import { Building, Search, Edit, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

function CreateOrgDialog({ users, onOrgCreated }: { users: User[], onOrgCreated: () => void}) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [name, setName] = useState('');
    const [ownerId, setOwnerId] = useState('');
    const { toast } = useToast();

    const potentialOwners = useMemo(() => users.filter(u => u.role === 'admin' || u.role === 'super-admin'), [users]);

    const handleSubmit = async () => {
        if (!name || !ownerId) {
            toast({ title: "Missing fields", description: "Please provide a name and select an owner.", variant: "destructive"});
            return;
        }
        setIsSubmitting(true);
        try {
            await createOrganization({ name, ownerId });
            toast({ title: "Organization Created", description: `${name} has been successfully created.`});
            onOrgCreated();
            setIsOpen(false);
            setName('');
            setOwnerId('');
        } catch (error: any) {
            toast({ title: "Creation Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <Button size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" /> Create Organization
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Organization</DialogTitle>
                </DialogHeader>
                 <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="org-name">Organization Name</Label>
                        <Input id="org-name" value={name} onChange={e => setName(e.target.value)} disabled={isSubmitting} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="org-owner">Organization Owner</Label>
                        <Select value={ownerId} onValueChange={setOwnerId} disabled={isSubmitting}>
                            <SelectTrigger id="org-owner">
                                <SelectValue placeholder="Select an owner" />
                            </SelectTrigger>
                            <SelectContent>
                                {potentialOwners.map(user => (
                                    <SelectItem key={user.id} value={user.id}>{user.name} ({user.email})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                         <p className="text-xs text-muted-foreground">Only admins or super-admins can own an organization.</p>
                    </div>
                 </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost" disabled={isSubmitting}>Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create Organization'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | OrganizationPlan>('all');
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<OrganizationPlan>('free');
  
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
        const [fetchedOrgs, fetchedUsers] = await Promise.all([
            getAllOrganizations(),
            getAllUsers(),
        ]);
      setOrganizations(fetchedOrgs.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Failed to fetch organizations:", error);
      toast({
          title: "Error Fetching Data",
          description: "Could not load organization or user data.",
          variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditPlanClick = (org: Organization) => {
    setEditingOrg(org);
    setSelectedPlan(org.subscriptionPlan);
  };
  
  const handlePlanUpdate = async () => {
    if (!editingOrg) return;
    setIsSubmitting(true);
    try {
      await updateOrganizationPlan(editingOrg.id, selectedPlan);
      toast({
        title: "Plan Updated",
        description: `${editingOrg.name}'s plan has been changed to ${selectedPlan}.`
      });
      setEditingOrg(null);
      await fetchData(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: `Could not update plan. ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  const filteredOrgs = useMemo(() => {
    return organizations.filter(org => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchLower 
        ? org.name.toLowerCase().includes(searchLower) || org.id.toLowerCase().includes(searchLower)
        : true;
      const matchesPlan = planFilter !== 'all' ? org.subscriptionPlan === planFilter : true;
      return matchesSearch && matchesPlan;
    });
  }, [organizations, searchQuery, planFilter]);

  const getPlanBadgeVariant = (plan: OrganizationPlan) => {
    switch(plan) {
        case 'pro': return 'destructive';
        case 'startup': return 'default';
        case 'free':
        default: return 'secondary';
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Organization Management</h1>
        <CreateOrgDialog users={users} onOrgCreated={fetchData} />
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name or ID..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={planFilter} onValueChange={(v) => setPlanFilter(v as any)}>
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue placeholder="Filter by plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="startup">Startup</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Owner ID</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-20" /></TableCell>
                </TableRow>
              ))
            ) : filteredOrgs.length > 0 ? (
              filteredOrgs.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell>
                    <Badge variant={getPlanBadgeVariant(org.subscriptionPlan)} className="capitalize">
                      {org.subscriptionPlan}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{org.ownerId}</TableCell>
                  <TableCell>{format(org.createdAt.toDate(), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEditPlanClick(org)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Change Plan
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Building className="h-8 w-8" />
                    <p>No organizations found.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
       <Dialog open={!!editingOrg} onOpenChange={(isOpen) => !isOpen && setEditingOrg(null)}>
        {editingOrg && (
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Change Plan for {editingOrg.name}</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-2">
                    <Label>Subscription Plan</Label>
                    <Select value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as OrganizationPlan)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="startup">Startup</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setEditingOrg(null)} disabled={isSubmitting}>Cancel</Button>
                    <Button onClick={handlePlanUpdate} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
