
'use client';

import { useState, useEffect, useRef } from 'react';
import { getProject } from '@/lib/firebase/projects';
import { getTickets } from '@/lib/firebase/tickets';
import { getProposals, updateProposal, addFeedbackToProposal } from '@/lib/firebase/proposals';
import { getInvoices, updateInvoice, addFeedbackToInvoice } from '@/lib/firebase/invoices';
import { getClientReports, createClientReport } from '@/lib/firebase/client-reports';
import { getOrCreateChatForProject, subscribeToMessages, sendMessage } from '@/lib/firebase/chat';
import { type Project, type Ticket, type Proposal, type Invoice, type Comment, ProjectStatus, type ClientReport, type ChatMessage } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, FileText, GanttChartSquare, CalendarIcon, Flag, DollarSign, CheckCircle, RefreshCw, ClipboardCheck, MessageSquare, Send } from 'lucide-react';
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
import { format, formatDistanceToNow, isSameDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Progress } from '../ui/progress';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';
import RichTextEditor from '../ui/rich-text-editor';


function SubmitReportDialog({
    project,
    onClose,
    onReportSubmit,
}: {
    project: Project,
    onClose: () => void,
    onReportSubmit: (title: string, description: string) => Promise<void>
}) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) return;
        setIsSubmitting(true);
        await onReportSubmit(title, description);
        setIsSubmitting(false);
    }
    
    return (
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Submit a Report for {project.name}</DialogTitle>
                <DialogDescription>
                    Use this form to report bugs, request features, or provide feedback.
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4 py-4 min-h-0">
                <Input 
                    placeholder="Report Title (e.g., 'Login button not working on Safari')"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isSubmitting}
                    required
                />
                <RichTextEditor 
                    content={description}
                    onChange={setDescription}
                    editable
                />
                <DialogFooter className="mt-auto">
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting || !title.trim() || !description.trim()}>
                        {isSubmitting ? 'Submitting...' : 'Submit Report'}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    )
}


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

