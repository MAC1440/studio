
import { getSupportTickets } from "@/lib/firebase/super-admin-actions";
import TicketsTable from "./tickets-table";

export default async function SupportPage() {
  const tickets = await getSupportTickets();

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Support Inbox</h1>
      <TicketsTable initialTickets={tickets} />
    </div>
  );
}
