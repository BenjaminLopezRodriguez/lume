"use client";

import { AppSidebar } from "@/app/m/_components/app-sidebar";
import { BusinessProvider } from "@/app/m/_components/business-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export function MobileShell({ children }: { children: React.ReactNode }) {
  return (
    <BusinessProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="min-h-dvh bg-card text-foreground">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </BusinessProvider>
  );
}
