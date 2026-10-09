"use client";

import React, { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState<boolean>(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    function handleOnline() {
      setIsOffline(false);
    }
    function handleOffline() {
      setIsOffline(true);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-rose-500/15 border-b border-rose-500/30 text-rose-300 px-4 py-2 text-xs sm:text-sm flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 max-w-7xl mx-auto">
        <WifiOff className="w-4 h-4 text-rose-400 shrink-0" />
        <span>
          <strong>Offline Mode Active:</strong> Device lost network connectivity. Application shell and local test history remain available via Service Worker and IndexedDB, but live probes will fail.
        </span>
      </div>
    </div>
  );
}
