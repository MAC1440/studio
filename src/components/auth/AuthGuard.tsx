'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '../ui/skeleton';

type AuthGuardProps = {
  children: React.ReactNode;
  role?: 'admin' | 'user' | 'client';
};

export default function AuthGuard({ children, role }: AuthGuardProps) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in, redirect to login page
        router.push('/login');
      } else if (role && userData?.role !== role) {
        // Logged in, but does not have the required role
        // For simplicity, redirecting to home. In a real app, you might show an "Access Denied" page.
        if(userData?.role === 'admin') router.push('/admin');
        else if (userData?.role === 'client') router.push('/client');
        else router.push('/board');
      }
    }
  }, [user, userData, loading, role, router]);

  if (loading || !user || (role && userData?.role !== role)) {
    // Show a loading skeleton or a blank page while checking auth
    return (
        <div className="flex flex-col h-screen">
             <div className="border-b border-border/60">
                 <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
                    <Skeleton className="h-6 w-36" />
                    <Skeleton className="h-9 w-28" />
                 </div>
             </div>
             <div className="flex flex-1 overflow-hidden">
                <div className="hidden md:block w-64 border-r p-4">
                    <Skeleton className="h-8 w-full mb-4" />
                    <Skeleton className="h-8 w-full mb-4" />
                    <Skeleton className="h-8 w-full mb-4" />
                </div>
                <div className="flex-1 p-8">
                     <Skeleton className="h-8 w-64 mb-6" />
                     <Skeleton className="h-96 w-full" />
                </div>
             </div>
        </div>
    )
  }

  return <>{children}</>;
}
