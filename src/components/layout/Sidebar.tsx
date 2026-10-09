"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Activity,
  Network,
  History,
  Settings,
  ShieldCheck,
  TrendingUp,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export const NAV_ITEMS = [
  {
    name: "Overview",
    href: "/",
    icon: LayoutDashboard,
    description: "NOC dashboard & telemetry",
  },
  {
    name: "Diagnostics",
    href: "/diagnostics",
    icon: Activity,
    description: "HTTP, DNS, Speed & TCP probes",
  },
  {
    name: "Stability",
    href: "/stability",
    icon: TrendingUp,
    description: "Jitter, percentiles & outages",
  },
  {
    name: "Field Map",
    href: "/map",
    icon: MapPin,
    description: "Wi-Fi RF survey & cell towers",
  },
  {
    name: "Network Info",
    href: "/network",
    icon: Network,
    description: "Client IP, heuristics & WebRTC",
  },
  {
    name: "History",
    href: "/history",
    icon: History,
    description: "Local IndexedDB telemetry log",
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    description: "DoH resolvers & iOS PWA setup",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-radar-surface/80 border-r border-radar-border shrink-0 min-h-[calc(100vh-4rem)] p-4">
      {/* Navigation Links */}
      <nav className="space-y-1.5 flex-1">
        <div className="px-3 py-2 text-[11px] font-mono uppercase tracking-wider text-radar-subtle">
          Main Console
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative",
                isActive
                  ? "bg-radar-elevated text-radar-teal border border-radar-teal/30 shadow-noc-glow"
                  : "text-slate-400 hover:text-slate-100 hover:bg-radar-elevated/50"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-radar-teal rounded-r" />
              )}
              <Icon
                className={cn(
                  "w-4 h-4 transition-colors",
                  isActive ? "text-radar-teal" : "text-slate-400 group-hover:text-slate-200"
                )}
              />
              <div className="flex-1">
                <div className="leading-snug">{item.name}</div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Security & System Info Footer */}
      <div className="pt-4 border-t border-radar-border">
        <div className="bg-radar-bg/60 rounded-lg p-3 border border-radar-border/60">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <ShieldCheck className="w-4 h-4 text-radar-teal" />
            <span>Local Vault Isolation</span>
          </div>
          <p className="text-[11px] text-radar-muted mt-1 leading-relaxed">
            All diagnostic records reside strictly in client IndexedDB. No telemetry is transmitted to third parties.
          </p>
        </div>
      </div>
    </aside>
  );
}
