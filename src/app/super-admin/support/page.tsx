
import { getSupportTickets } from '@/lib/firebase/support';
import TicketsTable from './tickets-table';

// This is now a Server Component
export default async function SupportPage() {
  const rawTickets = await getSupportTickets();

  // Manually serialize the Timestamp to a string before passing to the client component
  const initialTickets = rawTickets.map(ticket => ({
    ...ticket,
    createdAt: (ticket.createdAt as any).toDate().toISOString(),
  }));

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Support Inbox</h1>
      {/* We pass the server-fetched data to the client component */}
      <TicketsTable initialTickets={initialTickets} />
    </div>
  );
}
