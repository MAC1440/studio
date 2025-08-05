
'use client';
import { type Ticket, type Comment as CommentType, User, TicketPriority, ChecklistItem } from '@/lib/types';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { ScrollArea } from '../ui/scroll-area';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { addCommentToTicket, deleteTicket, updateTicket } from '@/lib/firebase/tickets';
import { format, formatDistanceToNow } from 'date-fns';
import { Calendar, Trash2, User as UserIcon, Plus, Clock, Hourglass } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';


type TicketDetailsProps = {
  ticket: Ticket;
  onUpdate: (isDeleted?: boolean) => void;
};

function Comment({ comment }: { comment: CommentType }) {
  const commentTimestamp = comment.timestamp && 'toDate' in comment.timestamp
    ? comment.timestamp.toDate()
    : comment.timestamp as Date;

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
                    {commentTimestamp ? formatDistanceToNow(commentTimestamp, { addSuffix: true }) : 'just now'}
                </span>
            </div>
            <p className="text-sm text-foreground/80 mt-1 whitespace-pre-wrap">{comment.message}</p>
        </div>
    </div>
  )
}


export default function TicketDetails({ ticket, onUpdate }: TicketDetailsProps) {
  const [newComment, setNewComment] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [hoursToAdd, setHoursToAdd] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userData, user, users } = useAuth();
  const { toast } = useToast();

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) {
      return;
    }
    setIsSubmitting(true);
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
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleDeleteTicket = async () => {
    setIsSubmitting(true);
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
    } finally {
        setIsSubmitting(false);
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
  
  const handleAddChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistItem.trim()) return;
    const newItem: ChecklistItem = {
      id: `check-${Date.now()}`,
      text: newChecklistItem,
      completed: false
    };
    const updatedChecklist = [...(ticket.checklist || []), newItem];
    try {
      await updateTicket(ticket.id, { checklist: updatedChecklist });
      setNewChecklistItem('');
      onUpdate();
    } catch (error) {
      console.error('Failed to add checklist item:', error);
      toast({ title: 'Error', description: 'Could not add checklist item.', variant: 'destructive' });
    }
  };

  const handleToggleChecklistItem = async (itemId: string) => {
    const updatedChecklist = (ticket.checklist || []).map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    try {
      await updateTicket(ticket.id, { checklist: updatedChecklist });
      onUpdate();
    } catch (error) {
      console.error('Failed to toggle checklist item:', error);
      toast({ title: 'Error', description: 'Could not update checklist item.', variant: 'destructive' });
    }
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
    const updatedChecklist = (ticket.checklist || []).filter(item => item.id !== itemId);
     try {
      await updateTicket(ticket.id, { checklist: updatedChecklist });
      onUpdate();
    } catch (error) {
      console.error('Failed to delete checklist item:', error);
      toast({ title: 'Error', description: 'Could not delete checklist item.', variant: 'destructive' });
    }
  }

  const handleDeadlineChange = async (date: Date | undefined) => {
    try {
      await updateTicket(ticket.id, { deadline: date });
      onUpdate();
      toast({ title: "Deadline updated" });
    } catch (error) {
      console.error('Failed to update deadline:', error);
      toast({ title: 'Error', description: 'Could not update deadline.', variant: 'destructive' });
    }
  }

  const handleLogHours = async (e: React.FormEvent) => {
    e.preventDefault();
    const hours = parseFloat(hoursToAdd);
    if (isNaN(hours) || hours <= 0) return;
    const newTotal = (ticket.loggedHours || 0) + hours;
    try {
        await updateTicket(ticket.id, { loggedHours: newTotal });
        setHoursToAdd('');
        onUpdate();
        toast({ title: 'Hours logged successfully' });
    } catch (error) {
      console.error('Failed to log hours:', error);
      toast({ title: 'Error', description: 'Could not log hours.', variant: 'destructive' });
    }
  };


  const sortedComments = ticket.comments?.sort((a, b) => {
    const dateA = a.timestamp && 'toDate' in a.timestamp ? a.timestamp.toDate().getTime() : (a.timestamp as Date)?.getTime();
    const dateB = b.timestamp && 'toDate' in b.timestamp ? b.timestamp.toDate().getTime() : (b.timestamp as Date)?.getTime();
    return dateA - dateB;
  }) || [];

  const createdAtDate = ticket.createdAt?.toDate ? ticket.createdAt.toDate() : new Date();

  const checklistCompleted = (ticket.checklist || []).filter(item => item.completed).length;
  const checklistTotal = (ticket.checklist || []).length;
  const checklistProgress = checklistTotal > 0 ? (checklistCompleted / checklistTotal) * 100 : 0;
  
  const deadline = ticket.deadline?.toDate();
  const isOverdue = deadline ? new Date() > deadline : false;


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
                  <Hourglass className="h-3.5 w-3.5" />
                  <span>Created {format(createdAtDate, "MMM d, yyyy")}</span>
              </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
          <ScrollArea className="md:col-span-2 pr-6">
              <div className="space-y-6">
                  <div>
                      <h3 className="font-semibold mb-2">Description</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
                  </div>

                  <div>
                      <h3 className="font-semibold mb-2">Checklist</h3>
                      {checklistTotal > 0 && (
                        <div className="mb-4 space-y-2">
                           <div className="flex items-center justify-between text-sm">
                             <span className="text-muted-foreground">Progress</span>
                             <span>{Math.round(checklistProgress)}%</span>
                           </div>
                           <Progress value={checklistProgress} />
                        </div>
                      )}
                      <div className="space-y-2">
                        {(ticket.checklist || []).map(item => (
                          <div key={item.id} className="flex items-center gap-3 group">
                              <Checkbox
                                id={`check-${item.id}`}
                                checked={item.completed}
                                onCheckedChange={() => handleToggleChecklistItem(item.id)}
                              />
                              <label htmlFor={`check-${item.id}`} className={`flex-1 text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}>{item.text}</label>
                              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleDeleteChecklistItem(item.id)}>
                                <Trash2 className="h-4 w-4 text-destructive"/>
                              </Button>
                          </div>
                        ))}
                      </div>
                      <form onSubmit={handleAddChecklistItem} className="flex items-center gap-2 mt-3">
                        <Input value={newChecklistItem} onChange={(e) => setNewChecklistItem(e.target.value)} placeholder="Add a sub-task" className="h-9"/>
                        <Button type="submit" size="sm" disabled={!newChecklistItem.trim()}>
                            <Plus className="mr-2 h-4 w-4"/> Add
                        </Button>
                      </form>
                  </div>

                  <div className="pt-4">
                      <h3 className="font-semibold mb-4">Activity</h3>
                      <div className="space-y-6">
                          {sortedComments.map((comment, index) => (
                              <Comment key={comment.id || index} comment={comment} />
                          ))}
                          {sortedComments.length === 0 && (
                              <p className="text-sm text-muted-foreground">No comments yet.</p>
                          )}
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
                                    disabled={isSubmitting}
                                    />
                                    <div className="flex justify-end">
                                    <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
                                        {isSubmitting ? 'Commenting...' : 'Comment'}
                                    </Button>
                                    </div>
                                </form>
                                </div>
                            </div>
                        )}
                      </div>
                  </div>
              </div>
          </ScrollArea>
          <aside className="border-l md:pl-6">
              <ScrollArea className="h-full">
                  <div className="space-y-6 py-1 h-full">
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
                      <div>
                        <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Due Date</h3>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !deadline && "text-muted-foreground",
                                    isOverdue && "text-destructive border-destructive"
                                )}
                                >
                                <Calendar className="mr-2 h-4 w-4" />
                                {deadline ? format(deadline, "PPP") : <span>No deadline</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <CalendarComponent
                                mode="single"
                                selected={deadline}
                                onSelect={handleDeadlineChange}
                                initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Log Hours</h3>
                        <div className="flex items-center gap-2">
                           <Clock className="h-5 w-5 text-muted-foreground"/>
                           <p className="font-bold text-lg">{ticket.loggedHours || 0}<span className="font-normal text-sm text-muted-foreground">h</span></p>
                        </div>
                        <form onSubmit={handleLogHours} className="flex items-center gap-2 mt-2">
                            <Input
                                type="number"
                                placeholder="Add hours..."
                                value={hoursToAdd}
                                onChange={(e) => setHoursToAdd(e.target.value)}
                                className="h-9"
                                step="0.5"
                            />
                            <Button type="submit" size="sm" disabled={!hoursToAdd}>Log</Button>
                        </form>
                      </div>
                  </div>
              </ScrollArea>
          </aside>
        </div>


        <div className="mt-auto pt-4 border-t">
           <div className="flex">
                {userData?.role === 'admin' && (
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="mr-auto">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Ticket
                      </Button>
                    </AlertDialogTrigger>
                )}
          </div>
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
            <AlertDialogAction onClick={handleDeleteTicket} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Continue'}
              </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
        </AlertDialog>
    </DialogContent>
  );
}
