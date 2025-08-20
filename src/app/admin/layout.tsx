
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
      const orgRef = doc(db, "organizations", userData.organizationId);
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
    organization?.subscriptionPlan === "startup" ||
    organization?.subscriptionPlan === "pro";

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

                  <SidebarGroup>
                    <SidebarGroupLabel>Workspace</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname.startsWith("/admin/projects")}
                        >
                          <Link href="/admin/projects">
                            <FolderKanban />
                            Projects
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                       <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname.startsWith("/admin/tickets")}
                        >
                          <Link href="/admin/tickets">
                            <Ticket />
                            Tickets
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname.startsWith("/admin/clients")}
                        >
                          <Link href="/admin/clients">
                            <Briefcase />
                            Clients
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarGroupContent>
                  </SidebarGroup>
                  
                  <SidebarGroup>
                    <SidebarGroupLabel>Client Engagement</SidebarGroupLabel>
                     <SidebarGroupContent>
                       {isOrgLoading ? (
                          <SidebarMenuSkeleton showIcon />
                        ) : isPaidPlan ? (
                          <>
                            <SidebarMenuItem>
                              <SidebarMenuButton
                                asChild
                                isActive={pathname.startsWith("/admin/proposals")}
                              >
                                <Link href="/admin/proposals">
                                  <FileText />
                                  Proposals
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                              <SidebarMenuButton
                                asChild
                                isActive={pathname.startsWith("/admin/invoices")}
                              >
                                <Link href="/admin/invoices">
                                  <DollarSign />
                                  Invoices
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          </>
                        ) : null}
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            asChild
                            isActive={pathname.startsWith("/admin/reports")}
                          >
                            <Link href="/admin/reports">
                              <ClipboardCheck />
                              Client Reports
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            asChild
                            isActive={pathname.startsWith("/admin/chat")}
                          >
                            <Link href="/admin/chat">
                              <MessageSquare />
                              Client Chat
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                     </SidebarGroupContent>
                  </SidebarGroup>

                  <SidebarGroup>
                    <SidebarGroupLabel>Settings</SidebarGroupLabel>
                    <SidebarGroupContent>
                       <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname.startsWith("/admin/users")}
                        >
                          <Link href="/admin/users">
                            <Users />
                            Users
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                       <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname.startsWith("/admin/billing")}
                        >
                          <Link href="/admin/billing">
                            <CreditCard />
                            Billing
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarGroupContent>
                  </SidebarGroup>
                  

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
