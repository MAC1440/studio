
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Ticket, FolderKanban, DollarSign, CheckCircle } from 'lucide-react';
import { getUsers } from '@/lib/firebase/users';
import { getTickets } from '@/lib/firebase/tickets';
import { getProjects } from '@/lib/firebase/projects';
import { getInvoices } from '@/lib/firebase/invoices';
import { type User, type Ticket as TicketType, type Project, type Invoice } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { startOfMonth, isWithinInterval } from 'date-fns';

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState<'this_month' | 'all'>('this_month');
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [fetchedUsers, fetchedTickets, fetchedProjects, fetchedInvoices] = await Promise.all([
          getUsers(),
          getTickets({}),
          getProjects(),
          getInvoices(),
        ]);
        setUsers(fetchedUsers);
        setTickets(fetchedTickets);
        setProjects(fetchedProjects);
        setInvoices(fetchedInvoices);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast({
          title: 'Error',
          description: 'Could not fetch dashboard data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const openTicketsCount = tickets.filter(t => t.status !== 'done').length;

  const deliveredProjects = projects.filter(p => p.status === 'completed');
  const thisMonthDeliveredProjects = deliveredProjects.filter(p => {
    if (!p.deadline) return false;
    const completionDate = p.deadline.toDate();
    const startOfThisMonth = startOfMonth(new Date());
    return isWithinInterval(completionDate, { start: startOfThisMonth, end: new Date() });
  });

  const displayedDeliveredProjects = projectFilter === 'this_month' ? thisMonthDeliveredProjects.length : deliveredProjects.length;

  const totalEarnings = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, invoice) => sum + invoice.totalAmount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{users.length}</div>
            )}
            <p className="text-xs text-muted-foreground">Registered in the system</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
                <div className="text-2xl font-bold">{openTicketsCount}</div>
            )}
            <p className="text-xs text-muted-foreground">Tickets not in "Done" status</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
                <CardTitle className="text-sm font-medium">Projects Delivered</CardTitle>
                 <Select value={projectFilter} onValueChange={(v: any) => setProjectFilter(v)}>
                    <SelectTrigger className="h-auto w-auto text-xs p-1 px-2 border-none shadow-none focus:ring-0">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="this_month">This Month</SelectItem>
                        <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <Skeleton className="h-8 w-16" />
            ) : (
                <div className="text-2xl font-bold">{displayedDeliveredProjects}</div>
            )}
            <p className="text-xs text-muted-foreground">Projects marked as completed</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <Skeleton className="h-8 w-24" />
            ) : (
                <div className="text-2xl font-bold">{formatCurrency(totalEarnings)}</div>
            )}
            <p className="text-xs text-muted-foreground">From all paid invoices</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
