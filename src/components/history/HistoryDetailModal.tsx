"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { HistoryItem } from "@/types/history";
import { formatDuration, formatDateFull } from "@/lib/utils/formatters";
import { Trash2, Copy, Check } from "lucide-react";

interface HistoryDetailModalProps {
  item: HistoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function HistoryDetailModal({
  item,
  isOpen,
  onClose,
  onDelete,
}: HistoryDetailModalProps) {
  const [copied, setCopied] = React.useState<boolean>(false);

  if (!item) return null;

  function copyJson() {
    if (!item) return;
    navigator.clipboard.writeText(JSON.stringify(item, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const statusVariant =
    item.status === "success"
      ? "emerald"
      : item.status === "warning"
      ? "amber"
      : "rose";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Telemetry Record Details"
      description={`ID: ${item.id}`}
      className="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Top Info Banner */}
        <div className="p-3.5 rounded-lg bg-radar-bg border border-radar-border flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-radar-subtle uppercase block">
              {item.category.toUpperCase()} Target
            </span>
            <span className="text-sm sm:text-base font-bold font-mono text-white mt-0.5 block break-all">
              {item.target}
            </span>
          </div>
          <Badge variant={statusVariant} className="text-xs">
            {item.status.toUpperCase()}
          </Badge>
        </div>

        {/* Core Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-radar-bg p-3 rounded-lg border border-radar-border">
            <span className="text-[11px] font-mono text-radar-subtle uppercase block">
              Duration
            </span>
            <span className="text-base font-bold font-mono text-white mt-0.5 block">
              {formatDuration(item.durationMs)}
            </span>
          </div>

          <div className="bg-radar-bg p-3 rounded-lg border border-radar-border">
            <span className="text-[11px] font-mono text-radar-subtle uppercase block">
              Timestamp
            </span>
            <span className="text-xs font-mono text-slate-200 mt-1 block">
              {formatDateFull(item.startTime)}
            </span>
          </div>

          <div className="bg-radar-bg p-3 rounded-lg border border-radar-border col-span-2 sm:col-span-1">
            <span className="text-[11px] font-mono text-radar-subtle uppercase block">
              Storage
            </span>
            <span className="text-xs font-mono text-slate-200 mt-1 block">
              Local IndexedDB
            </span>
          </div>
        </div>

        {/* Summary & Error */}
        <div className="space-y-2">
          <span className="text-xs font-mono text-radar-subtle uppercase block">Summary</span>
          <p className="text-xs font-mono text-slate-200 bg-radar-bg p-3 rounded-lg border border-radar-border">
            {item.summary}
          </p>
        </div>

        {item.errorMessage && (
          <div className="space-y-1">
            <span className="text-xs font-mono text-rose-400 uppercase block">Error Details</span>
            <p className="text-xs font-mono text-rose-300 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 leading-relaxed">
              {item.errorMessage}
            </p>
          </div>
        )}

        {/* Raw Payload JSON */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-radar-subtle uppercase">Raw Telemetry JSON</span>
            <button
              onClick={copyJson}
              className="text-xs text-radar-teal hover:underline flex items-center gap-1 font-mono"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied" : "Copy JSON"}
            </button>
          </div>
          <pre className="bg-radar-bg p-3 rounded-lg border border-radar-border text-[11px] font-mono text-slate-300 max-h-48 overflow-y-auto overflow-x-auto">
            {JSON.stringify(item.details, null, 2)}
          </pre>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-radar-border">
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              onDelete(item.id);
              onClose();
            }}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Delete Record
          </Button>

          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
