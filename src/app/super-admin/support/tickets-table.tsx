
'use client';

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type SupportTicket } from "@/lib/types";
import { LifeBuoy, Search } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function TicketsTable({ initialTickets }: { initialTickets: SupportTicket[] }) {
  const [tickets] = useState<SupportTicket[]>(initialTickets);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | SupportTicket["status"]
  >("all");

  const filteredTickets = useMemo(() => {
    // Ensure tickets are sorted by date before filtering and displaying
    const sortedTickets = [...tickets].sort((a, b) => {
        // Since createdAt is now a string, we need to parse it back to a Date for sorting
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

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request Details</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Received</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>
                    <p className="font-medium">
                      Plan change to{" "}
                      <span className="capitalize">
                        {ticket.requestDetails.requestedPlan}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      From:{" "}
                      <span className="capitalize">
                        {ticket.requestDetails.currentPlan}
                      </span>{" "}
                      | Price: {ticket.requestDetails.price}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{ticket.requester.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {ticket.requester.email}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{ticket.organization.name}</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {ticket.organization.id}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusBadgeVariant(ticket.status)}
                      className="capitalize"
                    >
                      {ticket.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {ticket.createdAt ? format(new Date(ticket.createdAt as string), "MMM d, yyyy - p") : 'N/A'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <LifeBuoy className="h-12 w-12" />
                    <h2 className="text-lg font-semibold">Inbox Zero</h2>
                    <p>No support tickets found.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
