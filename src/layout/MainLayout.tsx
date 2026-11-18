import React from "react";

import { Header } from "@/components/header";
import { MainSidebar } from "@/components/sidebar";
import { SidebarProvider } from "@/contexts/SidebarContext";

interface LayoutProps {
  children: React.ReactNode;
}

function MainLayout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        <MainSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Header />
          <main className="min-h-0 flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export { MainLayout };
