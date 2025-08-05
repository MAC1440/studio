
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Ticket, FolderKanban, DollarSign, CheckCircle, RefreshCw, PlusCircle, GanttChartSquare } from 'lucide-react';
import { getUsers } from '@/lib/firebase/users';
import { getTickets } from '@/lib/firebase/tickets';
import { getProjects } from '@/lib/firebase/projects';
import { getInvoices } from '@/lib/firebase/invoices';
import { type User, type Ticket as TicketType, type Project, type Invoice } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { startOfMonth, isWithinInterval } from 'date-fns';
import { Separator } from '@/components/ui/separator';

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

  // --- Metric Calculations ---

  // User & Ticket Metrics
  const openTicketsCount = tickets.filter(t => t.status !== 'done').length;

  // Project Metrics
  const startOfThisMonth = startOfMonth(new Date());
  
  const inProgressProjects = projects.filter(p => p.status !== 'completed').length;
  
  const newThisMonthProjects = projects.filter(p => {
      const createdAt = p.createdAt?.toDate();
      return createdAt && isWithinInterval(createdAt, { start: startOfThisMonth, end: new Date() });
  }).length;
  
  const deliveredProjectsAllTime = projects.filter(p => p.status === 'completed');
  const deliveredProjectsThisMonth = deliveredProjectsAllTime.filter(p => {
    if (!p.deadline) return false; // Or use a different completion date field if available
    const completionDate = p.deadline.toDate();
    return isWithinInterval(completionDate, { start: startOfThisMonth, end: new Date() });
  });

  const displayedDeliveredProjects = projectFilter === 'this_month' ? deliveredProjectsThisMonth.length : deliveredProjectsAllTime.length;

  // Earnings Metrics
  const totalEarnings = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, invoice) => sum + invoice.totalAmount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  const StatCard = ({ title, value, icon, description, isLoading }: { title: string, value: string | number, icon: React.ReactNode, description: string, isLoading: boolean }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{value}</div>}
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
  )

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
         <StatCard title="Total Earnings" value={formatCurrency(totalEarnings)} icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} description="From all paid invoices" isLoading={isLoading} />
         <StatCard title="Total Users" value={users.length} icon={<Users className="h-4 w-4 text-muted-foreground" />} description="Registered in the system" isLoading={isLoading} />
         <StatCard title="Open Tickets" value={openTicketsCount} icon={<Ticket className="h-4 w-4 text-muted-foreground" />} description="Tickets not in 'Done' status" isLoading={isLoading} />
      </div>

       <Card className="mt-6 col-span-1 md:col-span-2 lg:col-span-4">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Project Statistics</CardTitle>
                    <CardDescription>An overview of your project pipeline.</CardDescription>
                </div>
                <Select value={projectFilter} onValueChange={(v: any) => setProjectFilter(v)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="this_month">This Month</SelectItem>
                        <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="grid md:grid-cols-3 gap-6">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                ) : (
                    <div className="grid md:grid-cols-3 divide-y md:divide-x md:divide-y-0 -m-6">
                        <div className="p-6 flex items-center gap-4">
                            <GanttChartSquare className="h-8 w-8 text-primary" />
                            <div>
                                <p className="text-2xl font-bold">{inProgressProjects}</p>
                                <p className="text-sm text-muted-foreground">In Progress</p>
                            </div>
                        </div>
                        <div className="p-6 flex items-center gap-4">
                            <PlusCircle className="h-8 w-8 text-primary" />
                            <div>
                                <p className="text-2xl font-bold">{newThisMonthProjects}</p>
                                <p className="text-sm text-muted-foreground">New This Month</p>
                            </div>
                        </div>
                        <div className="p-6 flex items-center gap-4">
                             <CheckCircle className="h-8 w-8 text-primary" />
                            <div>
                                <p className="text-2xl font-bold">{displayedDeliveredProjects}</p>
                                <p className="text-sm text-muted-foreground">Completed</p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
