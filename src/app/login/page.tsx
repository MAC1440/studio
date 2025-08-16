
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
import { forgotPassword, createUser } from '@/lib/firebase/users';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import darkLogo from '../../../public/logos/brand-dark.png';
import lightLogo from '../../../public/logos/brand_light.png';
import { createOrganization } from '@/lib/firebase/organizations';

function AuthForm() {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
    }
    setError(null);
    setIsLoading(true);
    try {
        const newOrg = await createOrganization({ name: `${name}'s Workspace`, ownerId: 'temp' });
        await createUser({
            name,
            email,
            password,
            role: 'admin',
            organizationId: newOrg.id,
        });
        // After successful signup, log the user in
        await login(email, password);

        toast({
            title: "Account Created!",
            description: "Welcome to BoardR! We're setting up your workspace.",
        });

    } catch (err: any) {
         let friendlyMessage = 'An unexpected error occurred during sign up.';
         if (err.code) {
             switch (err.code) {
                 case 'auth/email-already-in-use':
                     friendlyMessage = 'An account with this email already exists. Please log in instead.';
                     break;
                 case 'auth/weak-password':
                     friendlyMessage = 'The password is too weak. Please choose a stronger password.';
                     break;
                 default:
                    console.error("Signup error:", err.code, err.message);
             }
         } else {
            console.error(err);
         }
        setError(friendlyMessage);
    } finally {
        setIsLoading(false);
    }
  }

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

  const toggleMode = () => {
    setAuthMode(authMode === 'login' ? 'signup' : 'login');
    setError(null);
  };

  return (
    <Card className="w-full max-w-sm border-0 shadow-none sm:border sm:shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl">{authMode === 'login' ? 'Login' : 'Create an Account'}</CardTitle>
        <CardDescription>
          {authMode === 'login' ? 'Enter your email below to login to your account.' : 'Enter your details to create a new account.'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={authMode === 'login' ? handleLogin : handleSignUp}>
        <CardContent className="grid gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {authMode === 'signup' && (
             <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                id="name"
                placeholder="John Doe"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                />
            </div>
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
                  {authMode === 'login' && (
                    <Button type="button" variant="link" className="ml-auto p-0 h-auto" onClick={handleForgotPassword}>
                        Forgot password?
                    </Button>
                  )}
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
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (authMode === 'login' ? 'Signing In...' : 'Creating Account...') : (authMode === 'login' ? 'Sign in' : 'Create Account')}
          </Button>
           <p className="text-sm text-muted-foreground">
             {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
            <Button variant="link" type="button" onClick={toggleMode} className="p-0 h-auto">
                {authMode === 'login' ? "Sign up" : "Log in"}
            </Button>
          </p>
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
