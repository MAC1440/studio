
import { getSupportTickets } from '@/lib/firebase/support';
import TicketsTable from './tickets-table';
import { Badge } from '@/components/ui/badge';

// This is now a Server Component
export default async function SupportPage() {
  const rawTickets = await getSupportTickets();

  // Manually serialize the Timestamp to a string before passing to the client component
  const initialTickets = rawTickets.map(ticket => ({
    ...ticket,
    createdAt: (ticket.createdAt as any).toDate().toISOString(),
  }));

  const openTicketsCount = initialTickets.filter(ticket => ticket.status === 'open').length;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Support Inbox</h1>
        {openTicketsCount > 0 && (
            <Badge variant="destructive" className="text-base px-3 py-1">{openTicketsCount} Open</Badge>
        )}
      </div>
      {/* We pass the server-fetched data to the client component */}
      <TicketsTable initialTickets={initialTickets} />
    </div>
  );
}
