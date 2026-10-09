"use client";

import React, { useState, useEffect, useCallback } from "react";
import { HistoryFilterBar } from "@/components/history/HistoryFilterBar";
import { HistoryTable } from "@/components/history/HistoryTable";
import { HistoryDetailModal } from "@/components/history/HistoryDetailModal";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  getAllHistory,
  deleteHistoryItem,
  clearAllHistory,
} from "@/lib/storage/historyStore";
import { generateHistoryCsv, downloadCsvFile } from "@/lib/exports/csvExport";
import { HistoryFilter, HistoryItem } from "@/types/history";
import { History, Download, Trash2 } from "lucide-react";

export default function HistoryPage() {
  const [filter, setFilter] = useState<HistoryFilter>({
    category: "all",
    status: "all",
    searchQuery: "",
    sortBy: "newest",
  });
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllHistory(filter);
      setItems(data);
    } catch (err) {
      console.error("Error loading history:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function handleDelete(id: string) {
    await deleteHistoryItem(id);
    await fetchItems();
  }

  async function handleConfirmClearAll() {
    await clearAllHistory();
    setIsClearModalOpen(false);
    await fetchItems();
  }

  function handleExportCsv() {
    if (items.length === 0) return;
    const csv = generateHistoryCsv(items);
    const filename = `netradar_telemetry_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCsvFile(filename, csv);
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <History className="w-5 h-5 text-radar-teal" />
            Diagnostic Telemetry History
          </h1>
          <p className="text-xs sm:text-sm text-radar-muted mt-1">
            Locally persisted IndexedDB records. Encrypted within client sandbox without remote leakage.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCsv}
            disabled={items.length === 0}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsClearModalOpen(true)}
            disabled={items.length === 0}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <HistoryFilterBar filter={filter} onChange={setFilter} />

      {/* History Table */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-radar-teal border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-radar-muted">Loading local history...</span>
        </div>
      ) : (
        <HistoryTable
          items={items}
          onSelectItem={(item) => {
            setSelectedItem(item);
            setIsDetailOpen(true);
          }}
          onDeleteItem={handleDelete}
        />
      )}

      {/* Detail Modal */}
      <HistoryDetailModal
        item={selectedItem}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onDelete={handleDelete}
      />

      {/* Clear Confirmation Modal */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title="Confirm Clear History"
        description="Permanently delete all local telemetry logs"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-radar-muted">
            Are you sure you want to purge all <strong className="text-white">{items.length}</strong> diagnostic records from your browser&apos;s IndexedDB? This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-radar-border">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsClearModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmClearAll}
            >
              Purge All Data
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
