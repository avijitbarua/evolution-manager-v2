import React from "react";
import { useParams } from "react-router-dom";

import { Header } from "@/components/header";
import { InstanceSidebar } from "@/components/sidebar";
import { InstanceProvider } from "@/contexts/InstanceContext";
import { SidebarProvider } from "@/contexts/SidebarContext";

interface LayoutProps {
  children: React.ReactNode;
}

function InstanceLayout({ children }: LayoutProps) {
  const { instanceId } = useParams<{ instanceId: string }>();

  return (
    <InstanceProvider>
      <SidebarProvider>
        <div className="flex h-screen bg-background overflow-hidden">
          <InstanceSidebar />
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <Header instanceId={instanceId} />
            <main className="min-h-0 flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </InstanceProvider>
  );
}

export { InstanceLayout };
