
"use client";

import { useState, useEffect, useMemo } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { LifeBuoy, Search } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | SupportTicket["status"]
  >("all");

  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/support-tickets');
            if (!response.ok) {
                throw new Error('Failed to fetch support tickets');
            }
            const fetchedTickets = await response.json();
            
            // The server function now returns dates as ISO strings, so we need to parse them back to Date objects
            const processedTickets = fetchedTickets.map((ticket: any) => ({
                ...ticket,
                createdAt: typeof ticket.createdAt === 'string' ? parseISO(ticket.createdAt) : ticket.createdAt,
            })) as unknown as SupportTicket[]; // We cast here after we've processed the date.
            
            setTickets(processedTickets);

        } catch (error: any) {
            console.error("Failed to fetch support tickets:", error);
            toast({
                title: "Failed to load tickets",
                description: error.message || "Could not retrieve support tickets from the server.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };
    fetchData();
  }, [toast]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
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
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Support Inbox</h1>

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
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredTickets.length > 0 ? (
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
                    {format(ticket.createdAt as Date, "MMM d, yyyy - p")}
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
    </div>
  );
}
