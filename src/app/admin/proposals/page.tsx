
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
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getProposals, updateProposal, createProposal } from '@/lib/firebase/proposals';
import { getUsers } from '@/lib/firebase/users';
import { getProjects } from '@/lib/firebase/projects';
import { type Proposal, type User, type Project } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, PlusCircle, Edit, Send, MessageSquareWarning } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import ProposalEditor from './proposal-editor';
import { useAuth } from '@/context/AuthContext';

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const { toast } = useToast();
  const { userData } = useAuth();

  const fetchData = async () => {
    if (!userData?.organizationId) return;
    setIsLoading(true);
    try {
      const [fetchedProposals, fetchedUsers, fetchedProjects] = await Promise.all([
        getProposals({ organizationId: userData.organizationId }),
        getUsers(userData.organizationId),
        getProjects(userData.organizationId),
      ]);
      setProposals(fetchedProposals.sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis()));
      setClients(fetchedUsers.filter(u => u.role === 'client'));
      setProjects(fetchedProjects);
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
  }, [userData?.organizationId]);

  const handleCreateClick = () => {
    setEditingProposal(null);
    setIsEditorOpen(true);
  };

  const handleEditClick = (proposal: Proposal) => {
    setEditingProposal(proposal);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setEditingProposal(null);
  }

  const handleSaveProposal = async (data: { title: string; content: string; clientId: string; projectId: string; status: Proposal['status'] }) => {
    if (!userData?.organizationId) return;
    const client = clients.find(c => c.id === data.clientId);
    if (!client) {
      toast({ title: 'Client not found', variant: 'destructive' });
      return;
    }

    try {
      let toastMessage = 'Proposal Saved';

      if (editingProposal) {
        const updates: Partial<Proposal> = { ...data, clientName: client.name, status: data.status };

        // When admin re-sends a proposal with requested changes, clear the feedback.
        if (editingProposal.status === 'changes-requested' && data.status === 'sent') {
          updates.feedback = [];
        }

        await updateProposal(editingProposal.id, updates);
        toastMessage = data.status === 'sent' ? 'Proposal sent to client.' : 'Proposal updated.';
      } else {
        await createProposal({ ...data, clientName: client.name, organizationId: userData.organizationId });
        toastMessage = data.status === 'sent' ? 'Proposal created and sent.' : 'Proposal saved as draft.';
      }

      toast({
        title: toastMessage
      });
      handleCloseEditor();
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

  const handleSendProposal = async (proposal: Proposal) => {
    try {
      await updateProposal(proposal.id, { status: 'sent', feedback: [] }); // Clear feedback on send
      toast({
        title: 'Proposal Sent',
        description: `The proposal "${proposal.title}" has been sent to the client.`,
      });
      await fetchData();
    } catch (error) {
      console.error('Failed to send proposal:', error);
      toast({
        title: 'Error',
        description: 'Could not send the proposal.',
        variant: 'destructive',
      });
    }
  }

  const getStatusBadgeVariant = (status: Proposal['status']) => {
    switch (status) {
      case 'accepted':
        return 'default';
      case 'declined':
        return 'destructive';
      case 'changes-requested':
        return 'secondary';
      case 'sent':
        return 'secondary';
      case 'draft':
      default:
        return 'outline';
    }
  }

  return (
    <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
      <div className='max-w-[95vw] overflow-auto'>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Proposals</h1>
          <Button onClick={handleCreateClick} size="sm">
            <PlusCircle className="md:mr-2 h-4 w-4" />
            <span className="hidden md:inline">Create Proposal</span>
          </Button>
        </div>
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
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
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(proposal.status)} className="capitalize">{proposal.status.replace('-', ' ')}</Badge>
                        {proposal.status === 'changes-requested' && <MessageSquareWarning className="h-4 w-4 text-amber-500" />}
                      </div>
                    </TableCell>
                    <TableCell>{format(proposal.updatedAt.toDate(), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2">
                        {(proposal.status === 'draft' || proposal.status === 'changes-requested') && (
                          <Button variant="ghost" size="sm" onClick={() => handleSendProposal(proposal)}>
                            <Send className="mr-2 h-4 w-4" />
                            {proposal.status === 'changes-requested' ? 'Re-send' : 'Send'}
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(proposal)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {proposal.status === 'draft' || proposal.status === 'changes-requested' ? 'Edit' : 'View'}
                        </Button>
                      </div>
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
                      <Button size="sm" className="mt-2" onClick={handleCreateClick}>
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
            projects={projects}
            onSave={handleSaveProposal}
            onClose={handleCloseEditor}
            proposal={editingProposal}
          />
        </DialogContent>
      </div>
    </Dialog>
  );
}
