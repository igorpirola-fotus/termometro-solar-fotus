"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Cross2Icon, 
  DashboardIcon, 
  TargetIcon, 
  PersonIcon, 
  LightningBoltIcon, 
  ExclamationTriangleIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon
} from "@radix-ui/react-icons";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 md:hidden transition-opacity",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed top-14 bottom-0 left-0 bg-white border-r border-slate-200 z-40 flex flex-col transition-all duration-300 md:translate-x-0 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="h-10 flex items-center justify-between px-4 border-b border-slate-100 bg-slate-50/50">
          {!isCollapsed && (
            <span className="font-mono text-[10px] font-bold text-slate-500 tracking-wider">
              MENU PRINCIPAL
            </span>
          )}
          
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors md:hidden ml-auto"
          >
            <Cross2Icon className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleCollapse}
            className={cn(
              "hidden md:flex w-6 h-6 items-center justify-center rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-colors",
              isCollapsed ? "mx-auto" : "ml-auto"
            )}
          >
            {isCollapsed ? <DoubleArrowRightIcon /> : <DoubleArrowLeftIcon />}
          </button>
        </div>

        <div className="py-4 flex-1 overflow-y-auto scrollbar-none flex flex-col gap-6">
          <div>
            {!isCollapsed && (
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">
                Visão de Mercado
              </h3>
            )}
            <div className="space-y-0.5 px-3">
              <NavItem href="/" icon={DashboardIcon} label="Visão Geral" isActive={pathname === "/"} isCollapsed={isCollapsed} />
              <NavItem href="/marcas" icon={TargetIcon} label="Marcas & Share" isActive={pathname === "/marcas"} isCollapsed={isCollapsed} />
              <NavItem href="/distribuidores" icon={PersonIcon} label="Distribuidores" isActive={pathname === "/distribuidores"} isCollapsed={isCollapsed} />
            </div>
          </div>

          <div>
            {!isCollapsed && (
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">
                Ações
              </h3>
            )}
            <div className="space-y-0.5 px-3">
              <NavItem href="/oportunidades" icon={LightningBoltIcon} label="Oportunidades" isActive={pathname === "/oportunidades"} isCollapsed={isCollapsed} />
              <NavItem href="/crises" icon={ExclamationTriangleIcon} label="Crises & Alertas" isActive={pathname === "/crises"} badge="3" badgeVariant="destructive" isCollapsed={isCollapsed} />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function NavItem({ 
  href,
  icon: Icon, 
  label, 
  isActive, 
  badge, 
  badgeVariant = "default",
  isCollapsed
}: { 
  href: string;
  icon: any; 
  label: string; 
  isActive?: boolean; 
  badge?: string;
  badgeVariant?: "default" | "destructive";
  isCollapsed?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "w-full flex items-center gap-3 py-2 rounded-lg text-[13px] font-medium transition-all text-left group cursor-pointer",
        isActive 
          ? "bg-slate-100 text-slate-900 shadow-sm border border-slate-200/50" 
          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent",
        isCollapsed ? "justify-center px-0" : "px-3"
      )}
      title={isCollapsed ? label : undefined}
    >
      <Icon className={cn("w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110", isActive ? "text-amber-500" : "")} />
      
      {!isCollapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>
          {badge && (
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
              badgeVariant === "destructive" ? "bg-red-100 text-red-600" : "bg-slate-200 text-slate-700"
            )}>
              {badge}
            </span>
          )}
        </>
      )}
      
      {/* Badge dot quando collapsed */}
      {isCollapsed && badge && (
        <span className={cn(
          "absolute right-3 w-1.5 h-1.5 rounded-full",
          badgeVariant === "destructive" ? "bg-red-500" : "bg-slate-400"
        )} />
      )}
    </Link>
  );
}
