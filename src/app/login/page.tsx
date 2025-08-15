
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff } from 'lucide-react';
import { forgotPassword } from '@/lib/firebase/users';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import darkLogo from '../../../public/logos/brand-dark.png';
import lightLogo from '../../../public/logos/brand_light.png';

function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      let friendlyMessage = 'An unexpected error occurred. Please try again later.';
      if (err.code) {
          switch (err.code) {
              case 'auth/invalid-credential':
              case 'auth/wrong-password':
                  friendlyMessage = 'Invalid email or password. Please try again.';
                  break;
              case 'auth/user-not-found':
                   friendlyMessage = 'No account found with this email.';
                   break;
              case 'auth/too-many-requests':
                  friendlyMessage = 'Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.';
                  break;
              default:
                  console.error("Auth error:", err.code, err.message);
          }
      } else {
          console.error(err);
      }
      setError(friendlyMessage);
    } finally {
        setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address to reset your password.");
      return;
    }
    setError(null);
    try {
      await forgotPassword(email);
      toast({
        title: "Password Reset Email Sent",
        description: "Please check your inbox for instructions to reset your password.",
      });
    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Error",
        description: "Could not send password reset email. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full max-w-sm border-0 shadow-none sm:border sm:shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>Enter your email below to login to your account.</CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="grid gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
              <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Button type="button" variant="link" className="ml-auto p-0 h-auto" onClick={handleForgotPassword}>
                      Forgot password?
                  </Button>
              </div>
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? 'text' : 'password'}
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
               />
               <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
              >
                  {showPassword ? <EyeOff /> : <Eye />}
               </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign in'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}


function AuthPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user && userData) {
        if (userData.role === 'super-admin') {
            router.replace('/super-admin');
        } else if (userData.role === 'admin') {
            router.replace('/admin');
        } else if (userData.role === 'client') {
            router.replace('/client');
        } else {
            router.replace('/board');
        }
      }
    }
  }, [user, userData, loading, router]);

  if (loading || user) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <p>Loading...</p>
        </div>
    );
  }

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <AuthForm />
      </div>
      <div className="hidden bg-muted lg:flex items-center justify-center p-8">
        <div className="w-full max-w-md">
            <Image
                alt="BoardR Light Logo"
                className="block dark:hidden rounded-xl"
                src={lightLogo.src}
                width="550"
                height="200"
                priority
            />
            <Image
                alt="BoardR Dark Logo"
                className="hidden dark:block rounded-xl"
                src={darkLogo.src}
                width="550"
                height="200"
                priority
            />
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
