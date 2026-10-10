"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Radio, ShieldAlert, RefreshCw } from "lucide-react";

interface IceCandidateInfo {
  candidate: string;
  type: string;
  protocol: string;
  address: string;
  port: number;
}

export function WebRtcDiscoveryCard() {
  const [candidates, setCandidates] = useState<IceCandidateInfo[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  async function discoverCandidates() {
    if (typeof window === "undefined" || !("RTCPeerConnection" in window)) {
      return;
    }

    setIsScanning(true);
    setCandidates([]);

    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      pc.createDataChannel("netradar_probe");

      const found: IceCandidateInfo[] = [];

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const c = event.candidate;
          const parts = c.candidate.split(" ");
          const candObj: IceCandidateInfo = {
            candidate: c.candidate,
            type: c.type || (parts[7] || "host"),
            protocol: c.protocol || parts[2] || "udp",
            address: c.address || parts[4] || "mDNS Maskeli",
            port: c.port || parseInt(parts[5], 10) || 0,
          };

          found.push(candObj);
          setCandidates([...found]);
        } else {
          setIsScanning(false);
          pc.close();
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      setTimeout(() => {
        if (pc.signalingState !== "closed") {
          pc.close();
          setIsScanning(false);
        }
      }, 4000);
    } catch (err) {
      console.warn("WebRTC adayı hatası:", err);
      setIsScanning(false);
    }
  }

  useEffect(() => {
    discoverCandidates();
  }, []);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>
          <Radio className="w-4 h-4 text-radar-teal" />
          WebRTC ICE Adayı Sınaması
        </CardTitle>
        <Badge variant="cyan">STUN RFC 5389</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3.5 rounded-lg bg-radar-elevated/40 border border-radar-border text-xs text-radar-muted space-y-1.5">
          <div className="flex items-center gap-2 text-slate-200 font-medium">
            <ShieldAlert className="w-4 h-4 text-radar-cyan shrink-0" />
            <span>mDNS Gizliliği &amp; Yerel IP Maskeleme Bildirimi</span>
          </div>
          <p>
            Modern web tarayıcıları (iOS Safari ve Chrome dahil), iç özel IPv4/IPv6 adreslerini rastgele <code className="text-radar-teal font-mono">.local</code> mDNS UUID değerleriyle maskeleyerek gizler (IETF rtcweb-mdns standardı).
          </p>
          <p className="text-radar-subtle text-[11px]">
            Bu güvenlik mekanizması, web sitelerinin yerel ağ alt ağlarını haritalamasını ve cihaz parmak izi çıkarmasını engeller.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-radar-subtle">
            <span>Keşfedilen ICE Adayları ({candidates.length})</span>
            <Button
              variant="outline"
              size="sm"
              onClick={discoverCandidates}
              disabled={isScanning}
              className="h-7 text-xs"
              leftIcon={<RefreshCw className={`w-3 h-3 ${isScanning ? "animate-spin" : ""}`} />}
            >
              Yeniden Keşfet
            </Button>
          </div>

          {candidates.length === 0 ? (
            <div className="p-4 rounded-lg bg-radar-bg border border-radar-border text-center text-xs font-mono text-radar-muted">
              {isScanning ? "STUN ICE adayları toplanıyor..." : "Aday bulunamadı veya toplama tamamlandı."}
            </div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {candidates.map((cand, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-radar-bg border border-radar-border flex items-center justify-between gap-2 text-xs font-mono"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-slate-200 font-semibold block truncate">
                      {cand.address}:{cand.port}
                    </span>
                    <span className="text-[10px] text-radar-subtle">
                      Protokol: {cand.protocol.toUpperCase()} | Tür: {cand.type}
                    </span>
                  </div>
                  <Badge variant={cand.address.includes(".local") ? "amber" : "teal"}>
                    {cand.address.includes(".local") ? "mDNS Maskeli" : "Wan Adayı"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
