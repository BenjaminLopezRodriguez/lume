"use client";

import { AppSidebar } from "@/app/m/_components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export function MobileShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-h-dvh bg-white text-neutral-950">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
