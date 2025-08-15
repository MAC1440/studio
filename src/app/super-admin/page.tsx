
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart, Building, LifeBuoy, Users, DollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';
import { type Organization, type User, type SupportTicket } from '@/lib/types';
import { getAllOrganizations } from '@/lib/firebase/organizations';
import { getAllUsers } from '@/lib/firebase/users';
import { getSupportTickets } from '@/lib/firebase/support';
import { Skeleton } from '@/components/ui/skeleton';
import { Timestamp } from 'firebase/firestore';


export default function SuperAdminDashboard() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [orgs, allUsers, rawTickets] = await Promise.all([
                getAllOrganizations(),
                getAllUsers(),
                getSupportTickets(),
            ]);

            const tickets = rawTickets.map(ticket => {
                let createdAtString: string;
                if (ticket.createdAt instanceof Timestamp) {
                    createdAtString = ticket.createdAt.toDate().toISOString();
                } else {
                    createdAtString = ticket.createdAt as string;
                }
                return {
                    ...ticket,
                    createdAt: createdAtString,
                };
            });

            setOrganizations(orgs);
            setUsers(allUsers);
            setSupportTickets(tickets);
        } catch (error) {
            console.error("Failed to fetch super admin dashboard data:", error);
            // Optionally, show a toast notification here
        } finally {
            setIsLoading(false);
        }
    };
    fetchData();
  }, []);

  const openSupportTicketsCount = supportTickets.filter(t => t.status === 'open').length;

  const StatCard = ({ title, value, icon, description, loading }: { title: string, value: string | number, icon: React.ReactNode, description: string, loading: boolean }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            {loading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{value}</div>}
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
  )

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Super Admin Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
         <StatCard title="Total Revenue" value="$0.00" icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} description="Coming Soon" loading={isLoading} />
         <StatCard title="Active Organizations" value={organizations.length} icon={<Building className="h-4 w-4 text-muted-foreground" />} description="Total registered orgs" loading={isLoading} />
         <StatCard title="Total Users" value={users.length} icon={<Users className="h-4 w-4 text-muted-foreground" />} description="Across all organizations" loading={isLoading} />
         <StatCard title="Open Support Tickets" value={openSupportTicketsCount} icon={<LifeBuoy className="h-4 w-4 text-muted-foreground" />} description="Awaiting response" loading={isLoading} />
      </div>
      <div className="mt-8">
        <Card>
            <CardHeader>
                <CardTitle>Platform Analytics</CardTitle>
                <CardDescription>An overview of platform growth and activity.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-80 flex items-center justify-center bg-muted rounded-lg">
                    <div className="text-center">
                        <AreaChart className="h-12 w-12 mx-auto text-muted-foreground" />
                        <p className="mt-4 text-muted-foreground">Analytics charts coming soon!</p>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
