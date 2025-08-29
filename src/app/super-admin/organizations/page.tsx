
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type Organization, OrganizationPlan } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getAllOrganizations, updateOrganizationPlan } from '@/lib/firebase/organizations';
import { deleteOldNotifications } from '@/lib/firebase/notifications';
import { Skeleton } from '@/components/ui/skeleton';
import { Building, Search, Edit, Calendar as CalendarIcon, AlertTriangle, Trash2 } from 'lucide-react';
import { format, isBefore, addDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';


export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | OrganizationPlan>('all');
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<OrganizationPlan>('free');
  const [expiryDate, setExpiryDate] = useState<Date | undefined>();
  
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const fetchedOrgs = await getAllOrganizations();
      setOrganizations(fetchedOrgs);
    } catch (error) {
      console.error("Failed to fetch organizations:", error);
      toast({
          title: "Error Fetching Orgs",
          description: "Could not load organization data.",
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
    setExpiryDate(org.planExpiryDate?.toDate());
  };
  
  const handlePlanUpdate = async () => {
    if (!editingOrg) return;
    
    if(selectedPlan !== 'free' && !expiryDate) {
        toast({
            title: "Expiry Date Required",
            description: "Please set an expiry date for paid plans.",
            variant: "destructive"
        });
        return;
    }

    setIsSubmitting(true);
    try {
      const updates: Partial<Organization> = { 
        subscriptionPlan: selectedPlan,
        planExpiryDate: selectedPlan === 'free' ? undefined : Timestamp.fromDate(expiryDate!),
      };

      await updateOrganizationPlan(editingOrg.id, updates);
      toast({
        title: "Plan Updated",
        description: `${editingOrg.name}'s plan has been changed.`
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

  const handleDeleteOldNotifications = async () => {
      setIsDeleting(true);
      try {
          const count = await deleteOldNotifications();
          toast({
              title: "Cleanup Successful",
              description: `${count} old notifications have been deleted.`
          })
      } catch (error) {
          toast({
              title: "Cleanup Failed",
              description: "Could not delete old notifications.",
              variant: "destructive"
          })
      } finally {
          setIsDeleting(false);
      }
  }


  const filteredOrgs = useMemo(() => {
    let sortedOrgs = [...organizations];
    
    // Sort by plan expiry date, soonest first. Nulls (free plans) go to the bottom.
    sortedOrgs.sort((a, b) => {
        const aDate = a.planExpiryDate?.toMillis();
        const bDate = b.planExpiryDate?.toMillis();
        if(aDate && bDate) return aDate - bDate;
        if(aDate) return -1; // a has date, b doesn't, so a comes first
        if(bDate) return 1; // b has date, a doesn't, so b comes first
        return 0; // neither has a date
    });

    return sortedOrgs.filter(org => {
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
    <AlertDialog>
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Organization Management</h1>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Cleanup Notifications
          </Button>
        </AlertDialogTrigger>
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
              <TableHead>Expires On</TableHead>
              <TableHead>Owner ID</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-20" /></TableCell>
                </TableRow>
              ))
            ) : filteredOrgs.length > 0 ? (
              filteredOrgs.map((org) => {
                const expiry = org.planExpiryDate?.toDate();
                const isExpiringSoon = expiry ? isBefore(expiry, addDays(new Date(), 7)) : false;

                return (
                <TableRow key={org.id} className={cn(isExpiringSoon && "bg-amber-100/50 dark:bg-amber-900/20")}>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell>
                    <Badge variant={getPlanBadgeVariant(org.subscriptionPlan)} className="capitalize">
                      {org.subscriptionPlan}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {expiry ? (
                        <div className="flex items-center gap-2">
                           {isExpiringSoon && <AlertTriangle className="h-4 w-4 text-amber-500"/>}
                           {format(expiry, 'MMM d, yyyy')}
                        </div>
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{org.ownerId}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEditPlanClick(org)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Change Plan
                    </Button>
                  </TableCell>
                </TableRow>
              )})
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
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
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
                     {selectedPlan !== 'free' && (
                        <div className="space-y-2">
                            <Label>Plan Expiry Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !expiryDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {expiryDate ? format(expiryDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={expiryDate}
                                    onSelect={setExpiryDate}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}
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
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will permanently delete all notifications older than 7 days from the database. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteOldNotifications} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Confirm'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </div>
    </AlertDialog>
  );
}
