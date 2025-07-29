
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getProposals, createProposal } from '@/lib/firebase/proposals';
import { getUsers } from '@/lib/firebase/users';
import { type Proposal, type User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import ProposalEditor from './proposal-editor';

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [fetchedProposals, fetchedUsers] = await Promise.all([
        getProposals(),
        getUsers()
      ]);
      setProposals(fetchedProposals.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
      setClients(fetchedUsers.filter(u => u.role === 'client'));
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        title: 'Error',
        description: 'Could not fetch proposals or clients.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [toast]);

  const handleSaveProposal = async (data: { title: string; content: string; clientId: string; }) => {
    const client = clients.find(c => c.id === data.clientId);
    if (!client) {
        toast({ title: 'Client not found', variant: 'destructive' });
        return;
    }

    try {
      await createProposal({ ...data, clientName: client.name });
      toast({
        title: 'Proposal Saved',
        description: 'Your new proposal has been saved as a draft.',
      });
      setIsEditorOpen(false);
      await fetchData(); // Refresh data
    } catch (error) {
      console.error('Failed to save proposal:', error);
      toast({
        title: 'Error Saving',
        description: 'Could not save the proposal.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Proposals</h1>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Proposal
            </Button>
          </DialogTrigger>
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : proposals.length > 0 ? (
                proposals.map((proposal) => (
                  <TableRow key={proposal.id}>
                    <TableCell className="font-medium">{proposal.title}</TableCell>
                    <TableCell>{proposal.clientName}</TableCell>
                    <TableCell><Badge variant="secondary" className="capitalize">{proposal.status}</Badge></TableCell>
                    <TableCell>{format(proposal.createdAt.toDate(), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">View</Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileText className="h-12 w-12" />
                      <h2 className="text-lg font-semibold">No Proposals Yet</h2>
                      <p>Click "Create Proposal" to get started.</p>
                      <Button size="sm" className="mt-2" onClick={() => setIsEditorOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Proposal
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        <DialogContent className="max-w-4xl h-[90vh]">
          <ProposalEditor
            clients={clients}
            onSave={handleSaveProposal}
            onClose={() => setIsEditorOpen(false)}
          />
        </DialogContent>
      </div>
    </Dialog>
  );
}
