
'use client'

import { getSupportTickets } from '@/lib/firebase/support';
import TicketsTable from './tickets-table';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { SupportTicket } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Timestamp } from 'firebase/firestore';

export default function SupportPage() {
  const [initialTickets, setInitialTickets] = useState<SupportTicket[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getSupportTickets().then((rawTickets) => {
      const tickets = rawTickets.map(ticket => {
        let createdAtString: string;
        // Safely handle both Timestamp objects and strings
        if (ticket.createdAt instanceof Timestamp) {
            createdAtString = ticket.createdAt.toDate().toISOString();
        } else {
            createdAtString = ticket.createdAt as string;
        }
        return {
          ...ticket,
          createdAt: createdAtString,
        };
      });
      setInitialTickets(tickets)
    }).finally(() => {
      setIsLoading(false)
    })

  }, [])


  const openTicketsCount = initialTickets.filter(ticket => ticket.status === 'open').length;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Support Inbox</h1>
        {isLoading ? (
            <Skeleton className="h-7 w-20 rounded-full" />
        ) : openTicketsCount > 0 && (
            <Badge variant="destructive" className="text-base px-3 py-1">{openTicketsCount} Open</Badge>
        )}
      </div>
      {isLoading ? (
        <div className="border rounded-lg">
            <div className="p-4 space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
        </div>
      ) : (
        <TicketsTable initialTickets={initialTickets} />
      )}
    </div>
  );
}
