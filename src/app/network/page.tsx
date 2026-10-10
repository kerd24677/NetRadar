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
          Ağ ve Platform Telemetrisi
        </h1>
        <p className="text-xs sm:text-sm text-radar-muted mt-1">
          İstemci ağ arayüzlerinin, genel WAN rotalarının ve tarayıcı çalıştırma ortamı yeteneklerinin ayrıntılı denetimi.
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
