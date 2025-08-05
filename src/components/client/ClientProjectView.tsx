
'use client';

import { useState, useEffect } from 'react';
import { getProject } from '@/lib/firebase/projects';
import { getTickets } from '@/lib/firebase/tickets';
import { getProposals, updateProposal, addFeedbackToProposal } from '@/lib/firebase/proposals';
import { getInvoices } from '@/lib/firebase/invoices';
import { type Project, type Ticket, type Proposal, type Invoice, type Comment, ProjectStatus } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, BarChart, FileText, GanttChartSquare, MessageSquarePlus, CalendarIcon, Flag, DollarSign } from 'lucide-react';
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
  DialogDescription,
} from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';


function FeedbackComment({ comment }: { comment: Comment }) {
  const commentTimestamp = comment.timestamp && 'toDate' in comment.timestamp
    ? comment.timestamp.toDate()
    : comment.timestamp as Date;

  return (
     <div key={comment.id} className="flex gap-3">
        <Avatar>
            <AvatarImage src={comment.user.avatarUrl} alt={comment.user.name} />
            <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 rounded-md border bg-muted/50 p-3">
            <div className="flex items-center gap-2">
                <span className="font-semibold">{comment.user.name}</span>
                <span className="text-xs text-muted-foreground">
                    {commentTimestamp ? formatDistanceToNow(commentTimestamp, { addSuffix: true }) : 'just now'}
                </span>
            </div>
            <p className="text-sm text-foreground/80 mt-1 whitespace-pre-wrap">{comment.message}</p>
        </div>
    </div>
  )
}

function ProposalDetailDialog({
    proposal,
    onClose,
    onStatusChange,
    onFeedbackSubmit
}: {
    proposal: Proposal,
    onClose: () => void,
    onStatusChange: (status: 'accepted' | 'declined') => void,
    onFeedbackSubmit: (feedback: string) => Promise<void>
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFeedbackMode, setIsFeedbackMode] = useState(false);
    const [feedback, setFeedback] = useState('');
    const hasFeedback = proposal && proposal.feedback && proposal.feedback.length > 0;

    const handleStatusChange = async (status: 'accepted' | 'declined') => {
        setIsSubmitting(true);
        await onStatusChange(status);
        setIsSubmitting(false);
    }

    const handleFeedbackRequest = () => {
        setIsFeedbackMode(true);
    }

    const handleSubmitFeedback = async () => {
        if (!feedback.trim()) return;
        setIsSubmitting(true);
        await onFeedbackSubmit(feedback);
        setIsSubmitting(false);
        setFeedback('');
        setIsFeedbackMode(false);
    }

    return (
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>{proposal.title}</DialogTitle>
                <div className="flex items-center gap-2 pt-2">
                    <Badge variant={proposal.status === 'accepted' ? 'default' : proposal.status === 'declined' || proposal.status === 'changes-requested' ? 'destructive' : 'secondary'} className="capitalize">{proposal.status.replace('-', ' ')}</Badge>
                    <span className="text-sm text-muted-foreground">
                        Last updated: {format(proposal.updatedAt.toDate(), 'MMM d, yyyy')}
                    </span>
                </div>
            </DialogHeader>
            <ScrollArea className="flex-1 my-4 -mx-6">
              <div className="px-6 space-y-4">
                 {hasFeedback && (
                    <div className="space-y-4 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
                      <h3 className="font-semibold text-amber-700 dark:text-amber-400">Feedback History</h3>
                      <div className="space-y-4">
                        {proposal.feedback?.map((comment, index) => (
                          <FeedbackComment key={index} comment={comment} />
                        ))}
                      </div>
                    </div>
                  )}

                  <div 
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: proposal.content }}
                   />
              </div>
            </ScrollArea>
            {proposal.status === 'sent' && !isFeedbackMode && (
                <DialogFooter className="mt-auto pt-4 border-t">
                    <Button variant="outline" onClick={handleFeedbackRequest}>Request Changes</Button>
                    <Button onClick={() => handleStatusChange('accepted')} disabled={isSubmitting}>
                        {isSubmitting ? 'Accepting...' : 'Accept Proposal'}
                    </Button>
                     <Button variant="destructive" onClick={() => handleStatusChange('declined')} disabled={isSubmitting}>
                        {isSubmitting ? 'Declining...' : 'Decline'}
                    </Button>
                </DialogFooter>
            )}
             {proposal.status === 'changes-requested' && (
                 <div className="mt-auto pt-4 border-t text-center text-sm text-muted-foreground">
                    The team has been notified of your feedback. This proposal will be updated soon.
                </div>
            )}
            {isFeedbackMode && (
                <div className="mt-auto pt-4 border-t">
                    <DialogHeader>
                        <DialogTitle>Request Changes</DialogTitle>
                        <DialogDescription>Please provide your feedback below. This will send the proposal back to the team for revisions.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="e.g. 'Can we adjust the timeline for phase 2?'"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="min-h-[100px]"
                            disabled={isSubmitting}
                        />
                    </div>
                     <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsFeedbackMode(false)} disabled={isSubmitting}>Cancel</Button>
                        <Button onClick={handleSubmitFeedback} disabled={isSubmitting || !feedback.trim()}>
                            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                        </Button>
                    </DialogFooter>
                </div>
            )}
        </DialogContent>
    );
}


