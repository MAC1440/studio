
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LoginPage from './(login)/page';

export default function Home() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user && userData) {
        if (userData.role === 'admin') {
            router.replace('/admin');
        } else {
            router.replace('/board');
        }
      }
    }
  }, [user, userData, loading, router]);

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            {/* You can add a more sophisticated loading spinner here */}
            <p>Loading...</p>
        </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // This will be shown briefly before the redirect happens
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
        <p>Redirecting...</p>
    </div>
    );
}
