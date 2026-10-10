"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./Sidebar";
import { cn } from "@/lib/utils/cn";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-radar-surface/95 backdrop-blur-md border-t border-radar-border pb-safe">
      <div className="flex items-center overflow-x-auto no-scrollbar h-16 px-1.5 gap-1">
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
                "flex flex-col items-center justify-center min-w-[62px] h-full py-1 gap-1 text-[9px] font-medium transition-colors relative shrink-0",
                isActive
                  ? "text-radar-teal font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-2 right-2 h-0.5 bg-radar-teal rounded-full shadow-[0_0_8px_rgba(77,224,193,0.8)]" />
              )}
              <Icon
                className={cn(
                  "w-4 h-4 transition-transform",
                  isActive && "scale-110 text-radar-teal"
                )}
              />
              <span className="truncate max-w-[58px] text-center">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
