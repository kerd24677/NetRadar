"use client";

import React from "react";
import { BrowserCapabilitiesCard } from "@/components/network/BrowserCapabilitiesCard";
import { PublicIpCard } from "@/components/network/PublicIpCard";
import { WebRtcDiscoveryCard } from "@/components/network/WebRtcDiscoveryCard";
import { NativeHardwareNoticeCard } from "@/components/network/NativeHardwareNoticeCard";
import { ConnectionStatusCard } from "@/components/dashboard/ConnectionStatusCard";
import { Network } from "lucide-react";

export default function NetworkPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Network className="w-5 h-5 text-radar-teal" />
          Network & Platform Telemetry
        </h1>
        <p className="text-xs sm:text-sm text-radar-muted mt-1">
          Detailed inspection of genuine client network interfaces, public WAN routes, and browser execution capabilities.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PublicIpCard />
        <ConnectionStatusCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BrowserCapabilitiesCard />
        <WebRtcDiscoveryCard />
      </div>

      <NativeHardwareNoticeCard />
    </div>
  );
}
