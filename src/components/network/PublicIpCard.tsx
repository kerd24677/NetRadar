"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Globe, RefreshCw } from "lucide-react";

interface IpResponse {
  ip: string;
  version: "IPv4" | "IPv6" | "Unknown";
  userAgent: string;
  language: string;
  host: string;
  protocol: string;
  headers?: {
    "cf-ray"?: string;
    "cf-ipcountry"?: string;
    "x-vercel-id"?: string;
    "x-vercel-ip-country"?: string;
    "x-vercel-ip-city"?: string;
  };
}

export function PublicIpCard() {
  const [data, setData] = useState<IpResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchIpDetails() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ip", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to query IP");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchIpDetails();
  }, []);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>
          <Globe className="w-4 h-4 text-radar-teal" />
          Public WAN Egress & Edge Route
        </CardTitle>
        <button
          onClick={fetchIpDetails}
          disabled={isLoading}
          className="p-1 rounded text-slate-400 hover:text-radar-teal transition-colors"
          title="Refresh IP details"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-radar-teal border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono text-radar-muted">Detecting public ingress IP...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            Error inspecting public IP: {error}
          </div>
        ) : data ? (
          <div className="space-y-3">
            <div className="bg-radar-bg p-4 rounded-lg border border-radar-border flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-radar-subtle uppercase block">
                  Public Client IP
                </span>
                <span className="text-xl font-bold font-mono text-white mt-1 block">
                  {data.ip}
                </span>
              </div>
              <Badge variant="teal">{data.version}</Badge>
            </div>

            <div className="bg-radar-bg p-3 rounded-lg border border-radar-border space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-radar-subtle">Ingress Protocol:</span>
                <span className="text-slate-200 uppercase">{data.protocol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-radar-subtle">Host Ingress:</span>
                <span className="text-slate-200">{data.host || "Localhost"}</span>
              </div>
              {data.headers?.["cf-ipcountry"] && (
                <div className="flex justify-between">
                  <span className="text-radar-subtle">Cloudflare Country:</span>
                  <span className="text-slate-200">{data.headers["cf-ipcountry"]}</span>
                </div>
              )}
              {data.headers?.["x-vercel-ip-country"] && (
                <div className="flex justify-between">
                  <span className="text-radar-subtle">Vercel Region Country:</span>
                  <span className="text-slate-200">{data.headers["x-vercel-ip-country"]}</span>
                </div>
              )}
              {data.headers?.["x-vercel-id"] && (
                <div className="flex justify-between">
                  <span className="text-radar-subtle">Edge Invocation ID:</span>
                  <span className="text-slate-200 truncate max-w-[200px]">{data.headers["x-vercel-id"]}</span>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
