
'use client';

import { useState, useEffect } from 'react';
import { getProject } from '@/lib/firebase/projects';
import { getTickets } from '@/lib/firebase/tickets';
import { getProposals, updateProposal } from '@/lib/firebase/proposals';
import { type Project, type Ticket, type Proposal } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, BarChart, FileText, GanttChartSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';

function ProposalDetailDialog({ proposal, onClose, onStatusChange }: { proposal: Proposal, onClose: () => void, onStatusChange: (status: 'accepted' | 'declined') => void }) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleStatusChange = async (status: 'accepted' | 'declined') => {
        setIsSubmitting(true);
        await onStatusChange(status);
        setIsSubmitting(false);
    }
    
    return (
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>{proposal.title}</DialogTitle>
                <div className="flex items-center gap-2 pt-2">
                    <Badge variant={proposal.status === 'accepted' ? 'default' : proposal.status === 'declined' ? 'destructive' : 'secondary'} className="capitalize">{proposal.status}</Badge>
                    <span className="text-sm text-muted-foreground">
                        Last updated: {format(proposal.updatedAt.toDate(), 'MMM d, yyyy')}
                    </span>
                </div>
            </DialogHeader>
            <ScrollArea className="flex-1 my-4">
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                  {proposal.content}
              </div>
            </ScrollArea>
            {proposal.status === 'sent' && (
                <DialogFooter className="mt-auto pt-4 border-t">
                    <Button variant="outline" onClick={() => handleStatusChange('declined')} disabled={isSubmitting}>Decline</Button>
                    <Button onClick={() => handleStatusChange('accepted')} disabled={isSubmitting}>
                        {isSubmitting ? 'Accepting...' : 'Accept Proposal'}
                    </Button>
                </DialogFooter>
            )}
        </DialogContent>
    );
}


export default function ClientProjectView({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState('progress');
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchClientData = async () => {
      if (!user) return;
      try {
        const [projectData, ticketData, proposalData] = await Promise.all([
          getProject(projectId),
          getTickets({ projectId }),
          getProposals({ clientId: user.uid })
        ]);

        setProject(projectData);
        setTickets(ticketData);
        setProposals(proposalData.filter(p => p.status !== 'draft').sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis()));

      } catch (error) {
        console.error("Failed to fetch project data:", error);
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    setIsLoading(true);
    fetchClientData();
  }, [projectId, user]);

  const handleProposalStatusChange = async (status: 'accepted' | 'declined') => {
    if (!selectedProposal) return;
    try {
        await updateProposal(selectedProposal.id, { status });
        toast({
            title: `Proposal ${status}`,
            description: `You have successfully ${status} the proposal.`,
        });
        setSelectedProposal(null);
        await fetchClientData(); // Refresh data
    } catch (error) {
        console.error(`Failed to ${status} proposal:`, error);
        toast({
            title: 'Error',
            description: 'Could not update the proposal status.',
            variant: 'destructive'
        });
    }
  }


  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="flex gap-6">
          <div className="w-1/4">
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="w-3/4">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return <div>Project not found.</div>;
  }
  
  const inProgressTickets = tickets.filter(t => t.status === 'in-progress' || t.status === 'review');
  const doneTickets = tickets.filter(t => t.status === 'done');


  return (
    <Dialog open={!!selectedProposal} onOpenChange={(isOpen) => !isOpen && setSelectedProposal(null)}>
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 p-4 md:px-6 border-b">
         <Button variant="outline" size="sm" asChild>
            <Link href="/client">
                <ArrowLeft className="mr-2 h-4 w-4" />
                All Projects
            </Link>
        </Button>
        <h1 className="text-xl font-semibold text-foreground truncate">{project.name}</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <nav className="w-64 border-r p-4">
          <ul className="space-y-2">
            <li>
              <Button
                variant={activeView === 'progress' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveView('progress')}
              >
                <GanttChartSquare className="mr-2 h-4 w-4"/>
                Progress
              </Button>
            </li>
            <li>
              <Button
                 variant={activeView === 'invoices' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveView('invoices')}
              >
                <FileText className="mr-2 h-4 w-4"/>
                Invoices
              </Button>
            </li>
            <li>
              <Button
                variant={activeView === 'proposals' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveView('proposals')}
              >
                 <BarChart className="mr-2 h-4 w-4"/>
                Proposals
              </Button>
            </li>
          </ul>
        </nav>
        <main className="flex-1 overflow-auto p-6">
          {activeView === 'progress' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">In Progress</h2>
              <div className="border rounded-lg mb-8">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Task</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Priority</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {inProgressTickets.length > 0 ? inProgressTickets.map(ticket => (
                            <TableRow key={ticket.id}>
                                <TableCell>{ticket.title}</TableCell>
                                <TableCell><Badge variant="secondary" className="capitalize">{ticket.status.replace('-', ' ')}</Badge></TableCell>
                                <TableCell><Badge variant={ticket.priority === 'high' || ticket.priority === 'critical' ? 'destructive' : 'secondary'} className="capitalize">{ticket.priority}</Badge></TableCell>
                            </TableRow>
                        )) : <TableRow><TableCell colSpan={3} className="text-center h-24">No tasks in progress.</TableCell></TableRow>}
                    </TableBody>
                </Table>
              </div>

              <h2 className="text-2xl font-bold mb-4">Completed</h2>
               <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Task</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Priority</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {doneTickets.length > 0 ? doneTickets.map(ticket => (
                            <TableRow key={ticket.id}>
                                <TableCell>{ticket.title}</TableCell>
                                <TableCell><Badge variant="secondary" className="capitalize">{ticket.status.replace('-', ' ')}</Badge></TableCell>
                                <TableCell><Badge variant="secondary" className="capitalize">{ticket.priority}</Badge></TableCell>
                            </TableRow>
                        )) : <TableRow><TableCell colSpan={3} className="text-center h-24">No tasks completed yet.</TableCell></TableRow>}
                    </TableBody>
                </Table>
              </div>
            </div>
          )}
           {activeView === 'invoices' && (
             <div className="text-center text-muted-foreground p-8">
                 <FileText className="mx-auto h-12 w-12 mb-4" />
                 <h3 className="text-xl font-semibold">Invoicing Coming Soon</h3>
                 <p>This section will show all invoices related to this project.</p>
             </div>
           )}
           {activeView === 'proposals' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Proposals</h2>
                <div className="border rounded-lg">
                   <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {proposals.length > 0 ? proposals.map(proposal => (
                            <TableRow key={proposal.id}>
                                <TableCell className="font-medium">{proposal.title}</TableCell>
                                <TableCell><Badge variant={proposal.status === 'accepted' ? 'default' : proposal.status === 'declined' ? 'destructive' : 'secondary'} className="capitalize">{proposal.status}</Badge></TableCell>
                                <TableCell>{format(proposal.createdAt.toDate(), 'MMM d, yyyy')}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedProposal(proposal)}>
                                        View
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )) : <TableRow><TableCell colSpan={4} className="text-center h-24">No proposals found for this project.</TableCell></TableRow>}
                    </TableBody>
                </Table>
                </div>
              </div>
           )}
        </main>
      </div>

       {selectedProposal && <ProposalDetailDialog proposal={selectedProposal} onClose={() => setSelectedProposal(null)} onStatusChange={handleProposalStatusChange} />}
    </div>
    </Dialog>
  );
}
