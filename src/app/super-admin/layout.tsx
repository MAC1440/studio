
'use client';

import AuthGuard from "@/components/auth/AuthGuard";
import AppHeader from "@/components/layout/header";
import {
  SidebarProvider,
  Sidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AreaChart, Building, LifeBuoy } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import logo from '../../../public/logos/logo.png';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  return (
    <AuthGuard role="super-admin">
      <SidebarProvider>
        <div className="flex flex-col h-screen w-screen">
          <AppHeader />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar>
                <SidebarContent>
                  <SidebarHeader className="border-b">
                    <div className="flex items-center justify-between">
                     <Link href="/super-admin" className="flex items-center gap-2 font-bold text-lg tracking-tight">
                        <Image src={logo.src} alt="BoardR Logo" width={24} height={24} className="h-6 w-6" />
                        <span className="group-data-[collapsible=icon]:hidden">Super Admin</span>
                    </Link>
                    <SidebarTrigger className="hidden md:flex group-data-[collapsible=icon]:hidden" />
                    </div>
                  </SidebarHeader>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === '/super-admin'}>
                        <Link href="/super-admin">
                          <AreaChart />
                          Dashboard
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname.startsWith('/super-admin/support')}>
                        <Link href="/super-admin/support">
                          <LifeBuoy />
                          Support Inbox
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname.startsWith('/super-admin/organizations')}>
                        <Link href="/super-admin/organizations">
                          <Building />
                          Organizations
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarContent>
            </Sidebar>
            <SidebarInset>
              <main className="flex-1 overflow-auto p-4 md:p-8 mb-[60px]">
                {children}
              </main>
            </SidebarInset>
          </div>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