export default function ClientProjectView({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState('progress');
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const fetchClientData = async (options: { openProposalId?: string, openInvoiceId?: string } = {}) => {
      if (!user) return;
      try {
        const [projectData, ticketData, proposalData, invoiceData] = await Promise.all([
          getProject(projectId),
          getTickets({ projectId }),
          getProposals({ projectId }),
          getInvoices({ projectId })
        ]);

        setProject(projectData);
        setTickets(ticketData);
        
        const filteredProposals = proposalData
            .filter(p => p.clientId === user.uid && p.status !== 'draft')
            .sort((a,b) => b.updatedAt.toMillis() - a.updatedAt.toMillis())
        setProposals(filteredProposals);
        
        const filteredInvoices = invoiceData
            .filter(i => i.clientId === user.uid && i.status !== 'draft')
            .sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis());
        setInvoices(filteredInvoices);
        
        if (options.openProposalId) {
            const proposalToOpen = filteredProposals.find(p => p.id === options.openProposalId);
            if (proposalToOpen) {
                setSelectedProposal(proposalToOpen);
                setActiveView('proposals');
            }
        }
        if (options.openInvoiceId) {
            // Placeholder for opening an invoice detail view
            setActiveView('invoices');
        }


      } catch (error) {
        console.error("Failed to fetch project data:", error);
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    setIsLoading(true);
    const openProposalId = searchParams.get('open_proposal') || undefined;
    const openInvoiceId = searchParams.get('open_invoice') || undefined;
    fetchClientData({ openProposalId, openInvoiceId });
  }, [projectId, user, searchParams]);

  const handleProposalStatusChange = async (status: 'accepted' | 'declined') => {
    if (!selectedProposal || !user || !userData) return;
    try {
        await updateProposal(selectedProposal.id, { 
            status,
            actingUser: { id: user.uid, name: userData.name }
        });
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

  const handleProposalFeedbackSubmit = async (feedback: string) => {
    if(!selectedProposal || !user) return;
    try {
        await addFeedbackToProposal(selectedProposal.id, {
            userId: user.uid,
            message: feedback
        });
        toast({
            title: "Feedback Submitted",
            description: "Your feedback has been sent to the team.",
        });
        setSelectedProposal(null);
        await fetchClientData();
    } catch(error) {
        console.error("Failed to submit feedback", error);
        toast({
            title: 'Error',
            description: 'Could not submit your feedback.',
            variant: 'destructive'
        });
    }
  }


  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="flex gap-6">
          <div className="w-64">
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="flex-1">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return <div>Project not found.</div>;
  }
  
  const getStatusBadgeVariant = (status?: ProjectStatus) => {
    switch (status) {
      case 'completed': return 'default';
      case 'off-track': return 'destructive';
      case 'at-risk': return 'secondary';
      case 'on-track': return 'secondary';
      default: return 'outline';
    }
  }

  const inProgressTickets = tickets.filter(t => t.status === 'in-progress' || t.status === 'review' || t.status === 'todo' || t.status === 'backlog');
  const doneTickets = tickets.filter(t => t.status === 'done');
  const totalTickets = tickets.length;
  const completionPercentage = totalTickets > 0 ? (doneTickets.length / totalTickets) * 100 : 0;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

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
                <DollarSign className="mr-2 h-4 w-4"/>
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
              <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Project Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <h3 className="text-sm font-medium">Progress</h3>
                             <span className="text-sm font-medium">{Math.round(completionPercentage)}%</span>
                        </div>
                        <Progress value={completionPercentage} />
                        <p className="text-xs text-muted-foreground mt-1">{doneTickets.length} of {totalTickets} tasks completed</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Flag className="h-4 w-4 text-muted-foreground"/>
                            <div>
                                <p className="text-muted-foreground">Status</p>
                                <Badge variant={getStatusBadgeVariant(project.status)} className="capitalize">{project.status?.replace('-', ' ') || 'N/A'}</Badge>
                            </div>
                        </div>
                         <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground"/>
                            <div>
                                <p className="text-muted-foreground">Deadline</p>
                                <p className="font-medium">{project.deadline ? format(project.deadline.toDate(), 'MMM d, yyyy') : 'Not set'}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
              </Card>

              <h2 className="text-2xl font-bold mb-4">In Progress Tasks</h2>
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

              <h2 className="text-2xl font-bold mb-4">Completed Tasks</h2>
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
              <div>
                <h2 className="text-2xl font-bold mb-4">Invoices</h2>
                <div className="border rounded-lg">
                   <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                             <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices.length > 0 ? invoices.map(invoice => (
                            <TableRow key={invoice.id}>
                                <TableCell className="font-medium">{invoice.title}</TableCell>
                                <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                                <TableCell><Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'} className="capitalize">{invoice.status.replace('-', ' ')}</Badge></TableCell>
                                <TableCell>{format(invoice.validUntil.toDate(), 'MMM d, yyyy')}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">
                                        View
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )) : <TableRow><TableCell colSpan={5} className="text-center h-24">No invoices found for this project.</TableCell></TableRow>}
                    </TableBody>
                </Table>
                </div>
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
                            <TableHead>Last Updated</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {proposals.length > 0 ? proposals.map(proposal => (
                            <TableRow key={proposal.id}>
                                <TableCell className="font-medium">{proposal.title}</TableCell>
                                <TableCell><Badge variant={proposal.status === 'accepted' ? 'default' : (proposal.status === 'declined' || proposal.status === 'changes-requested') ? 'destructive' : 'secondary'} className="capitalize">{proposal.status.replace('-', ' ')}</Badge></TableCell>
                                <TableCell>{format(proposal.updatedAt.toDate(), 'MMM d, yyyy')}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedProposal(proposal)}>
                                        {proposal.status === 'sent' ? 'Review' : 'View'}
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

       {selectedProposal && <ProposalDetailDialog
            proposal={selectedProposal}
            onClose={() => setSelectedProposal(null)}
            onStatusChange={handleProposalStatusChange}
            onFeedbackSubmit={handleProposalFeedbackSubmit}
        />}
    </div>
    </Dialog>
  );
}
