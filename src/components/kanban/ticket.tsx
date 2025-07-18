import { type Ticket } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

type KanbanTicketProps = {
  ticket: Ticket;
  onClick: () => void;
};

export default function KanbanTicket({ ticket, onClick }: KanbanTicketProps) {
  return (
    <Card
      onClick={onClick}
      className="cursor-grab active:cursor-grabbing hover:bg-card/95 transition-colors duration-200"
    >
      <CardHeader className="p-4">
        <CardTitle className="text-base leading-tight">{ticket.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {ticket.description}
        </p>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            {ticket.tags.map((tag) => (
              <Badge key={tag.id} variant="secondary" style={{
                // A bit of a hack to use custom colors per tag without changing the theme
                // In a real app, this might come from a CSS variable map.
                backgroundColor: 'hsl(var(--accent))',
                color: 'hsl(var(--accent-foreground))'
              }}>
                {tag.label}
              </Badge>
            ))}
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
  );
}
