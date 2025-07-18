import { type Column, type Ticket } from '@/lib/types';
import KanbanTicket from './ticket';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type KanbanColumnProps = {
  column: Column;
  onTicketClick: (ticket: Ticket) => void;
};

export default function KanbanColumn({ column, onTicketClick }: KanbanColumnProps) {
    const {
        setNodeRef,
        transform,
        transition,
    } = useSortable({
        id: column.id,
        data: {
            type: 'Column',
            column,
        },
    });

    const style = {
        transition,
        transform: CSS.Transform.toString(transform),
    };

    const tickets = column.tickets || [];
  
  return (
    <div ref={setNodeRef} style={style} className="flex flex-col w-72 md:w-80 shrink-0">
      <div className="flex items-center justify-between p-2 mb-2">
        <h2 className="font-semibold text-lg">{column.title}</h2>
        <span className="text-sm font-medium bg-muted text-muted-foreground rounded-full px-2 py-0.5">
          {tickets.length}
        </span>
      </div>
      <ScrollArea className="flex-1 rounded-md bg-secondary/50 p-2">
        <div className="flex flex-col gap-3 h-full">
            <SortableContext items={tickets.map(t => t.id)} strategy={verticalListSortingStrategy}>
              {tickets.map((ticket) => (
                <KanbanTicket
                  key={ticket.id}
                  ticket={ticket}
                  onClick={() => onTicketClick(ticket)}
                />
              ))}
            </SortableContext>
          {/* Placeholder for empty state or droppable area hint */}
        </div>
      </ScrollArea>
    </div>
  );
}
