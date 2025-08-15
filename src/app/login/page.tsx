
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff } from 'lucide-react';
import { forgotPassword, completeInvitation } from '@/lib/firebase/users';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import darkLogo from '../../../public/logos/brand-dark.png';
import lightLogo from '../../../public/logos/brand_light.png';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

function AuthForm() {
  const [mode, setMode] = useState<'login' | 'signup' | 'completeInvite'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, forceRefetch } = useAuth();
  const { toast } = useToast();

   useEffect(() => {
    // Check if the page is being loaded from an email link
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let storedEmail = window.localStorage.getItem('emailForSignIn');
      if (storedEmail) {
        setEmail(storedEmail);
        setMode('completeInvite');
      } else {
        // If the email is not in local storage, prompt the user for it.
        const promptedEmail = window.prompt('Please provide your email for confirmation');
        if (promptedEmail) {
          setEmail(promptedEmail);
          setMode('completeInvite');
        } else {
            setError("Could not complete sign-in. Email is required.");
        }
      }
    }
  }, []);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode !== 'login') { // Signup or Invite Completion
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
    }
    
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'completeInvite') {
        // The user came from an email link.
        await signInWithEmailLink(auth, email, window.location.href);
        // Now that they're authenticated, we can complete the process
        // This is a simplified flow. A better UX would guide them to set a password now.
         await completeInvitation(email, password);
         toast({
          title: "Account Setup Complete",
          description: "Welcome! Your workspace is ready.",
         });
         forceRefetch(); // Trigger a full data reload
      }
    } catch (err: any) {
      let friendlyMessage = 'An unexpected error occurred. Please try again later.';
      if (err.code) {
          switch (err.code) {
              case 'auth/invalid-credential':
              case 'auth/wrong-password':
                  friendlyMessage = 'Invalid email or password. Please try again.';
                  break;
              case 'auth/user-not-found':
                   friendlyMessage = 'No account found with this email. Please sign up.';
                   break;
              case 'auth/email-already-in-use':
                  friendlyMessage = 'This email address is already in use. Please log in or use a different email.';
                  break;
              case 'auth/weak-password':
                  friendlyMessage = 'The password is too weak. Please use at least 6 characters.';
                  break;
              case 'permission-denied':
                  friendlyMessage = 'You do not have permission to perform this action.';
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
  
  const getTitle = () => {
    if (mode === 'completeInvite') return 'Complete Your Account';
    return mode === 'login' ? 'Login' : 'Create an Account';
  }

  const getDescription = () => {
    if (mode === 'completeInvite') return 'Welcome! Please set a password to secure your account.';
    return mode === 'login' ? 'Enter your email below to login to your account.' : 'Enter your details to create a new workspace.';
  }

  const getButtonText = () => {
      if (isLoading) {
          if (mode === 'completeInvite') return 'Setting Up...';
          return mode === 'login' ? 'Signing In...' : 'Creating Account...';
      }
       if (mode === 'completeInvite') return 'Set Password & Login';
      return mode === 'login' ? 'Sign in' : 'Sign up';
  }

  return (
    <Card className="w-full max-w-sm border-0 shadow-none sm:border sm:shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl">{getTitle()}</CardTitle>
        <CardDescription>{getDescription()}</CardDescription>
      </CardHeader>
      <form onSubmit={handleAuthAction}>
        <CardContent className="grid gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {mode === 'signup' && (
               <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                      id="name"
                      type="text"
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
              disabled={isLoading || mode === 'completeInvite'}
            />
          </div>
          <div className="grid gap-2">
              <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  {mode === 'login' && <Button type="button" variant="link" className="ml-auto p-0 h-auto" onClick={handleForgotPassword}>
                      Forgot password?
                  </Button>}
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
           {mode !== 'login' && (
               <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                   <div className="relative">
                    <Input 
                      id="confirm-password" 
                      type={showConfirmPassword ? 'text' : 'password'}
                      required 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                     />
                     <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isLoading}
                    >
                        {showConfirmPassword ? <EyeOff /> : <Eye />}
                     </Button>
                   </div>
               </div>
           )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {getButtonText()}
          </Button>
           {mode !== 'completeInvite' && (
             <p className="text-sm text-center text-muted-foreground">
                {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
                <Button type="button" variant="link" className="p-0 h-auto" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
                     {mode === 'login' ? 'Sign up' : 'Login'}
                </Button>
            </p>
           )}
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
