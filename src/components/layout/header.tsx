
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { User as UserIcon, LogOut, Settings, Shield, LogIn, Bell, Ticket, FolderKanban, FileText, PanelLeft, DollarSign, Calendar, ClipboardCheck, MessageSquare, CheckCheck, Crown } from 'lucide-react';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { type Notification } from '@/lib/types';
import { subscribeToNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/firebase/notifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Separator } from '../ui/separator';
import { useRouter, usePathname } from 'next/navigation';
import { SidebarTrigger } from '../ui/sidebar';
import { ThemeToggle } from './theme-toggle';
import logo from '../../../public/logos/logo.png'

function NotificationBell() {
    const { user, userData } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        if (user?.uid) {
            const unsubscribe = subscribeToNotifications(user.uid, setNotifications);
            return () => unsubscribe();
        }
    }, [user]);

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            await markNotificationAsRead(notification.id);
        }
        
        // Handle redirect based on user role and notification type
        if (userData?.role === 'admin') {
            if (notification.reportId) {
                 router.push(`/admin/reports?open_report=${notification.reportId}`);
            } else if (notification.proposalId) {
                router.push(`/admin/proposals?open_proposal=${notification.proposalId}`);
            } else if (notification.invoiceId) {
                router.push(`/admin/invoices?open_invoice=${notification.invoiceId}`);
            } else if(notification.chatId) {
                 router.push(`/admin/chat`); // Can be improved later to go to the specific chat
            } else if(notification.projectId) {
                router.push(`/board/${notification.projectId}`);
            }
        } else if (userData?.role === 'client') {
             if (notification.chatId && notification.projectId) {
                router.push(`/client/project/${notification.projectId}?open_chat=true`);
            } else if (notification.proposalId && notification.projectId) {
                router.push(`/client/project/${notification.projectId}?open_proposal=${notification.proposalId}`);
            } else if (notification.invoiceId && notification.projectId) {
                router.push(`/client/project/${notification.projectId}?open_invoice=${notification.invoiceId}`);
            } else if (notification.projectId) {
                router.push(`/client/project/${notification.projectId}`);
            }
        }
        setIsOpen(false);
    };

    const handleMarkAllRead = async () => {
        if (!user) return;
        try {
            await markAllNotificationsAsRead(user.uid);
            toast({ title: "All notifications marked as read." });
        } catch (error) {
            toast({ title: "Error", description: "Could not mark notifications as read.", variant: "destructive" });
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const getIconForNotification = (n: Notification) => {
        if(n.chatId) return <MessageSquare className={cn("h-5 w-5", !n.read ? "text-primary" : "text-muted-foreground")} />;
        if(n.proposalId) return <FileText className={cn("h-5 w-5", !n.read ? "text-primary" : "text-muted-foreground")} />;
        if(n.invoiceId) return <DollarSign className={cn("h-5 w-5", !n.read ? "text-primary" : "text-muted-foreground")} />;
        if(n.reportId) return <ClipboardCheck className={cn("h-5 w-5", !n.read ? "text-primary" : "text-muted-foreground")} />;
        return <Ticket className={cn("h-5 w-5", !n.read ? "text-primary" : "text-muted-foreground")} />;
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
                <div className="flex justify-between items-center p-4">
                    <h4 className="font-medium text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="text-xs h-7">
                            <CheckCheck className="mr-2 h-3.5 w-3.5" />
                            Mark all as read
                        </Button>
                    )}
                </div>
                <Separator />
                <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                        notifications.map(n => (
                            <div key={n.id}>
                                <div
                                    className={cn(
                                        "flex items-start gap-3 p-4 hover:bg-muted/50 cursor-pointer",
                                        !n.read && "bg-accent/50"
                                    )}
                                    onClick={() => handleNotificationClick(n)}
                                >
                                    <div className="mt-1">
                                        {getIconForNotification(n)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm">{n.message}</p>
                                        {n.projectName && (
                                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                                                <FolderKanban className="h-3 w-3" />
                                                {n.projectName}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {n.createdAt ? formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                                        </p>
                                    </div>
                                </div>
                                <Separator />
                            </div>
                        ))
                    ) : (
                        <p className="p-4 text-sm text-center text-muted-foreground">No new notifications</p>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

function HeaderContent() {
  const { user, userData, logout, loading } = useAuth();
  const pathname = usePathname();

  const getHomeLink = () => {
    if (!userData) return '/';
    switch (userData.role) {
        case 'super-admin': return '/super-admin';
        case 'admin': return '/admin';
        case 'client': return '/client';
        default: return '/board';
    }
  }
  
  const isAdminSection = pathname.startsWith('/admin') || pathname.startsWith('/super-admin');

  return (
    <header className="border-b border-border/60">
      <div className="flex h-16 items-center justify-between w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
            {isAdminSection && <SidebarTrigger />}
            <Link href={getHomeLink()} className="flex items-center gap-2">
              <Image src={logo.src} alt="BoardRLane Logo" width={24} height={24} className="h-6 w-6" />
              <span className="text-lg font-bold tracking-tight hidden sm:inline">BoardRLane</span>
            </Link>
        </div>
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="flex items-center gap-4">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          ) : user ? (
            <>
              <NotificationBell />
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-9 w-9 cursor-pointer">
                    <AvatarImage src={userData?.avatarUrl} alt={userData?.name} />
                    <AvatarFallback>{userData?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <p className="font-medium">{userData?.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                   {userData?.role === 'super-admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/super-admin">
                        <Crown className="mr-2 h-4 w-4" />
                        <span>Super Admin</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {userData?.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild>
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}


export default function AppHeader() {
    const { loading } = useAuth();
    
    if (loading) {
        return (
            <header className="border-b border-border/60">
              <div className="px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-36" />
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-9 w-9 rounded-full" />
                </div>
              </div>
            </header>
        )
    }

    return <HeaderContent />
}
