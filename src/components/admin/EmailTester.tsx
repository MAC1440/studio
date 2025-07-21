
'use client';

import { useEffect } from 'react';
import { useActionState } from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {useToast} from '@/hooks/use-toast';
import {sendTestEmail} from '@/app/actions';
import {useAuth} from '@/context/AuthContext';
import {Mail} from 'lucide-react';

const initialState = {
    message: '',
    success: false,
};


export default function EmailTester() {
  const [state, formAction, isPending] = useActionState(sendTestEmail, initialState);
  const {toast} = useToast();
  const {userData} = useAuth();
  
  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: 'Email Sent!',
          description: state.message,
        });
      } else {
        toast({
          title: 'Error Sending Email',
          description: state.message,
          variant: 'destructive',
        });
      }
    }
  }, [state, toast]);


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Sending Test
        </CardTitle>
        <CardDescription>
          Use this form to send a test email and confirm your Resend API key is working correctly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-email">Recipient Email</Label>
            <Input
              id="test-email"
              type="email"
              name="email"
              placeholder="recipient@example.com"
              required
              disabled={isPending}
            />
            <input type="hidden" name="fromName" value={userData?.name || 'Admin'} />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Sending...' : 'Send Test Email'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
