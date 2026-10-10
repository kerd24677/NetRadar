"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Radio, Shield, Wifi, WifiOff } from "lucide-react";
import { Badge } from "../ui/Badge";

export function Header() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isPwaInstalled, setIsPwaInstalled] = useState<boolean>(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    function handleOnline() {
      setIsOnline(true);
    }
    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as unknown as { standalone?: boolean }).standalone);
    setIsPwaInstalled(isStandalone);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-radar-surface/90 backdrop-blur-md border-b border-radar-border pt-safe">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-radar-elevated border border-radar-teal/40 flex items-center justify-center text-radar-teal shadow-noc-glow group-hover:scale-105 transition-transform">
            <Radio className="w-4 h-4 animate-pulse-teal" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg tracking-wider text-white">
                NET<span className="text-radar-teal font-extrabold">RADAR</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-radar-elevated text-radar-teal border border-radar-border">
                NOC v2.0
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-radar-subtle leading-none">
              Profesyonel Ağ Analiz ve Tanılama Laboratuvarı
            </p>
          </div>
        </Link>

        {/* Right Status Indicators */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isPwaInstalled && (
            <Badge variant="cyan" className="hidden sm:inline-flex">
              <Shield className="w-3 h-3" />
              PWA Modu
            </Badge>
          )}

          {/* Browser Connectivity Hint */}
          <div className="flex items-center gap-1.5">
            {isOnline ? (
              <Badge variant="teal" pulse={true} title="Tarayıcı navigator.onLine = true bildiriyor">
                <Wifi className="w-3 h-3" />
                <span className="hidden xs:inline">ÇEVRİMİÇİ</span>
              </Badge>
            ) : (
              <Badge variant="rose" title="Tarayıcı navigator.onLine = false bildiriyor">
                <WifiOff className="w-3 h-3" />
                <span>ÇEVRİMDIŞI</span>
              </Badge>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
