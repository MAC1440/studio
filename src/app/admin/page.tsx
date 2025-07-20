
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Ticket, FolderKanban } from 'lucide-react';
import { getUsers } from '@/lib/firebase/users';
import { getTickets } from '@/lib/firebase/tickets';
import { getProjects } from '@/lib/firebase/projects';
import { type User, type Ticket as TicketType, type Project } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [fetchedUsers, fetchedTickets, fetchedProjects] = await Promise.all([
          getUsers(),
          getTickets({}),
          getProjects(),
        ]);
        setUsers(fetchedUsers);
        setTickets(fetchedTickets);
        setProjects(fetchedProjects);
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

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <Skeleton className="h-8 w-16" />
            ) : (
                <div className="text-2xl font-bold">{projects.length}</div>
            )}
            <p className="text-xs text-muted-foreground">Active projects in the system</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
