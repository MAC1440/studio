
'use client';

import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type SupportTicket } from "@/lib/types";
import { LifeBuoy, Search, Mail, Building, User, CircleDot, Trash2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { updateSupportTicketStatus, deleteSupportTicket, deleteClosedSupportTickets } from "@/lib/firebase/support";


function TicketDetailModal({ 
    ticket, 
    onClose, 
    onStatusChange, 
    onDelete 
}: { 
    ticket: SupportTicket, 
    onClose: () => void, 
    onStatusChange: (ticketId: string, status: SupportTicket['status']) => Promise<void>,
    onDelete: (ticketId: string) => Promise<void>
}) {
    const [newStatus, setNewStatus] = useState(ticket.status);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSave = async () => {
        setIsSubmitting(true);
        await onStatusChange(ticket.id, newStatus);
        setIsSubmitting(false);
    }
    
    const handleDelete = async () => {
        setIsDeleting(true);
        await onDelete(ticket.id);
        setIsDeleting(false);
    }

    const getStatusBadgeVariant = (status: SupportTicket["status"]) => {
        switch (status) {
        case "closed":
            return "default";
        case "in-progress":
            return "secondary";
        case "open":
        default:
            return "destructive";
        }
    };
    
  return (
    <DialogContent className="max-w-2xl">
        <AlertDialog>
      <DialogHeader>
        <DialogTitle>Request: Plan change to {ticket.requestDetails.requestedPlan}</DialogTitle>
        <DialogDescription>
            Submitted {format(new Date(ticket.createdAt as string), "MMM d, yyyy 'at' p")}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-6 py-4">
        <div className="flex items-start gap-4">
            <Mail className="h-5 w-5 mt-1 text-muted-foreground" />
            <div className="flex-1">
                <h3 className="font-semibold">Requester</h3>
                <p className="text-muted-foreground">{ticket.requester.name} ({ticket.requester.email})</p>
            </div>
        </div>
         <div className="flex items-start gap-4">
            <Building className="h-5 w-5 mt-1 text-muted-foreground" />
            <div className="flex-1">
                <h3 className="font-semibold">Organization</h3>
                <p className="text-muted-foreground">{ticket.organization.name} (ID: {ticket.organization.id})</p>
            </div>
        </div>
         <div className="flex items-start gap-4">
            <User className="h-5 w-5 mt-1 text-muted-foreground" />
            <div className="flex-1">
                <h3 className="font-semibold">Request Details</h3>
                <div className="text-muted-foreground">
                    From <Badge variant="outline" className="capitalize">{ticket.requestDetails.currentPlan}</Badge> to <Badge className="capitalize">{ticket.requestDetails.requestedPlan}</Badge> at {ticket.requestDetails.price}/month.
                </div>
            </div>
        </div>
        <div className="flex items-start gap-4">
            <CircleDot className="h-5 w-5 mt-1 text-muted-foreground" />
            <div className="flex-1">
                <h3 className="font-semibold">Current Status</h3>
                <Badge variant={getStatusBadgeVariant(ticket.status)} className="capitalize">{ticket.status}</Badge>
            </div>
        </div>
      </div>
      <DialogFooter className="gap-2 sm:gap-0 sm:justify-between">
            <div>
                 {ticket.status === 'closed' && (
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={isDeleting}>
                            <Trash2 className="mr-2 h-4 w-4"/>
                            Delete Ticket
                        </Button>
                    </AlertDialogTrigger>
                )}
            </div>
            <div className="flex gap-2 justify-end">
                <div className="flex-1 sm:flex-none">
                    <Select value={newStatus} onValueChange={(v) => setNewStatus(v as SupportTicket['status'])}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Change status..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                </DialogClose>
                <Button onClick={handleSave} disabled={isSubmitting || newStatus === ticket.status}>
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
      </DialogFooter>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this support ticket.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                   {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DialogContent>
  );
}


export default function TicketsTable({ initialTickets }: { initialTickets: SupportTicket[] }) {
  const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SupportTicket["status"]>("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    setTickets(initialTickets);
  }, [initialTickets]);


  const filteredTickets = useMemo(() => {
    const sortedTickets = [...tickets].sort((a, b) => {
        const dateA = new Date(a.createdAt as string).getTime();
        const dateB = new Date(b.createdAt as string).getTime();
        return dateB - dateA;
    });

    return sortedTickets.filter((ticket) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchLower
        ? ticket.requester.email.toLowerCase().includes(searchLower) ||
          ticket.organization.name.toLowerCase().includes(searchLower) ||
          ticket.requestDetails.requestedPlan
            .toLowerCase()
            .includes(searchLower)
        : true;
      const matchesStatus =
        statusFilter !== "all" ? ticket.status === statusFilter : true;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchQuery, statusFilter]);
  
  const handleStatusChange = async (ticketId: string, newStatus: SupportTicket['status']) => {
    try {
        await updateSupportTicketStatus(ticketId, newStatus);
        toast({
            title: "Status Updated",
            description: `Ticket status changed to "${newStatus}".`
        });
        setTickets(currentTickets => currentTickets.map(t => t.id === ticketId ? {...t, status: newStatus} : t));
        setSelectedTicket(prev => prev ? {...prev, status: newStatus} : null);
    } catch (error) {
        toast({
            title: "Error",
            description: "Failed to update ticket status.",
            variant: "destructive"
        })
    }
  }

  const handleDeleteTicket = async (ticketId: string) => {
    try {
        await deleteSupportTicket(ticketId);
        toast({
            title: "Ticket Deleted",
            description: `The support ticket has been permanently deleted.`
        });
        setTickets(currentTickets => currentTickets.filter(t => t.id !== ticketId));
        setSelectedTicket(null);
    } catch (error) {
         toast({
            title: "Error",
            description: "Failed to delete ticket.",
            variant: "destructive"
        })
    }
  }

  const handleDeleteAllClosed = async () => {
    setIsBulkDeleting(true);
    try {
      await deleteClosedSupportTickets();
      toast({
        title: "Closed Tickets Deleted",
        description: "All closed support tickets have been removed.",
      });
      // Refresh the list by removing closed tickets from local state
      setTickets(currentTickets => currentTickets.filter(t => t.status !== 'closed'));
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not delete closed tickets.",
        variant: "destructive",
      });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const hasClosedTickets = useMemo(() => tickets.some(t => t.status === 'closed'), [tickets]);

  return (
    <AlertDialog>
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, org, plan..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as any)}
        >
          <SelectTrigger className="w-full md:w-auto">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
         <div className="w-full md:w-auto md:ml-auto">
            <AlertDialogTrigger asChild>
                <Button 
                    variant="outline" 
                    className="w-full md:w-auto" 
                    disabled={!hasClosedTickets || isBulkDeleting}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isBulkDeleting ? 'Deleting...' : 'Delete All Closed'}
                </Button>
            </AlertDialogTrigger>
        </div>
      </div>

      <div className="border rounded-lg">
        <div className="flex flex-col">
            {filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => (
                <div 
                    key={ticket.id}
                    className={cn(
                        "flex items-center gap-4 p-4 border-b cursor-pointer hover:bg-muted/50",
                        ticket.status === 'open' && "bg-primary/10 hover:bg-primary/20"
                    )}
                    onClick={() => setSelectedTicket(ticket)}
                >
                    <div className="flex items-center gap-2 w-1/6 font-semibold truncate">
                        {ticket.status === 'open' && <span className="h-2.5 w-2.5 rounded-full bg-primary shrink-0" />}
                        <span className={cn("truncate", ticket.status === 'open' && "font-bold")}>{ticket.requester.name}</span>
                    </div>
                    <div className="flex-1 truncate">
                        <span className={cn(ticket.status === 'open' && "font-bold")}>Plan Change Request</span>
                        <span className="text-muted-foreground ml-2 truncate">
                           - {ticket.organization.name} requests to switch to the {ticket.requestDetails.requestedPlan} plan.
                        </span>
                    </div>
                    <div className="w-1/6 text-right text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(ticket.createdAt as string), { addSuffix: true })}
                    </div>
                </div>
              ))
            ) : (
                <div className="h-48 text-center flex flex-col items-center justify-center">
                    <LifeBuoy className="h-12 w-12 text-muted-foreground" />
                    <h2 className="text-lg font-semibold mt-4">Inbox Zero</h2>
                    <p className="text-muted-foreground">No support tickets match your filters.</p>

                </div>
            )}
        </div>
      </div>
      
       <Dialog open={!!selectedTicket} onOpenChange={(isOpen) => !isOpen && setSelectedTicket(null)}>
        {selectedTicket && <TicketDetailModal 
            ticket={selectedTicket} 
            onClose={() => setSelectedTicket(null)} 
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteTicket}
        />}
      </Dialog>
      <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Delete All Closed Tickets?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete all support tickets with the "closed" status.
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAllClosed}>
                Continue
            </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
