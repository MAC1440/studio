
'use client';
import { useAuth } from '@/context/AuthContext';
import AppHeader from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import AuthGuard from '@/components/auth/AuthGuard';

function ProfilePageContent() {
  const { userData, loading } = useAuth();

  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <div className="container mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold mb-6">User Profile</h1>
          <Card>
            {loading || !userData ? (
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-20 w-20 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </div>
              </CardHeader>
            ) : (
              <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={userData.avatarUrl} alt={userData.name} />
                  <AvatarFallback>{userData.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{userData.name}</CardTitle>
                  <CardDescription>Update your profile information and settings.</CardDescription>
                </div>
              </CardHeader>
            )}
            <CardContent className="space-y-6">
              {loading || !userData ? (
                <>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" defaultValue={userData.name} />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" defaultValue={userData.email} readOnly />
                  </div>
                  <div className="space-y-2">
                      <Label>Role</Label>
                      <div>
                          <Badge variant={userData.role === 'admin' ? 'destructive' : 'secondary'}>{userData.role}</Badge>
                      </div>
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="avatar">Avatar</Label>
                      <Input id="avatar" type="file" />
                      <p className="text-sm text-muted-foreground">Upload a new avatar. Square images work best.</p>
                  </div>
                  <div className="flex justify-end">
                      <Button>Save Changes</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


export default function ProfilePage() {
    return (
        <AuthGuard>
            <ProfilePageContent />
        </AuthGuard>
    )
}
