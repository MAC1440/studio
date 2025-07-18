
'use client';
import { type Ticket, type Comment as CommentType } from '@/lib/types';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { addCommentToTicket } from '@/lib/firebase/tickets';
import { formatDistanceToNow } from 'date-fns';

type TicketDetailsProps = {
  ticket: Ticket;
  onUpdate: () => void;
};

function Comment({ comment }: { comment: CommentType }) {
  const commentTimestamp = comment.timestamp?.toDate ? comment.timestamp.toDate() : new Date();
  
  return (
     <div key={comment.id} className="flex gap-3">
        <Avatar>
            <AvatarImage src={comment.user.avatarUrl} alt={comment.user.name} />
            <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
            <div className="flex items-center gap-2">
                <span className="font-semibold">{comment.user.name}</span>
                <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(commentTimestamp, { addSuffix: true })}
                </span>
            </div>
            <p className="text-sm text-foreground/80 mt-1">{comment.message}</p>
        </div>
    </div>
  )
}


export default function TicketDetails({ ticket, onUpdate }: TicketDetailsProps) {
  const [newComment, setNewComment] = useState('');
  const { userData, user } = useAuth();
  const { toast } = useToast();

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) {
      return;
    }

    try {
      await addCommentToTicket(ticket.id, {
        userId: user.uid,
        message: newComment
      });
      setNewComment('');
      onUpdate(); // Trigger a re-fetch of ticket data
      toast({ title: 'Comment added' });
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast({ title: 'Error', description: 'Could not add comment.', variant: 'destructive' });
    }
  }

  const sortedComments = ticket.comments?.sort((a, b) => {
    const dateA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
    const dateB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
    return dateA - dateB;
  }) || [];


  return (
    <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
      <DialogHeader>
        <DialogTitle className="text-2xl">{ticket.title}</DialogTitle>
        <div className="flex items-center gap-2 pt-2">
            {(ticket.tags || []).map((tag) => (
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
                {sortedComments.map(comment => (
                    <Comment key={comment.id} comment={comment} />
                ))}
            </div>
        </div>
      </ScrollArea>

      {userData && (
        <div className="mt-auto pt-4">
          <div className="flex gap-3">
            <Avatar>
              <AvatarImage src={userData.avatarUrl} alt={userData.name}/>
              <AvatarFallback>{userData.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <form onSubmit={handleCommentSubmit}>
                <Textarea 
                  placeholder="Add a comment..." 
                  className="mb-2"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={!newComment.trim()}>Comment</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DialogContent>
  );
}
