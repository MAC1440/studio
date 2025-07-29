
'use client';

import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

export default function ProposalsPage() {

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Proposals</h1>
        <Button>Create Proposal</Button>
      </div>
      <div className="border rounded-lg">
        <div className="flex flex-col items-center justify-center h-96 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold">No Proposals Yet</h2>
            <p className="text-muted-foreground mt-2">
                Click "Create Proposal" to get started.
            </p>
        </div>
      </div>
    </div>
  );
}
