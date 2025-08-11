
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getOrCreateChatForProject, sendMessage, subscribeToMessages } from '@/lib/firebase/chat';
import { getProject } from '@/lib/firebase/projects';
import { type ChatMessage, type Project } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, ArrowLeft } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { format, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminChatViewPage() {
  const params: { chatId: string } = useParams();
  const projectId = params.chatId; // This is actually the projectId
  const router = useRouter();
  
  const [project, setProject] = useState<Project | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { user, userData } = useAuth();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const initializeChat = useCallback(async () => {
    if (!projectId || !userData?.organizationId) return;

    setIsLoading(true);
    try {
      const [fetchedProject, fetchedChatId] = await Promise.all([
        getProject(projectId),
        getOrCreateChatForProject(projectId, userData.organizationId)
      ]);
      
      if (!fetchedProject) {
        toast({ title: "Project not found", variant: "destructive" });
        router.push("/admin/chat");
        return;
      }
      setProject(fetchedProject);
      setChatId(fetchedChatId);

    } catch (error) {
        console.error("Failed to initialize chat:", error);
        toast({ title: "Error", description: "Could not load chat.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  }, [projectId, userData?.organizationId, toast, router]);

  useEffect(() => {
    initializeChat();
  }, [initializeChat]);


  useEffect(() => {
    if (!chatId) return;

    const unsubscribe = subscribeToMessages(chatId, (newMessages) => {
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
      });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !userData || !chatId) return;

    setIsSending(true);
    try {
      await sendMessage(
        chatId,
        {
          id: user.uid,
          name: userData.name,
          avatarUrl: userData.avatarUrl,
          role: userData.role,
        },
        newMessage
      );
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Error',
        description: 'Could not send message.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  let lastMessageDate: Date | null = null;
  
  if (isLoading) {
      return (
          <div className="flex flex-col h-full p-6">
              <div className="flex items-center gap-4 mb-4">
                  <Skeleton className="h-9 w-28" />
                  <Skeleton className="h-8 w-48" />
              </div>
              <div className="flex-1 border rounded-md p-4 space-y-4">
                  <Skeleton className="h-12 w-2/3" />
                  <Skeleton className="h-12 w-1/2 ml-auto" />
                   <Skeleton className="h-16 w-3/4" />
              </div>
               <div className="mt-4 flex gap-2 pt-4 border-t">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-24" />
               </div>
          </div>
      )
  }

  return (
    <div className="flex flex-col h-full p-4 md:p-6">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="outline" size="sm" asChild>
            <Link href="/admin/chat"><ArrowLeft className="mr-2 h-4 w-4"/> All Chats</Link>
        </Button>
        <h2 className="text-xl font-bold">{project?.name} - Chat</h2>
      </div>
      <div className="flex-1 flex flex-col border rounded-lg p-4">
      <ScrollArea className="flex-1 -mx-4 px-4">
        <div className="space-y-6 pb-4">
          {messages.map((message) => {
            if (!message.timestamp) return null; // Handle pending messages
            const messageDate = message.timestamp.toDate();
            const showDateSeparator =
              !lastMessageDate || !isSameDay(messageDate, lastMessageDate);
            lastMessageDate = messageDate;
            const isCurrentUser = message.sender.id === user?.uid;

            return (
              <div key={message.id}>
                {showDateSeparator && (
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        {format(messageDate, 'MMMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                )}
                <div
                  className={cn(
                    'flex items-start gap-3 w-full',
                    isCurrentUser && 'flex-row-reverse'
                  )}
                >
                  <Avatar>
                    <AvatarImage src={message.sender.avatarUrl} />
                    <AvatarFallback>
                      {message.sender.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      'w-full rounded-lg p-3',
                      isCurrentUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="text-sm font-semibold mb-1">
                      {message.sender.name}
                    </p>
                    <p className="whitespace-pre-wrap">{message.text}</p>
                    <p
                      className={cn(
                        'text-xs opacity-70 mt-1',
                        isCurrentUser ? 'text-right' : 'text-left'
                      )}
                    >
                      {format(messageDate, 'p')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <form
        onSubmit={handleSendMessage}
        className="mt-4 flex gap-2 pt-4 border-t"
      >
        <Textarea
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={isSending}
          className="flex-1"
          rows={1}
        />
        <Button type="submit" disabled={isSending || !newMessage.trim()}>
          <Send className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Send</span>
        </Button>
      </form>
      </div>
    </div>
  );
}

