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

      // Create a dummy data channel to trigger ICE candidate gathering
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
            address: c.address || parts[4] || "mDNS Masked",
            port: c.port || parseInt(parts[5], 10) || 0,
          };

          found.push(candObj);
          setCandidates([...found]);
        } else {
          // Gathering completed
          setIsScanning(false);
          pc.close();
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 4 second timeout safeguard
      setTimeout(() => {
        if (pc.signalingState !== "closed") {
          pc.close();
          setIsScanning(false);
        }
      }, 4000);
    } catch (err) {
      console.warn("WebRTC candidate error:", err);
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
          WebRTC ICE Candidate Probe
        </CardTitle>
        <Badge variant="cyan">STUN RFC 5389</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3.5 rounded-lg bg-radar-elevated/40 border border-radar-border text-xs text-radar-muted space-y-1.5">
          <div className="flex items-center gap-2 text-slate-200 font-medium">
            <ShieldAlert className="w-4 h-4 text-radar-cyan shrink-0" />
            <span>mDNS Privacy & Local IP Masking Notice</span>
          </div>
          <p>
            Modern web browsers (including iOS Safari and Chrome) intentionally obscure internal private IPv4/IPv6 addresses by replacing host candidates with randomized <code className="text-radar-teal font-mono">.local</code> mDNS UUIDs (per IETF rtcweb-mdns-ice-candidates).
          </p>
          <p className="text-radar-subtle text-[11px]">
            This prevents malicious websites from fingerprinting private subnets or mapping internal LAN devices.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-radar-subtle uppercase">
            Discovered Candidates ({candidates.length})
          </span>
          <Button
            size="sm"
            variant="secondary"
            onClick={discoverCandidates}
            isLoading={isScanning}
            leftIcon={<RefreshCw className="w-3 h-3" />}
          >
            Probe ICE
          </Button>
        </div>

        {candidates.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {candidates.map((c, i) => (
              <div
                key={i}
                className="p-2.5 rounded-lg bg-radar-bg border border-radar-border text-xs font-mono space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-radar-teal font-semibold">
                    {c.address}:{c.port}
                  </span>
                  <Badge variant={c.type === "srflx" ? "emerald" : "outline"} className="text-[10px]">
                    {c.type.toUpperCase()} ({c.protocol.toUpperCase()})
                  </Badge>
                </div>
                <p className="text-[10px] text-radar-subtle break-all truncate">
                  {c.candidate}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-radar-bg border border-radar-border text-center text-xs text-radar-muted">
            {isScanning
              ? "Gathering ICE candidates via STUN server..."
              : "No ICE candidates gathered or WebRTC permissions withheld."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
