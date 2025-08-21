
'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ClientProjectView from '@/components/client/ClientProjectView';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

// This is a Server Component wrapper, but the logic inside will be client-side due to hooks
export default function ClientProjectBoardPage({ params: { projectId } }: { params: { projectId: string } }) {
  const { organization } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const isFreePlan = organization?.subscriptionPlan === 'free';
  const openProposalId = searchParams.get('open_proposal');
  const openInvoiceId = searchParams.get('open_invoice');
  const isPaidFeatureAccessAttempt = openProposalId || openInvoiceId;

  useEffect(() => {
    if (isFreePlan && isPaidFeatureAccessAttempt) {
      toast({
        title: 'Upgrade Required',
        description: 'Viewing proposals and invoices requires a paid plan. Please contact your account manager.',
        variant: 'destructive',
        duration: 7000,
      });
      // Redirect to the base project page
      router.replace(`/client/project/${projectId}`);
    }
  }, [isFreePlan, isPaidFeatureAccessAttempt, projectId, router, toast]);
  
  if (isFreePlan && isPaidFeatureAccessAttempt) {
    // Render a loading state or nothing while redirecting
    return (
        <div className="flex items-center justify-center h-full">
            <p>Redirecting...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <main className="flex-1 overflow-hidden">
        {/* We pass the projectId to the ClientProjectView component, which is a Client Component */}
        <ClientProjectView projectId={projectId} />
      </main>
    </div>
  );
}
