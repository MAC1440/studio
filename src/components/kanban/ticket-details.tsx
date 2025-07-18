import { type Ticket, type Comment } from '@/lib/types';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '../ui/scroll-area';

type TicketDetailsProps = {
  ticket: Ticket;
};

const mockComments: Comment[] = [
    { id: 'comment-1', user: {id: 'user-2', name: 'John Doe', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704e'}, timestamp: '2 hours ago', message: 'I\'ll start working on this first thing tomorrow.'},
    { id: 'comment-2', user: {id: 'user-1', name: 'Jane Doe', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d'}, timestamp: '1 hour ago', message: 'Sounds good, let me know if you need any help with the design assets.'}
]

export default function TicketDetails({ ticket }: TicketDetailsProps) {
  return (
    <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
      <DialogHeader>
        <DialogTitle className="text-2xl">{ticket.title}</DialogTitle>
        <div className="flex items-center gap-2 pt-2">
            {ticket.tags.map((tag) => (
              <Badge key={tag.id} variant="outline" style={{
                borderColor: 'hsl(var(--accent))',
                color: 'hsl(var(--accent))'
              }}>
                {tag.label}
              </Badge>
            ))}
        </div>
      </DialogHeader>
      
      <ScrollArea className="flex-1 -mx-6 px-6">
        <div className="py-4">
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground">{ticket.description}</p>
        </div>

        <Separator className="my-4" />

        <div>
            <h3 className="font-semibold mb-4">Activity</h3>
            <div className="space-y-6">
                {mockComments.map(comment => (
                    <div key={comment.id} className="flex gap-3">
                        <Avatar>
                            <AvatarImage src={comment.user.avatarUrl} alt={comment.user.name} />
                            <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">{comment.user.name}</span>
                                <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                            </div>
                            <p className="text-sm text-foreground/80 mt-1">{comment.message}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </ScrollArea>

      <div className="mt-auto pt-4">
        <div className="flex gap-3">
          <Avatar>
            <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026704d" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <form>
              <Textarea placeholder="Add a comment..." className="mb-2" />
              <div className="flex justify-end">
                <Button>Comment</Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}
