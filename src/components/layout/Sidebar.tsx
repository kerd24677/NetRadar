"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Radio,
  Activity,
  TrendingUp,
  MapPin,
  Network,
  History,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export const NAV_ITEMS = [
  {
    name: "Genel Bakış",
    href: "/",
    icon: LayoutDashboard,
    description: "NOC kontrol paneli & canlı telemetri",
  },
  {
    name: "Ağ Topolojisi",
    href: "/topology",
    icon: Radio,
    description: "Uçtan uca yönlendirme & veri yolu haritası",
  },
  {
    name: "Tanılama",
    href: "/diagnostics",
    icon: Activity,
    description: "HTTP, DNS, Hız & TCP port taraması",
  },
  {
    name: "Kararlılık",
    href: "/stability",
    icon: TrendingUp,
    description: "Gecikme değişimi, yüzdelikler & kesintiler",
  },
  {
    name: "Saha Haritası",
    href: "/map",
    icon: MapPin,
    description: "Wi-Fi RF tarama & baz istasyonları",
  },
  {
    name: "Ağ Bilgisi",
    href: "/network",
    icon: Network,
    description: "İstemci IP, tarayıcı yetenekleri & WebRTC",
  },
  {
    name: "Geçmiş",
    href: "/history",
    icon: History,
    description: "Yerel IndexedDB telemetri günlüğü",
  },
  {
    name: "Ayarlar",
    href: "/settings",
    icon: Settings,
    description: "DoH çözümleyiciler & iOS PWA kurulumu",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-radar-surface/80 border-r border-radar-border shrink-0 min-h-[calc(100vh-4rem)] p-4">
      {/* Navigation Links */}
      <nav className="space-y-1.5 flex-1">
        <div className="px-3 py-2 text-[11px] font-mono uppercase tracking-wider text-radar-subtle flex items-center justify-between">
          <span>Ana Konsol</span>
          <span className="text-radar-teal text-[9px]">[NOC]</span>
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
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-radar-teal rounded-r shadow-[0_0_8px_#4DE0C1]" />
              )}
              <Icon
                className={cn(
                  "w-4 h-4 transition-colors shrink-0",
                  isActive ? "text-radar-teal" : "text-slate-400 group-hover:text-slate-200"
                )}
              />
              <div className="flex-1 truncate">
                <div className="leading-snug truncate">{item.name}</div>
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
            <span>Yerel Kasa İzolasyonu</span>
          </div>
          <p className="text-[11px] text-radar-muted mt-1 leading-relaxed">
            Tüm tanı kayıtları yalnızca cihazınızın IndexedDB deposunda saklanır. Üçüncü taraflara veri iletilmez.
          </p>
        </div>
      </div>
    </aside>
  );
}
