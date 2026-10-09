"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Activity, Info } from "lucide-react";

export function ConnectionStatusCard() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [connectionInfo, setConnectionInfo] = useState<{
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
    supported: boolean;
  }>({ supported: false });

  useEffect(() => {
    setIsOnline(navigator.onLine);

    function updateOnline() {
      setIsOnline(navigator.onLine);
    }

    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);

    // Read NetworkInformation API (Chromium/Android; unsupported in iOS Safari)
    const nav = navigator as unknown as {
      connection?: {
        effectiveType?: string;
        downlink?: number;
        rtt?: number;
        saveData?: boolean;
        addEventListener?: (type: string, listener: () => void) => void;
      };
    };

    if (nav.connection) {
      setConnectionInfo({
        effectiveType: nav.connection.effectiveType,
        downlink: nav.connection.downlink,
        rtt: nav.connection.rtt,
        saveData: nav.connection.saveData,
        supported: true,
      });

      const handleConnChange = () => {
        if (nav.connection) {
          setConnectionInfo({
            effectiveType: nav.connection.effectiveType,
            downlink: nav.connection.downlink,
            rtt: nav.connection.rtt,
            saveData: nav.connection.saveData,
            supported: true,
          });
        }
      };

      nav.connection.addEventListener?.("change", handleConnChange);
    } else {
      setConnectionInfo({ supported: false });
    }

    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>
          <Activity className="w-4 h-4 text-radar-teal" />
          Browser Network Telemetry
        </CardTitle>
        <Badge variant={isOnline ? "teal" : "rose"} pulse={isOnline}>
          {isOnline ? "ONLINE (HINT)" : "OFFLINE"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Advisory disclaimer */}
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-radar-elevated/60 border border-radar-border text-xs text-radar-muted">
          <Info className="w-4 h-4 text-radar-cyan shrink-0 mt-0.5" />
          <p>
            <strong className="text-slate-200">OS Network Hint:</strong> Browser{" "}
            <code className="text-radar-teal font-mono">navigator.onLine</code> reflects the local interface state. It does not verify internet gateway reachability or WAN packet transit.
          </p>
        </div>

        {/* Network Information API Hints */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-radar-bg p-3 rounded-lg border border-radar-border">
            <span className="text-[11px] font-mono text-radar-subtle uppercase block">
              Effective Profile
            </span>
            <span className="text-base font-semibold text-slate-100 font-mono mt-0.5 block">
              {connectionInfo.supported && connectionInfo.effectiveType
                ? connectionInfo.effectiveType.toUpperCase()
                : "Not exposed"}
            </span>
            <span className="text-[10px] text-radar-muted">
              {connectionInfo.supported
                ? "Heuristic class (NetworkInfo)"
                : "Unsupported on iOS Safari / WebKit"}
            </span>
          </div>

          <div className="bg-radar-bg p-3 rounded-lg border border-radar-border">
            <span className="text-[11px] font-mono text-radar-subtle uppercase block">
              Estimated Downlink
            </span>
            <span className="text-base font-semibold text-slate-100 font-mono mt-0.5 block">
              {connectionInfo.supported && connectionInfo.downlink !== undefined
                ? `${connectionInfo.downlink} Mbps`
                : "Not exposed"}
            </span>
            <span className="text-[10px] text-radar-muted">
              {connectionInfo.supported ? "Browser estimate" : "Unsupported on iOS Safari / WebKit"}
            </span>
          </div>

          <div className="bg-radar-bg p-3 rounded-lg border border-radar-border">
            <span className="text-[11px] font-mono text-radar-subtle uppercase block">
              Estimated RTT
            </span>
            <span className="text-base font-semibold text-slate-100 font-mono mt-0.5 block">
              {connectionInfo.supported && connectionInfo.rtt !== undefined
                ? `${connectionInfo.rtt} ms`
                : "Not exposed"}
            </span>
            <span className="text-[10px] text-radar-muted">
              {connectionInfo.supported ? "Browser heuristic" : "Unavailable in iOS WebKit"}
            </span>
          </div>

          <div className="bg-radar-bg p-3 rounded-lg border border-radar-border">
            <span className="text-[11px] font-mono text-radar-subtle uppercase block">
              Data Saver Mode
            </span>
            <span className="text-base font-semibold text-slate-100 font-mono mt-0.5 block">
              {connectionInfo.supported && connectionInfo.saveData !== undefined
                ? connectionInfo.saveData ? "Enabled" : "Disabled"
                : "Not exposed"}
            </span>
            <span className="text-[10px] text-radar-muted">
              {connectionInfo.supported ? "Client hint" : "No client preference"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
