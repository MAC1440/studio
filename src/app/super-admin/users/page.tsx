
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { type User, type Organization } from '@/lib/types';
import { getAllUsers } from '@/lib/firebase/users';
import { getAllOrganizations } from '@/lib/firebase/organizations';
import { UserManagementTable } from './UserManagementTable';
import { Skeleton } from '@/components/ui/skeleton';

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
            <h1 className="text-2xl md:text-3xl font-bold mb-6">User Management</h1>
            <UserManagementTable 
                users={users} 
                organizations={orgMap}
                onUserAction={fetchData}
            />
        </div>
    )
}
