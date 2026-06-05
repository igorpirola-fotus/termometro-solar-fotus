"use client";

import { useState } from "react";
import { Topbar } from "./Topbar";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
      
      <div className="flex flex-1 pt-14">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        
        <main className={cn(
          "flex-1 transition-all duration-300 p-6 max-w-[1600px] w-full mx-auto",
          isSidebarCollapsed ? "md:pl-[88px]" : "md:pl-[280px]"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
}
