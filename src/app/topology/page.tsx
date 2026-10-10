"use client";

import React from "react";
import { NetworkTopologyView } from "@/components/topology/NetworkTopologyView";
import { Radio } from "lucide-react";

export default function TopologyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Radio className="w-5 h-5 text-radar-teal animate-pulse-teal" />
          Ağ Topolojisi ve Veri Yolu Görselleştirmesi
        </h1>
        <p className="text-xs sm:text-sm text-radar-muted mt-1">
          İstemci tarayıcısından kenar CDN ve DNS sunucularına kadar uçtan uca ağ yollarını, canlı gecikmeleri ve veri akışını izleyin.
        </p>
      </div>

      <NetworkTopologyView />
    </div>
  );
}
