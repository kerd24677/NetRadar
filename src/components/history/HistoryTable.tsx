"use client";

import React from "react";
import { HistoryItem } from "@/types/history";
import { Badge } from "@/components/ui/Badge";
import { formatDuration, formatDateFull } from "@/lib/utils/formatters";
import { Trash2, Eye } from "lucide-react";

interface HistoryTableProps {
  items: HistoryItem[];
  onSelectItem: (item: HistoryItem) => void;
  onDeleteItem: (id: string) => void;
}

export function HistoryTable({
  items,
  onSelectItem,
  onDeleteItem,
}: HistoryTableProps) {
  if (items.length === 0) {
    return (
      <div className="p-8 rounded-xl bg-radar-surface border border-radar-border text-center space-y-2">
        <p className="text-sm text-slate-300 font-medium">Kayıtlı tanılama geçmişi bulunamadı</p>
        <p className="text-xs text-radar-muted">
          Arama kriterlerinizi değiştirmeyi deneyin veya yeni bir ağ tanılama testi başlatın.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-radar-surface rounded-xl border border-radar-border overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-radar-elevated text-radar-subtle border-b border-radar-border">
            <tr>
              <th className="p-3">Durum</th>
              <th className="p-3">Tür</th>
              <th className="p-3">Hedef</th>
              <th className="p-3">Süre</th>
              <th className="p-3">Özet</th>
              <th className="p-3">Zaman</th>
              <th className="p-3 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-radar-border bg-radar-surface">
            {items.map((item) => {
              const statusVariant =
                item.status === "success"
                  ? "emerald"
                  : item.status === "warning"
                  ? "amber"
                  : "rose";

              return (
                <tr
                  key={item.id}
                  className="hover:bg-radar-elevated/50 transition-colors cursor-pointer"
                  onClick={() => onSelectItem(item)}
                >
                  <td className="p-3">
                    <Badge variant={statusVariant} className="text-[10px]">
                      {item.status === "success" ? "BAŞARILI" : item.status === "warning" ? "UYARI" : "HATA"}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {item.category}
                    </Badge>
                  </td>
                  <td className="p-3 text-white font-semibold truncate max-w-[200px]">
                    {item.target}
                  </td>
                  <td className="p-3 text-radar-teal font-bold">
                    {formatDuration(item.durationMs)}
                  </td>
                  <td className="p-3 text-slate-300 truncate max-w-[240px]">
                    {item.summary}
                  </td>
                  <td className="p-3 text-radar-subtle whitespace-nowrap">
                    {formatDateFull(item.startTime)}
                  </td>
                  <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onSelectItem(item)}
                        className="p-1.5 rounded hover:bg-radar-elevated text-slate-400 hover:text-radar-teal transition-colors"
                        title="Ayrıntıları Görüntüle"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className="p-1.5 rounded hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Testi Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden divide-y divide-radar-border">
        {items.map((item) => {
          const statusVariant =
            item.status === "success"
              ? "emerald"
              : item.status === "warning"
              ? "amber"
              : "rose";

          return (
            <div
              key={item.id}
              onClick={() => onSelectItem(item)}
              className="p-3.5 space-y-2 hover:bg-radar-elevated/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Badge variant={statusVariant} className="text-[10px]">
                    {item.status === "success" ? "BAŞARILI" : item.status === "warning" ? "UYARI" : "HATA"}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {item.category}
                  </Badge>
                </div>
                <span className="text-xs font-mono font-bold text-radar-teal">
                  {formatDuration(item.durationMs)}
                </span>
              </div>

              <div>
                <p className="text-xs font-mono font-semibold text-white truncate">
                  {item.target}
                </p>
                <p className="text-[11px] text-radar-muted truncate mt-0.5">
                  {item.summary}
                </p>
              </div>

              <div className="flex items-center justify-between text-[10px] text-radar-subtle font-mono pt-1">
                <span>{formatDateFull(item.startTime)}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteItem(item.id);
                  }}
                  className="text-slate-400 hover:text-rose-400 p-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
