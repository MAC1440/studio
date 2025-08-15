
import { getSupportTickets } from '@/lib/firebase/super-admin-actions';
import TicketsTable from './tickets-table';

// This is now a Server Component
export default async function SupportPage() {
  const initialTickets = await getSupportTickets();

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Support Inbox</h1>
      {/* We pass the server-fetched data to the client component */}
      <TicketsTable initialTickets={initialTickets} />
    </div>
  );
}