function InvoiceDetailDialog({
    invoice,
    onClose,
    onStatusChange,
    onFeedbackSubmit
}: {
    invoice: Invoice,
    onClose: () => void,
    onStatusChange: (status: 'paid') => void,
    onFeedbackSubmit: (feedback: string) => Promise<void>
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFeedbackMode, setIsFeedbackMode] = useState(false);
    const [feedback, setFeedback] = useState('');
    const hasFeedback = invoice.feedback && invoice.feedback.length > 0;
    
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    const handleStatusChange = async (status: 'paid') => {
        setIsSubmitting(true);
        await onStatusChange(status);
        setIsSubmitting(false);
    }

    const handleSubmitFeedback = async () => {
        if (!feedback.trim()) return;
        setIsSubmitting(true);
        await onFeedbackSubmit(feedback);
        setIsSubmitting(false);
        setFeedback('');
        setIsFeedbackMode(false);
    }

    const getStatusBadgeVariant = (status: Invoice['status']) => {
        switch (status) {
            case 'paid': return 'default';
            case 'overdue': case 'expired': return 'destructive';
            case 'changes-requested': return 'destructive';
            case 'sent': return 'secondary';
            default: return 'outline';
        }
    }


    return (
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>{invoice.title}</DialogTitle>
                <DialogDescription>{invoice.description}</DialogDescription>
                <div className="flex items-center gap-2 pt-2">
                    <Badge variant={getStatusBadgeVariant(invoice.status)} className="capitalize">{invoice.status.replace('-', ' ')}</Badge>
                     <span className="text-sm text-muted-foreground">
                        Due: {format(invoice.validUntil.toDate(), 'MMM d, yyyy')}
                    </span>
                </div>
            </DialogHeader>
            <ScrollArea className="flex-1 my-4 -mx-6">
                <div className="px-6 space-y-4">
                     {hasFeedback && (
                        <div className="space-y-4 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
                        <h3 className="font-semibold text-amber-700 dark:text-amber-400">Feedback History</h3>
                        <div className="space-y-4">
                            {invoice.feedback?.map((comment, index) => (
                            <FeedbackComment key={index} comment={comment} />
                            ))}
                        </div>
                        </div>
                    )}
                    <Card>
                        <CardHeader>
                            <CardTitle>Invoice Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                             {invoice.type === 'itemized' && invoice.items.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Service</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invoice.items.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.description}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p>{formatCurrency(invoice.lumpSumAmount)}</p>
                            )}
                             <div className="flex justify-end font-bold text-lg mt-4 pt-4 border-t">
                                <span>Total: {formatCurrency(invoice.totalAmount)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </ScrollArea>
             {(invoice.status === 'sent' || invoice.status === 'overdue') && !isFeedbackMode && (
                <DialogFooter className="mt-auto pt-4 border-t">
                    <Button variant="outline" onClick={() => setIsFeedbackMode(true)}>Request Changes</Button>
                    <Button onClick={() => handleStatusChange('paid')} disabled={isSubmitting}>
                        <CheckCircle className="mr-2 h-4 w-4"/>
                        {isSubmitting ? 'Processing...' : 'Mark as Paid'}
                    </Button>
                </DialogFooter>
            )}
             {invoice.status === 'changes-requested' && (
                 <div className="mt-auto pt-4 border-t text-center text-sm text-muted-foreground">
                    The team has been notified of your feedback. This invoice will be updated soon.
                </div>
            )}
            {isFeedbackMode && (
                <div className="mt-auto pt-4 border-t">
                    <DialogHeader>
                        <DialogTitle>Request Changes</DialogTitle>
                        <DialogDescription>Please provide your feedback below. This will send the invoice back to the team for revisions.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="e.g. 'Can we clarify the scope for item X?'"
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
    )

}

function ChatView({ chatId }: { chatId: string }) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const { user, userData } = useAuth();
    const { toast } = useToast();
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!chatId) return;

        const unsubscribe = subscribeToMessages(chatId, (newMessages) => {
            setMessages(newMessages);
        });

        return () => unsubscribe();
    }, [chatId]);
    
    useEffect(() => {
        if(scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight });
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !userData) return;

        setIsSending(true);
        try {
            await sendMessage(chatId, { id: user.uid, name: userData.name, avatarUrl: userData.avatarUrl, role: userData.role }, newMessage);
            setNewMessage('');
        } catch (error) {
            console.error("Failed to send message:", error);
            toast({ title: 'Error', description: 'Could not send message.', variant: 'destructive' });
        } finally {
            setIsSending(false);
        }
    };
    
    let lastMessageDate: Date | null = null;

    return (
        <div className="flex flex-col h-full">
            <h2 className="text-2xl font-bold mb-4">Project Chat</h2>
            <ScrollArea className="flex-1 -mx-6 px-6" ref={scrollAreaRef}>
                <div className="space-y-6 pb-4">
                    {messages.map((message) => {
                        if (!message.timestamp) return null;
                        const messageDate = message.timestamp.toDate();
                        const showDateSeparator = !lastMessageDate || !isSameDay(messageDate, lastMessageDate);
                        lastMessageDate = messageDate;
                        const isCurrentUser = message.sender.id === user?.uid;

                        return (
                            <div key={message.id}>
                                {showDateSeparator && (
                                     <div className="relative my-4">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t" />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-background px-2 text-muted-foreground">{format(messageDate, 'MMMM d, yyyy')}</span>
                                        </div>
                                    </div>
                                )}
                                <div className={cn("flex items-start gap-3", isCurrentUser && "flex-row-reverse")}>
                                    <Avatar>
                                        <AvatarImage src={message.sender.avatarUrl} />
                                        <AvatarFallback>{message.sender.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className={cn("w-full rounded-lg p-3", isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted")}>
                                        <p className="text-sm font-semibold mb-1">{message.sender.name}</p>
                                        <p className="whitespace-pre-wrap">{message.text}</p>
                                        <p className={cn("text-xs opacity-70 mt-1", isCurrentUser ? "text-right" : "text-left")}>{format(messageDate, 'p')}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </ScrollArea>
            <form onSubmit={handleSendMessage} className="mt-4 flex gap-2 pt-4 border-t">
                <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={isSending}
                    className="flex-1"
                    rows={1}
                />
                <Button type="submit" disabled={isSending || !newMessage.trim()}>
                    <Send className="h-4 w-4 mr-2" />
                    Send
                </Button>
            </form>
        </div>
    )
}


export default function ClientProjectView({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [reports, setReports] = useState<ClientReport[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeView, setActiveView] = useState('progress');
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const fetchClientData = async (options: { openProposalId?: string, openInvoiceId?: string, openChat?: boolean } = {}) => {
      if (!user || !userData?.organizationId) return;
      if (!options.openProposalId && !options.openInvoiceId && !options.openChat) {
        setIsLoading(true);
      }
      try {
        const [projectData, ticketData, proposalData, invoiceData, reportData, fetchedChatId] = await Promise.all([
          getProject(projectId),
          getTickets({ projectId, organizationId: userData.organizationId }),
          getProposals({ projectId, organizationId: userData.organizationId }),
          getInvoices({ projectId, organizationId: userData.organizationId }),
          getClientReports({ projectId, organizationId: userData.organizationId, clientId: user.uid }),
          getOrCreateChatForProject(projectId, userData.organizationId),
        ]);

        setProject(projectData);
        setTickets(ticketData);
        setReports(reportData);
        setChatId(fetchedChatId);

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
            const invoiceToOpen = filteredInvoices.find(i => i.id === options.openInvoiceId);
            if (invoiceToOpen) {
                setSelectedInvoice(invoiceToOpen);
                setActiveView('invoices');
            }
        }
        if (options.openChat) {
            setActiveView('chat');
        }

      } catch (error) {
        console.error("Failed to fetch project data:", error);
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    if (userData?.organizationId && user) {
      const openProposalId = searchParams.get('open_proposal') || undefined;
      const openInvoiceId = searchParams.get('open_invoice') || undefined;
      const openChat = searchParams.get('open_chat') === 'true';
      fetchClientData({ openProposalId, openInvoiceId, openChat });
    }
  }, [projectId, user, userData?.organizationId, searchParams]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchClientData();
    setIsRefreshing(false);
    toast({ title: 'Data refreshed' });
  }

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
  
  const handleInvoiceStatusChange = async (status: 'paid') => {
    if (!selectedInvoice || !user || !userData) return;
    try {
        await updateInvoice(selectedInvoice.id, { 
            status,
            actingUser: { id: user.uid, name: userData.name }
        });
        toast({
            title: `Invoice Marked as Paid`,
            description: `You have successfully updated the invoice.`,
        });
        setSelectedInvoice(null);
        await fetchClientData(); // Refresh data
    } catch (error) {
        console.error(`Failed to update invoice:`, error);
        toast({
            title: 'Error',
            description: 'Could not update the invoice status.',
            variant: 'destructive'
        });
    }
  }

  const handleInvoiceFeedbackSubmit = async (feedback: string) => {
    if(!selectedInvoice || !user) return;
    try {
        await addFeedbackToInvoice(selectedInvoice.id, {
            userId: user.uid,
            message: feedback
        });
        toast({
            title: "Feedback Submitted",
            description: "Your feedback has been sent to the team.",
        });
        setSelectedInvoice(null);
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

  const handleReportSubmit = async (title: string, description: string) => {
    if (!project || !user || !userData) return;
    try {
      await createClientReport({
        title,
        description,
        projectId: project.id,
        projectName: project.name,
        clientId: user.uid,
        clientName: userData.name,
        organizationId: userData.organizationId,
      });
      toast({ title: 'Report Submitted', description: 'Thank you for your feedback!' });
      setIsReportDialogOpen(false);
      await fetchClientData();
    } catch (error) {
       console.error("Failed to submit report:", error);
       toast({
            title: 'Error',
            description: 'Could not submit your report.',
            variant: 'destructive'
        });
    }
  };


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
  
  const getInvoiceStatusBadgeVariant = (status: Invoice['status']) => {
    switch (status) {
        case 'paid': return 'default';
        case 'overdue': case 'expired': return 'destructive';
        case 'changes-requested': return 'destructive';
        case 'sent': return 'secondary';
        default: return 'outline';
    }
  }
  
   const getReportStatusBadgeVariant = (status: ClientReport['status']) => {
    switch (status) {
        case 'new': return 'default';
        case 'viewed': return 'secondary';
        case 'archived': return 'outline';
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
    <Dialog open={!!selectedProposal || !!selectedInvoice || isReportDialogOpen} onOpenChange={(isOpen) => {
        if (!isOpen) {
            setSelectedProposal(null);
            setSelectedInvoice(null);
            setIsReportDialogOpen(false);
        }
    }}>
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 p-4 md:px-6 border-b">
         <Button variant="outline" size="sm" asChild>
            <Link href={userData?.role === 'admin' ? '/admin/chat' : '/client'}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {userData?.role === 'admin' ? 'All Chats' : 'All Projects'}
            </Link>
        </Button>
        <h1 className="text-xl font-semibold text-foreground truncate">{project.name}</h1>
        {userData?.role === 'client' && (
            <Button size="sm" className="ml-auto" onClick={() => setIsReportDialogOpen(true)}>Submit Report</Button>
        )}
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
                 variant={activeView === 'chat' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveView('chat')}
              >
                <MessageSquare className="mr-2 h-4 w-4"/>
                Chat
              </Button>
            </li>
            <li>
              <Button
                 variant={activeView === 'reports' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveView('reports')}
              >
                <ClipboardCheck className="mr-2 h-4 w-4"/>
                Reports
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
                 <FileText className="mr-2 h-4 w-4"/>
                Proposals
              </Button>
            </li>
          </ul>
        </nav>
        <main className="flex-1 overflow-auto p-6 flex flex-col">
          {activeView === 'progress' && (
            <div>
              <Card className="mb-6">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Project Overview</CardTitle>
                    <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
                        <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                    </Button>
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
           {activeView === 'chat' && chatId && (
                <ChatView chatId={chatId} />
            )}
           {activeView === 'reports' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Your Submitted Reports</h2>
                <div className="border rounded-lg">
                   <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Submitted</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reports.length > 0 ? reports.map(report => (
                            <TableRow key={report.id}>
                                <TableCell className="font-medium">{report.title}</TableCell>
                                <TableCell><Badge variant={getReportStatusBadgeVariant(report.status)} className="capitalize">{report.status}</Badge></TableCell>
                                <TableCell>{format(report.createdAt.toDate(), 'MMM d, yyyy')}</TableCell>
                            </TableRow>
                        )) : <TableRow><TableCell colSpan={3} className="text-center h-24">You have not submitted any reports for this project.</TableCell></TableRow>}
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
                                <TableCell><Badge variant={getInvoiceStatusBadgeVariant(invoice.status)} className="capitalize">{invoice.status.replace('-', ' ')}</Badge></TableCell>
                                <TableCell>{format(invoice.validUntil.toDate(), 'MMM d, yyyy')}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedInvoice(invoice)}>
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

        {project && isReportDialogOpen && userData?.role === 'client' && (
          <SubmitReportDialog
            project={project}
            onClose={() => setIsReportDialogOpen(false)}
            onReportSubmit={handleReportSubmit}
           />
        )}
       {selectedProposal && <ProposalDetailDialog
            proposal={selectedProposal}
            onClose={() => setSelectedProposal(null)}
            onStatusChange={handleProposalStatusChange}
            onFeedbackSubmit={handleProposalFeedbackSubmit}
        />}
        {selectedInvoice && <InvoiceDetailDialog
            invoice={selectedInvoice}
            onClose={() => setSelectedInvoice(null)}
            onStatusChange={handleInvoiceStatusChange}
            onFeedbackSubmit={handleInvoiceFeedbackSubmit}
        />}
    </div>
    </Dialog>
  );
}

    