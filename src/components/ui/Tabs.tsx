"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 p-1 bg-radar-bg border border-radar-border rounded-lg overflow-x-auto no-scrollbar",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap transition-all duration-150",
              isActive
                ? "bg-radar-surface text-radar-teal shadow border border-radar-teal/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-radar-surface/50"
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded text-[10px] font-mono",
                  isActive
                    ? "bg-radar-teal/20 text-radar-teal"
                    : "bg-slate-800 text-slate-400"
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
