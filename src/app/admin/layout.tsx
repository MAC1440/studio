
'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import AppHeader from '@/components/layout/header';
import {
  SidebarProvider,
  Sidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarInset,
  SidebarHeader,
  SidebarTrigger,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  Home,
  Users,
  Ticket,
  FolderKanban,
  Briefcase,
  FileText,
  LayoutGrid,
  DollarSign,
  CreditCard,
  ClipboardCheck,
  MessageSquare,
  Zap,
  Settings,
  Building,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import logo from '../../../public/logos/logo.png';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { type Organization } from '@/lib/types';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const SidebarCollapsible = ({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
         <Button
            variant="ghost"
            className="w-full justify-start items-center gap-2 px-2"
          >
          {icon}
          <span className="flex-1 text-left group-data-[collapsible=icon]:hidden">{title}</span>
           <ChevronRight className={cn("h-4 w-4 shrink-0 transition-transform duration-200 group-data-[collapsible=icon]:hidden", isOpen && "rotate-90")} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenuSub className="group-data-[collapsible=icon]:hidden">{children}</SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  )
}


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { userData } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isOrgLoading, setIsOrgLoading] = useState(true);

  useEffect(() => {
    if (userData?.organizationId) {
      setIsOrgLoading(true);
      const orgRef = doc(db, 'organizations', userData.organizationId);
      getDoc(orgRef)
        .then((docSnap) => {
          if (docSnap.exists()) {
            setOrganization(docSnap.data() as Organization);
          }
        })
        .finally(() => {
          setIsOrgLoading(false);
        });
    } else if (!userData) {
      // If there's no user data at all yet, we are in a loading state.
      setIsOrgLoading(true);
    } else {
      // User data exists but no orgId (shouldn't happen for admin, but good practice)
      setIsOrgLoading(false);
    }
  }, [userData?.organizationId]);

  const isPaidPlan =
    organization?.subscriptionPlan === 'startup' ||
    organization?.subscriptionPlan === 'pro';

  const isSubpathActive = (subpath: string) => pathname.startsWith(`/admin/${subpath}`);

  return (
    <AuthGuard role="admin">
      <SidebarProvider>
        <div className="flex flex-col h-screen w-screen">
          <AppHeader />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar>
              <SidebarContent>
                <SidebarHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 font-bold text-lg tracking-tight"
                    >
                      <Image
                        src={logo.src}
                        alt="BoardR Logo"
                        width={24}
                        height={24}
                        className="h-6 w-6"
                      />
                      <span className="group-data-[collapsible=icon]:hidden">
                        BoardR
                      </span>
                    </Link>
                    <SidebarTrigger className="hidden md:flex group-data-[collapsible=icon]:hidden" />
                  </div>
                </SidebarHeader>
                <SidebarMenu className="p-2">
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/admin'}>
                      <Link href="/admin">
                        <Home />
                        Dashboard
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  {isOrgLoading ? (
                     <div className="px-2 space-y-2">
                      <SidebarMenuSkeleton showIcon />
                      <SidebarMenuSkeleton showIcon />
                      <SidebarMenuSkeleton showIcon />
                    </div>
                  ) : (
                    <>
                      <SidebarCollapsible 
                        title="Workspace" 
                        icon={<LayoutGrid className="h-4 w-4" />}
                        defaultOpen={isSubpathActive('projects') || isSubpathActive('tickets')}
                      >
                         <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={isSubpathActive('projects')}>
                              <Link href="/admin/projects"><FolderKanban /> Projects</Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={isSubpathActive('tickets')}>
                              <Link href="/admin/tickets"><Ticket /> Tickets</Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                      </SidebarCollapsible>

                      <SidebarCollapsible 
                        title="Clients" 
                        icon={<Briefcase className="h-4 w-4" />}
                        defaultOpen={isSubpathActive('clients') || isSubpathActive('chat') || isSubpathActive('reports')}
                        >
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={isSubpathActive('clients')}>
                              <Link href="/admin/clients"><Users /> Client Management</Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                           <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={isSubpathActive('chat')}>
                              <Link href="/admin/chat"><MessageSquare /> Client Chat</Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                           <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={isSubpathActive('reports')}>
                              <Link href="/admin/reports"><ClipboardCheck /> Client Reports</Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                      </SidebarCollapsible>
                      
                       {isPaidPlan && (
                          <SidebarCollapsible 
                            title="Financials" 
                            icon={<DollarSign className="h-4 w-4" />}
                            defaultOpen={isSubpathActive('invoices') || isSubpathActive('proposals')}
                          >
                              <SidebarMenuSubItem>
                                <SidebarMenuSubButton asChild isActive={isSubpathActive('proposals')}>
                                  <Link href="/admin/proposals"><FileText /> Proposals</Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                              <SidebarMenuSubItem>
                                <SidebarMenuSubButton asChild isActive={isSubpathActive('invoices')}>
                                  <Link href="/admin/invoices"><DollarSign /> Invoices</Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                          </SidebarCollapsible>
                        )}
                      
                       <SidebarCollapsible 
                        title="Settings" 
                        icon={<Settings className="h-4 w-4" />}
                        defaultOpen={isSubpathActive('users') || isSubpathActive('billing')}
                        >
                           <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={isSubpathActive('users')}>
                              <Link href="/admin/users"><Users /> Users</Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                           <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={isSubpathActive('billing')}>
                              <Link href="/admin/billing"><CreditCard /> Billing</Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                      </SidebarCollapsible>

                    </>
                  )}


                  {!isOrgLoading && !isPaidPlan && (
                    <div className="p-4 group-data-[collapsible=icon]:hidden mt-auto">
                      <div className="rounded-lg bg-accent/80 p-4 text-center">
                        <Zap className="mx-auto h-8 w-8 text-primary mb-2" />
                        <h4 className="font-semibold text-sm">
                          Upgrade for More
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 mb-3">
                          Unlock proposals, invoices, and more.
                        </p>
                        <Button size="sm" className="w-full" asChild>
                          <Link href="/admin/billing">Upgrade Now</Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </SidebarMenu>
              </SidebarContent>
            </Sidebar>
            <SidebarInset>
              <main className="flex-1 overflow-auto p-4 md:p-8">
                {children}
              </main>
            </SidebarInset>
          </div>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
