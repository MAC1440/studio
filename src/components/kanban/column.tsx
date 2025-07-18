import { type Column, type Ticket } from '@/lib/types';
import KanbanTicket from './ticket';
import { ScrollArea } from '@/components/ui/scroll-area';

type KanbanColumnProps = {
  column: Column;
  onTicketClick: (ticket: Ticket) => void;
};

export default function KanbanColumn({ column, onTicketClick }: KanbanColumnProps) {
  return (
    <div className="flex flex-col w-72 md:w-80 shrink-0">
      <div className="flex items-center justify-between p-2 mb-2">
        <h2 className="font-semibold text-lg">{column.title}</h2>
        <span className="text-sm font-medium bg-muted text-muted-foreground rounded-full px-2 py-0.5">
          {column.tickets.length}
        </span>
      </div>
      <ScrollArea className="flex-1 rounded-md bg-secondary/50 p-2">
        <div className="flex flex-col gap-3 h-full">
          {column.tickets.map((ticket) => (
            <KanbanTicket
              key={ticket.id}
              ticket={ticket}
              onClick={() => onTicketClick(ticket)}
            />
          ))}
          {/* Placeholder for empty state or droppable area hint */}
        </div>
      </ScrollArea>
    </div>
  );
}
