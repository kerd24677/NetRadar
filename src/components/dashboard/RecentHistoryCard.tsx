"use client";

import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { HistoryItem } from "@/types/history";
import { formatDuration } from "@/lib/utils/formatters";
import { History, ArrowRight, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface RecentHistoryCardProps {
  items: HistoryItem[];
}

export function RecentHistoryCard({ items }: RecentHistoryCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>
          <History className="w-4 h-4 text-radar-teal" />
          Recent Diagnostic Telemetry
        </CardTitle>
        <Link
          href="/history"
          className="text-xs text-radar-teal hover:underline flex items-center gap-1 font-mono"
        >
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8 text-xs text-radar-muted">
            No local diagnostic runs logged yet. Execute a test to record telemetry.
          </div>
        ) : (
          <div className="divide-y divide-radar-border">
            {items.slice(0, 5).map((item) => {
              const statusIcon =
                item.status === "success" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : item.status === "warning" ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                );

              const statusVariant =
                item.status === "success"
                  ? "emerald"
                  : item.status === "warning"
                  ? "amber"
                  : "rose";

              return (
                <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {statusIcon}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-medium text-slate-200 truncate max-w-[160px] sm:max-w-[240px]">
                          {item.target}
                        </span>
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {item.category}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-radar-subtle truncate">
                        {item.summary}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <Badge variant={statusVariant}>
                      {formatDuration(item.durationMs)}
                    </Badge>
                    <span className="block text-[10px] text-radar-subtle font-mono mt-0.5">
                      {new Date(item.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
