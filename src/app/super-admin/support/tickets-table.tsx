
'use client';

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
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
import { LifeBuoy, Search, Mail, Building, User, Clock, CheckCircle, CircleDot } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { updateSupportTicketStatus } from "@/lib/firebase/support";
import { useRouter } from "next/navigation";


function TicketDetailModal({ ticket, onClose, onStatusChange }: { ticket: SupportTicket, onClose: () => void, onStatusChange: (status: SupportTicket['status']) => void }) {
    const [newStatus, setNewStatus] = useState(ticket.status);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSave = async () => {
        setIsSubmitting(true);
        await onStatusChange(newStatus);
        setIsSubmitting(false);
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
                    From <Badge variant="outline" className="capitalize">{ticket.requestDetails.currentPlan}</Badge> to <Badge variant="default" className="capitalize">{ticket.requestDetails.requestedPlan}</Badge> at {ticket.requestDetails.price}/month.
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
      <DialogFooter className="gap-2 sm:gap-0">
          <div className="flex-1">
            <Select value={newStatus} onValueChange={(v) => setNewStatus(v as SupportTicket['status'])}>
                <SelectTrigger className="w-[180px]">
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
      </DialogFooter>
    </DialogContent>
  );
}


export default function TicketsTable({ initialTickets }: { initialTickets: SupportTicket[] }) {
  const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SupportTicket["status"]>("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const router = useRouter();
  const { toast } = useToast();

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
  
  const handleStatusChange = async (newStatus: SupportTicket['status']) => {
    if (!selectedTicket) return;
    try {
        await updateSupportTicketStatus(selectedTicket.id, newStatus);
        toast({
            title: "Status Updated",
            description: `Ticket status changed to "${newStatus}".`
        });
        // Optimistically update the UI
        setTickets(currentTickets => currentTickets.map(t => t.id === selectedTicket.id ? {...t, status: newStatus} : t));
        setSelectedTicket(null);
    } catch (error) {
        toast({
            title: "Error",
            description: "Failed to update ticket status.",
            variant: "destructive"
        })
    }
  }

  return (
    <>
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-full max-w-sm">
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
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <div className="flex flex-col">
            {filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => (
                <div 
                    key={ticket.id}
                    className={cn(
                        "flex items-center gap-4 p-4 border-b cursor-pointer hover:bg-muted/50",
                        ticket.status === 'open' && "bg-blue-500/10 hover:bg-blue-500/20"
                    )}
                    onClick={() => setSelectedTicket(ticket)}
                >
                    <div className="flex items-center gap-2 w-1/6 font-semibold truncate">
                        {ticket.status === 'open' && <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shrink-0" />}
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
        {selectedTicket && <TicketDetailModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} onStatusChange={handleStatusChange} />}
      </Dialog>
    </>
  );
}
