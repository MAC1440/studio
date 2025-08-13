
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart, Building, LifeBuoy, Users, DollarSign } from 'lucide-react';


export default function SuperAdminDashboard() {

  const StatCard = ({ title, value, icon, description }: { title: string, value: string | number, icon: React.ReactNode, description: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
  )

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Super Admin Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
         <StatCard title="Total Revenue" value="$0.00" icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} description="Coming Soon" />
         <StatCard title="Active Organizations" value="0" icon={<Building className="h-4 w-4 text-muted-foreground" />} description="Total registered orgs" />
         <StatCard title="Total Users" value="0" icon={<Users className="h-4 w-4 text-muted-foreground" />} description="Across all organizations" />
         <StatCard title="Open Support Tickets" value="0" icon={<LifeBuoy className="h-4 w-4 text-muted-foreground" />} description="Awaiting response" />
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
