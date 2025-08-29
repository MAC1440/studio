
import { type Ticket } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Flame, ChevronsUp, ChevronUp, Equal, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type KanbanTicketProps = {
  ticket: Ticket;
  onClick: () => void;
};

const priorityIcons = {
    critical: <Flame className="h-4 w-4 text-red-500" />,
    high: <ChevronsUp className="h-4 w-4 text-orange-500" />,
    medium: <ChevronUp className="h-4 w-4 text-yellow-500" />,
    low: <Equal className="h-4 w-4 text-green-500" />,
}

export default function KanbanTicket({ ticket, onClick }: KanbanTicketProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: ticket.id,
    data: {
        type: 'Ticket',
        ticket,
    }
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.7 : 1,
  };

  const deadline = ticket.deadline?.toDate();
  const isOverdue = deadline ? new Date() > deadline : false;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <Card
        onClick={onClick}
        className="cursor-grab active:cursor-grabbing hover:bg-card/95 transition-colors duration-200"
        >
        <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base leading-tight">{ticket.title}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                  {priorityIcons[ticket.priority]}
                  <div className="flex items-center gap-1">
                      {(ticket.tags || []).slice(0, 2).map((tag) => (
                      <Badge key={tag.id} variant="secondary" style={{
                          backgroundColor: 'hsl(var(--accent))',
                          color: 'hsl(var(--accent-foreground))'
                      }}>
                          {tag.label}
                      </Badge>
                      ))}
                  </div>
              </div>
              {deadline && (
                <div className={cn(
                    "flex items-center gap-1.5 text-xs",
                    isOverdue ? "text-destructive" : "text-muted-foreground"
                    )}>
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{format(deadline, 'MMM d')}</span>
                </div>
                )}
            </div>
            <div className="flex items-center justify-between mt-4">
            
            <div className="flex items-center gap-2">
               {ticket.loggedHours ? (
                    <Badge variant="outline">{ticket.loggedHours}h</Badge>
               ) : <div/>}
            </div>

            {ticket.assignedTo && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <Avatar className="h-7 w-7">
                                <AvatarImage src={ticket.assignedTo.avatarUrl} alt={ticket.assignedTo.name} />
                                <AvatarFallback>{ticket.assignedTo.name.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{ticket.assignedTo.name}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
            </div>
        </CardContent>
        </Card>
    </div>
  );
}
