
"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import AppHeader from "@/components/layout/header";
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
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
} from "@/components/ui/sidebar";
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
  Presentation,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import logo from "../../../public/logos/logo.png";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { type Organization } from "@/lib/types";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function CollapsibleSidebarGroup({ 
    label, 
    children, 
    subpaths 
}: { 
    label: string, 
    children: React.ReactNode, 
    subpaths: string[] 
}) {
    const pathname = usePathname();
    const isSubpathActive = (paths: string[]) => paths.some(p => pathname.startsWith(`/admin/${p}`));
    const [isOpen, setIsOpen] = useState(isSubpathActive(subpaths));

    useEffect(() => {
        setIsOpen(isSubpathActive(subpaths));
    }, [pathname, subpaths]);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-2 rounded-md hover:bg-sidebar-accent">
                    <span className="text-sm font-semibold">{label}</span>
                    <ChevronRight className={cn("h-4 w-4 transition-transform", isOpen && "rotate-90")} />
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="pl-4 py-1 space-y-1">
                    {children}
                </div>
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
  const { userData, organization, isOrgLoading } = useAuth();

  const isPaidPlan =
    organization?.subscriptionPlan === "startup" ||
    organization?.subscriptionPlan === "pro";

  const isSubpathActive = (path: string) => pathname.startsWith(`/admin/${path}`);

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
                        alt="BoardRLane Logo"
                        width={24}
                        height={24}
                        className="h-6 w-6"
                      />
                      <span className="group-data-[collapsible=icon]:hidden">
                        BoardRLane
                      </span>
                    </Link>
                    <SidebarTrigger className="hidden md:flex group-data-[collapsible=icon]:hidden" />
                  </div>
                </SidebarHeader>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/admin"}>
                      <Link href="/admin">
                        <Home />
                        Dashboard
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  <SidebarSeparator />

                  <CollapsibleSidebarGroup label="Workspace" subpaths={['projects', 'tickets', 'clients']}>
                     <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isSubpathActive('projects')}
                            size="sm"
                            variant="ghost"
                        >
                            <Link href="/admin/projects">
                                <FolderKanban className="h-4 w-4" />
                                Projects
                            </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                       <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isSubpathActive('tickets')}
                            size="sm"
                            variant="ghost"
                        >
                            <Link href="/admin/tickets">
                                <Ticket className="h-4 w-4"/>
                                Tickets
                            </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isSubpathActive('clients')}
                             size="sm"
                            variant="ghost"
                        >
                            <Link href="/admin/clients">
                                <Briefcase className="h-4 w-4"/>
                                Clients
                            </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                  </CollapsibleSidebarGroup>
                  
                    <SidebarSeparator />

                   <CollapsibleSidebarGroup label="Client Engagement" subpaths={['proposals', 'invoices', 'reports', 'chat']}>
                       {isOrgLoading ? (
                          <SidebarMenuSkeleton showIcon />
                        ) : isPaidPlan ? (
                          <>
                            <SidebarMenuItem>
                              <SidebarMenuButton
                                asChild
                                isActive={isSubpathActive('proposals')}
                                 size="sm"
                                variant="ghost"
                              >
                                <Link href="/admin/proposals">
                                  <FileText className="h-4 w-4"/>
                                  Proposals
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                              <SidebarMenuButton
                                asChild
                                isActive={isSubpathActive('invoices')}
                                 size="sm"
                                variant="ghost"
                              >
                                <Link href="/admin/invoices">
                                  <DollarSign className="h-4 w-4"/>
                                  Invoices
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          </>
                        ) : null}
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            asChild
                            isActive={isSubpathActive('reports')}
                             size="sm"
                            variant="ghost"
                          >
                            <Link href="/admin/reports">
                              <ClipboardCheck className="h-4 w-4"/>
                              Client Reports
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            asChild
                            isActive={isSubpathActive('chat')}
                             size="sm"
                            variant="ghost"
                          >
                            <Link href="/admin/chat">
                              <MessageSquare className="h-4 w-4"/>
                              Client Chat
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                   </CollapsibleSidebarGroup>
                  
                   <SidebarSeparator />

                   <CollapsibleSidebarGroup label="Settings" subpaths={['users', 'billing']}>
                       <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          isActive={isSubpathActive('users')}
                           size="sm"
                          variant="ghost"
                        >
                          <Link href="/admin/users">
                            <Users className="h-4 w-4"/>
                            Users
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                       <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          isActive={isSubpathActive('billing')}
                           size="sm"
                          variant="ghost"
                        >
                          <Link href="/admin/billing">
                            <CreditCard className="h-4 w-4"/>
                            Billing
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                   </CollapsibleSidebarGroup>
                  

                  {!isOrgLoading && !isPaidPlan && (
                    <div className="p-4 group-data-[collapsible=icon]:hidden mt-auto">
                      <div className="rounded-lg bg-accent/80 p-4 text-center">
                        <Zap className="mx-auto h-8 w-8 text-primary mb-2" />
                        <h4 className="font-semibold text-sm">
                          Upgrade for More
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 mb-3">
                          Unlock proposals, invoices, reports and more.
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
