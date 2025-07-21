
'use client';

import {useState} from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {useToast} from '@/hooks/use-toast';
import {sendTestEmail} from '@/app/actions';
import {useAuth} from '@/context/AuthContext';
import {Mail} from 'lucide-react';

export default function EmailTester() {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const {toast} = useToast();
  const {userData} = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !userData) return;

    setIsSending(true);
    try {
      const result = await sendTestEmail({to: email, fromName: userData.name});
      if (result.success) {
        toast({
          title: 'Email Sent!',
          description: `A test email has been sent to ${email}.`,
        });
      } else {
        throw new Error(result.error || 'An unknown error occurred.');
      }
    } catch (error: any) {
      toast({
        title: 'Error Sending Email',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-email">Recipient Email</Label>
            <Input
              id="test-email"
              type="email"
              placeholder="recipient@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSending}
            />
          </div>
          <Button type="submit" disabled={isSending || !email}>
            {isSending ? 'Sending...' : 'Send Test Email'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
