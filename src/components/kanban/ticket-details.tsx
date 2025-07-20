
'use client';
import { type Ticket, type Comment as CommentType, User, TicketPriority } from '@/lib/types';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { addCommentToTicket, deleteTicket, updateTicket } from '@/lib/firebase/tickets';
import { format, formatDistanceToNow } from 'date-fns';
import { Calendar, Flame, Trash2, User as UserIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '../ui/label';


type TicketDetailsProps = {
  ticket: Ticket;
  onUpdate: (isDeleted?: boolean) => void;
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
  const { userData, user, users } = useAuth();
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

  const handleDeleteTicket = async () => {
    try {
        await deleteTicket(ticket.id);
        toast({
            title: "Ticket Deleted",
            description: `Ticket "${ticket.title}" has been successfully deleted.`,
        });
        onUpdate(true);
    } catch (error: any) {
        console.error("Failed to delete ticket:", error);
        toast({
            title: "Deletion Failed",
            description: `Could not delete ticket. ${error.message}`,
            variant: "destructive",
        });
    }
  }

  const handleAssigneeChange = async (userId: string) => {
    const newAssignee = users.find(u => u.id === userId) || null;
    try {
      await updateTicket(ticket.id, { assignedTo: newAssignee });
      onUpdate();
      toast({
        title: "Assignee Updated",
        description: newAssignee ? `Ticket assigned to ${newAssignee.name}.` : "Ticket unassigned.",
      });
    } catch (error: any) {
       console.error('Failed to update assignee:', error);
       toast({ title: 'Error', description: 'Could not update assignee.', variant: 'destructive' });
    }
  };

  const handlePriorityChange = async (priority: TicketPriority) => {
    try {
      await updateTicket(ticket.id, { priority });
      onUpdate();
      toast({
        title: "Priority Updated",
        description: `Ticket priority set to ${priority}.`,
      });
    } catch (error: any) {
       console.error('Failed to update priority:', error);
       toast({ title: 'Error', description: 'Could not update priority.', variant: 'destructive' });
    }
  };


  const sortedComments = ticket.comments?.sort((a, b) => {
    const dateA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
    const dateB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
    return dateA - dateB;
  }) || [];

  const createdAtDate = ticket.createdAt?.toDate ? ticket.createdAt.toDate() : new Date();

  return (
    <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
    <AlertDialog>
      <DialogHeader>
        <DialogTitle className="text-2xl pr-10">{ticket.title}</DialogTitle>
        <div className="flex items-center gap-2 pt-2 flex-wrap">
            <Badge variant="secondary" className="capitalize">{ticket.status.replace('-', ' ')}</Badge>
             <Badge variant={ticket.priority === 'critical' || ticket.priority === 'high' ? 'destructive' : 'secondary'} className="capitalize">{ticket.priority}</Badge>
            {(ticket.tags || []).map((tag) => (
              <Badge key={tag.id} variant="outline" style={{
                borderColor: 'hsl(var(--accent))',
                color: 'hsl(var(--accent))'
              }}>
                {tag.label}
              </Badge>
            ))}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
                <Calendar className="h-3.5 w-3.5" />
                <span>Created {format(createdAtDate, "MMM d, yyyy")}</span>
            </div>
        </div>
      </DialogHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
        <ScrollArea className="md:col-span-2">
            <div className="pr-6">
                <div className="py-4">
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
                </div>

                <Separator className="my-4" />

                <div>
                    <h3 className="font-semibold mb-4">Activity</h3>
                    <div className="space-y-6">
                        {sortedComments.map((comment, index) => (
                            <Comment key={index} comment={comment} />
                        ))}
                        {sortedComments.length === 0 && (
                            <p className="text-sm text-muted-foreground">No comments yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </ScrollArea>
        <aside className="border-l -mx-6 px-6 md:mx-0 md:px-0 md:pl-6">
            <ScrollArea>
                <div className="space-y-6 py-4 h-full">
                    <div>
                        <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Assignee</h3>
                        <Select onValueChange={handleAssigneeChange} defaultValue={ticket.assignedTo?.id || 'unassigned'}>
                            <SelectTrigger>
                                <SelectValue>
                                    {ticket.assignedTo ? (
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={ticket.assignedTo.avatarUrl} alt={ticket.assignedTo.name} />
                                                <AvatarFallback>{ticket.assignedTo.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span>{ticket.assignedTo.name}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <UserIcon className="h-6 w-6 p-0.5" />
                                            <span>Unassigned</span>
                                        </div>
                                    )}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {users.map(u => (
                                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div>
                        <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Priority</h3>
                        <Select onValueChange={handlePriorityChange} defaultValue={ticket.priority}>
                            <SelectTrigger>
                                <SelectValue>
                                    <span className="capitalize">{ticket.priority}</span>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </ScrollArea>
        </aside>
      </div>


      <div className="mt-auto pt-4 border-t">
        {userData && (
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
        )}
         <DialogFooter className="mt-4">
              {userData?.role === 'admin' && (
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="mr-auto">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Ticket
                    </Button>
                  </AlertDialogTrigger>
              )}
        </DialogFooter>
      </div>
      
       <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the ticket
            "{ticket.title}".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteTicket}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
      </AlertDialog>
    </DialogContent>
  );
}
