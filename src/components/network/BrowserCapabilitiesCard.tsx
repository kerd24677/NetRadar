"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BrowserEnvironmentInfo } from "@/types/network";
import { Monitor, Check, X } from "lucide-react";

export function BrowserCapabilitiesCard() {
  const [envInfo, setEnvInfo] = useState<BrowserEnvironmentInfo | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isIos =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as unknown as { standalone?: boolean }).standalone);

    setEnvInfo({
      userAgent: navigator.userAgent,
      platform: navigator.platform || "Unknown",
      language: navigator.language || "en",
      screenResolution: `${window.screen.width} x ${window.screen.height}`,
      viewportSize: `${window.innerWidth} x ${window.innerHeight}`,
      devicePixelRatio: window.devicePixelRatio || 1,
      cookieEnabled: navigator.cookieEnabled,
      serviceWorkerSupported: "serviceWorker" in navigator,
      indexedDbSupported: "indexedDB" in window,
      webSocketSupported: "WebSocket" in window,
      webRtcSupported: "RTCPeerConnection" in window,
      isIos,
      isStandalonePwa: isStandalone,
      secureContext: window.isSecureContext,
    });
  }, []);

  if (!envInfo) return null;

  const capabilities = [
    { label: "Service Worker (PWA Shell)", supported: envInfo.serviceWorkerSupported },
    { label: "IndexedDB (Local Vault)", supported: envInfo.indexedDbSupported },
    { label: "WebSocket Protocol", supported: envInfo.webSocketSupported },
    { label: "WebRTC Data Channels", supported: envInfo.webRtcSupported },
    { label: "Secure Context (HTTPS / TLS)", supported: envInfo.secureContext },
    { label: "Standalone PWA Mode", supported: envInfo.isStandalonePwa },
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>
          <Monitor className="w-4 h-4 text-radar-teal" />
          Browser Environment & Web APIs
        </CardTitle>
        <Badge variant={envInfo.isIos ? "cyan" : "teal"}>
          {envInfo.isIos ? "Apple WebKit / iOS" : "Web Engine"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Capability Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {capabilities.map((cap, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-lg bg-radar-bg border border-radar-border flex items-center justify-between gap-2"
            >
              <span className="text-xs text-slate-300 font-medium">{cap.label}</span>
              {cap.supported ? (
                <Badge variant="emerald" className="px-1.5 py-0.2">
                  <Check className="w-3 h-3" />
                  Active
                </Badge>
              ) : (
                <Badge variant="muted" className="px-1.5 py-0.2">
                  <X className="w-3 h-3" />
                  No
                </Badge>
              )}
            </div>
          ))}
        </div>

        {/* System Specs */}
        <div className="bg-radar-bg p-3.5 rounded-lg border border-radar-border space-y-2 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-radar-subtle">Display Resolution:</span>
            <span className="text-slate-200">{envInfo.screenResolution} (@{envInfo.devicePixelRatio}x scale)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-radar-subtle">Viewport Geometry:</span>
            <span className="text-slate-200">{envInfo.viewportSize}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-radar-subtle">Locale / Language:</span>
            <span className="text-slate-200">{envInfo.language}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-radar-subtle">Client Timezone:</span>
            <span className="text-slate-200">{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
          </div>
          <div className="pt-1 border-t border-radar-border/40">
            <span className="text-radar-subtle block mb-1">User Agent:</span>
            <p className="text-[11px] text-slate-300 break-all leading-relaxed">
              {envInfo.userAgent}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
