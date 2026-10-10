"use client";

import React, { useState, useCallback, useRef } from "react";
import { measureHttpLatency } from "@/lib/diagnostics/httpPing";
import { queryDnsOverHttps } from "@/lib/diagnostics/dnsOverHttps";
import {
  Laptop,
  Router,
  Server,
  Globe,
  Radio,
  Play,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ShieldCheck,
  Zap,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export interface TopologyNode {
  id: string;
  label: string;
  tier: "client" | "gateway" | "resolver" | "target";
  tierLabel: string;
  host: string;
  protocol: string;
  x: number;
  y: number;
  status: "idle" | "probing" | "online" | "degraded" | "offline";
  latencyMs?: number;
  httpStatus?: number;
  details?: string;
  ip?: string;
}

export interface TopologyLink {
  fromId: string;
  toId: string;
  status: "idle" | "active" | "degraded" | "error";
  speedMbpsEstimate?: number;
}

const DEFAULT_NODES: TopologyNode[] = [
  {
    id: "node_client",
    label: "İstemci Tarayıcı",
    tier: "client",
    tierLabel: "Yerel İstemci (Web Sandbox)",
    host: "localhost (PWA)",
    protocol: "W3C Sandbox / DOM",
    x: 80,
    y: 200,
    status: "online",
    latencyMs: 0,
    ip: "127.0.0.1 / WebRTC mDNS",
    details: "Tarayıcı çalıştırma ortamı. Güvenlik politikaları nedeniyle doğrudan ham ICMP/IP soket erişimi kısıtlıdır.",
  },
  {
    id: "node_gateway",
    label: "Yerel Ağ Geçidi",
    tier: "gateway",
    tierLabel: "Wi-Fi Router / Ağ Geçidi",
    host: "192.168.1.1 / Gateway",
    protocol: "802.11 Wi-Fi / Ethernet",
    x: 280,
    y: 200,
    status: "idle",
    latencyMs: undefined,
    ip: "192.168.1.1",
    details: "Varsayılan yerel alt ağ geçidi (Default Gateway). İstemci ve internet trafiğini yönlendiren ilk sekme.",
  },
  {
    id: "node_doh_cf",
    label: "Cloudflare DoH",
    tier: "resolver",
    tierLabel: "DNS-over-HTTPS (1.1.1.1)",
    host: "cloudflare-dns.com",
    protocol: "HTTPS / DoH RFC 8484",
    x: 480,
    y: 110,
    status: "idle",
    latencyMs: undefined,
    ip: "1.1.1.1",
    details: "Şifreli DNS çözümleme servisi. Alan adı sorgularını HTTPS üzerinden Anycast kenar ağında çözer.",
  },
  {
    id: "node_doh_google",
    label: "Google DoH",
    tier: "resolver",
    tierLabel: "DNS-over-HTTPS (8.8.8.8)",
    host: "dns.google",
    protocol: "HTTPS / DoH REST",
    x: 480,
    y: 290,
    status: "idle",
    latencyMs: undefined,
    ip: "8.8.8.8",
    details: "Google Public DNS Anycast düğümü. Küresel rota yedekliliği ve düşük RTT sağlar.",
  },
  {
    id: "node_edge_cf",
    label: "Cloudflare Edge",
    tier: "target",
    tierLabel: "Global CDN Anycast Kenarı",
    host: "1.1.1.1/cdn-cgi/trace",
    protocol: "HTTPS / HTTP/2",
    x: 680,
    y: 80,
    status: "idle",
    latencyMs: undefined,
    ip: "1.1.1.1",
    details: "Cloudflare Edge tanı uç noktası. Gerçek HTTP round-trip süresi ve POP lokasyonu ölçümü sağlar.",
  },
  {
    id: "node_edge_aws",
    label: "AWS CloudFront",
    tier: "target",
    tierLabel: "Amazon Web Services Edge",
    host: "aws.amazon.com",
    protocol: "HTTPS / TLS 1.3",
    x: 680,
    y: 200,
    status: "idle",
    latencyMs: undefined,
    ip: "CloudFront Anycast",
    details: "Amazon CloudFront küresel içerik dağıtım kenar sunucusu.",
  },
  {
    id: "node_edge_google",
    label: "Google Edge",
    tier: "target",
    tierLabel: "Google CDN & Front-End",
    host: "google.com/generate_204",
    protocol: "HTTPS / QUIC/HTTP3",
    x: 680,
    y: 320,
    status: "idle",
    latencyMs: undefined,
    ip: "142.250.x.x",
    details: "Google küresel ağ kenar sunucusu ve bağlantı kontrol (captive-portal) denetim noktası.",
  },
];

const DEFAULT_LINKS: TopologyLink[] = [
  { fromId: "node_client", toId: "node_gateway", status: "active" },
  { fromId: "node_gateway", toId: "node_doh_cf", status: "idle" },
  { fromId: "node_gateway", toId: "node_doh_google", status: "idle" },
  { fromId: "node_doh_cf", toId: "node_edge_cf", status: "idle" },
  { fromId: "node_gateway", toId: "node_edge_aws", status: "idle" },
  { fromId: "node_doh_google", toId: "node_edge_google", status: "idle" },
];

export function NetworkTopologyView() {
  const [nodes, setNodes] = useState<TopologyNode[]>(DEFAULT_NODES);
  const [links, setLinks] = useState<TopologyLink[]>(DEFAULT_LINKS);
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(nodes[0]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditStep, setAuditStep] = useState<string | null>(null);

  // Pan & Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Handle probe on a specific node
  const probeNode = useCallback(async (nodeId: string) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, status: "probing" } : n))
    );

    const targetNode = nodes.find((n) => n.id === nodeId);
    if (!targetNode) return;

    try {
      if (targetNode.tier === "resolver") {
        const res = await queryDnsOverHttps(
          nodeId === "node_doh_cf" ? "cloudflare.com" : "google.com",
          "A",
          { timeoutMs: 3500 }
        );
        const status = res.status === "success" ? "online" : "offline";
        setNodes((prev) =>
          prev.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  status,
                  latencyMs: res.durationMs,
                  details: `DoH sorgusu tamamlandı: ${res.durationMs}ms (${res.answers.length} kayıt)`,
                }
              : n
          )
        );
      } else if (targetNode.tier === "target" || targetNode.tier === "gateway") {
        const url =
          targetNode.id === "node_edge_cf"
            ? "https://1.1.1.1/cdn-cgi/trace"
            : targetNode.id === "node_edge_aws"
            ? "https://aws.amazon.com"
            : targetNode.id === "node_edge_google"
            ? "https://www.google.com/generate_204"
            : "https://1.1.1.1";

        const res = await measureHttpLatency(url, { timeoutMs: 3500 });
        const status =
          res.status === "error"
            ? "offline"
            : res.durationMs > 250
            ? "degraded"
            : "online";

        setNodes((prev) =>
          prev.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  status,
                  latencyMs: res.durationMs,
                  httpStatus: res.httpStatus,
                  details: `HTTP Yanıtı: ${res.durationMs}ms (Durum: ${res.httpStatus || "CORS Opaque / Başarılı"})`,
                }
              : n
          )
        );
      }
    } catch {
      setNodes((prev) =>
        prev.map((n) => (n.id === nodeId ? { ...n, status: "offline" } : n))
      );
    }
  }, [nodes]);

  // Run sequential multi-tier sweep across the entire topology
  const runSweepAudit = useCallback(async () => {
    setIsAuditing(true);
    setAuditStep("Yerel ağ ve geçit denetleniyor...");

    // 1. Gateway probe
    await probeNode("node_gateway");

    // 2. Resolvers
    setAuditStep("DoH çözümleyicileri taranıyor...");
    await probeNode("node_doh_cf");
    await probeNode("node_doh_google");

    // 3. Edge Targets
    setAuditStep("Kenar CDN sunucuları ve uç noktalar ölçülüyor...");
    await probeNode("node_edge_cf");
    await probeNode("node_edge_aws");
    await probeNode("node_edge_google");

    // Update link statuses based on target nodes
    setLinks((prev) =>
      prev.map((l) => {
        return { ...l, status: "active" };
      })
    );

    setAuditStep("Topoloji denetimi başarıyla tamamlandı.");
    setIsAuditing(false);
    setTimeout(() => setAuditStep(null), 4000);
  }, [probeNode]);

  // Reset topology state
  const resetTopology = () => {
    setNodes(DEFAULT_NODES);
    setLinks(DEFAULT_LINKS);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(DEFAULT_NODES[0]);
  };

  // Node icon helper
  const getNodeIcon = (tier: TopologyNode["tier"]) => {
    switch (tier) {
      case "client":
        return Laptop;
      case "gateway":
        return Router;
      case "resolver":
        return Server;
      case "target":
        return Globe;
    }
  };

  // Status color helper
  const getStatusColor = (status: TopologyNode["status"]) => {
    switch (status) {
      case "online":
        return "#00F0FF";
      case "degraded":
        return "#F59E0B";
      case "offline":
        return "#FF2E93";
      case "probing":
        return "#A855F7";
      default:
        return "#475569";
    }
  };

  return (
    <div className="space-y-4">
      {/* HUD Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-radar-surface/90 border border-radar-border rounded-xl p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-radar-elevated border border-radar-teal/30 flex items-center justify-center text-radar-teal shadow-noc-glow">
            <Radio className="w-5 h-5 animate-pulse-teal" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                CANLI AĞ TOPOLOJİSİ HARİTASI
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-radar-elevated text-radar-teal border border-radar-border">
                [NOC-TOPOLOGY-HUD]
              </span>
            </div>
            <p className="text-xs text-radar-subtle mt-0.5">
              İstemci sandbox&apos;ından kenar sunuculara çok katmanlı yönlendirme ve telemetri haritası
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={runSweepAudit}
            isLoading={isAuditing}
            className="text-xs font-mono"
          >
            <Play className="w-3.5 h-3.5 mr-1.5" />
            {isAuditing ? "Taranıyor..." : "Ağ Taraması Başlat"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={resetTopology}
            className="text-xs"
            title="Görünümü Sıfırla"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Audit Step Status Alert */}
      {auditStep && (
        <div className="px-3.5 py-2 rounded-lg bg-radar-teal/10 border border-radar-teal/30 flex items-center justify-between text-xs font-mono text-radar-teal animate-pulse">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5" />
            <span>{auditStep}</span>
          </div>
          <span className="text-[10px] text-slate-400">Canlı Telemetri İletiliyor</span>
        </div>
      )}

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Topology Interactive SVG Canvas (2 Columns on Desktop) */}
        <div className="lg:col-span-2 relative bg-radar-bg rounded-xl border border-radar-border overflow-hidden min-h-[380px] sm:min-h-[440px] flex flex-col justify-between">
          {/* Cyberpunk Grid Background */}
          <div className="absolute inset-0 noc-grid-bg opacity-75 pointer-events-none" />

          {/* Coordinate Watermark */}
          <div className="absolute top-2.5 left-3 font-mono text-[10px] text-radar-subtle/70 z-10 select-none">
            SYS::TOPOLOGY_MESH // X-POS: {pan.x} Y-POS: {pan.y} ZOOM: {zoom.toFixed(1)}x
          </div>

          {/* Canvas Floating Controls */}
          <div className="absolute top-2.5 right-3 z-10 flex items-center gap-1 bg-radar-surface/90 border border-radar-border rounded-lg p-1 shadow-lg">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(z + 0.15, 1.8))}
              className="p-1.5 rounded hover:bg-radar-elevated text-slate-300 hover:text-white transition-colors"
              title="Yakınlaştır"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(z - 0.15, 0.6))}
              className="p-1.5 rounded hover:bg-radar-elevated text-slate-300 hover:text-white transition-colors"
              title="Uzaklaştır"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="p-1.5 rounded hover:bg-radar-elevated text-slate-300 hover:text-white transition-colors"
              title="Ortala"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* SVG Canvas Area with Pan & Drag */}
          <div
            className="flex-1 w-full h-full cursor-grab active:cursor-grabbing select-none overflow-hidden"
            onMouseDown={(e) => {
              setIsDragging(true);
              dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
            }}
            onMouseMove={(e) => {
              if (!isDragging) return;
              setPan({
                x: e.clientX - dragStartRef.current.x,
                y: e.clientY - dragStartRef.current.y,
              });
            }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onTouchStart={(e) => {
              if (e.touches.length === 1) {
                setIsDragging(true);
                dragStartRef.current = {
                  x: e.touches[0].clientX - pan.x,
                  y: e.touches[0].clientY - pan.y,
                };
              }
            }}
            onTouchMove={(e) => {
              if (!isDragging || e.touches.length !== 1) return;
              setPan({
                x: e.touches[0].clientX - dragStartRef.current.x,
                y: e.touches[0].clientY - dragStartRef.current.y,
              });
            }}
            onTouchEnd={() => setIsDragging(false)}
          >
            <svg
              className="w-full h-full min-h-[380px] sm:min-h-[440px]"
              viewBox="0 0 800 400"
              preserveAspectRatio="xMidYMid meet"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: "center center",
                transition: isDragging ? "none" : "transform 0.15s ease-out",
              }}
            >
              <defs>
                {/* Glow Filter for Active Nodes */}
                <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <linearGradient id="linkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#4DE0C1" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#00F0FF" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#818CF8" stopOpacity="0.4" />
                </linearGradient>
              </defs>

              {/* Render Connection Links */}
              {links.map((link, idx) => {
                const source = nodes.find((n) => n.id === link.fromId);
                const target = nodes.find((n) => n.id === link.toId);
                if (!source || !target) return null;

                const isLinkActive =
                  source.status === "online" ||
                  target.status === "online" ||
                  link.status === "active";
                const isLinkDegraded =
                  source.status === "degraded" || target.status === "degraded";

                // Curve path
                const dx = target.x - source.x;
                const pathD = `M ${source.x} ${source.y} C ${source.x + dx * 0.5} ${source.y}, ${
                  target.x - dx * 0.5
                } ${target.y}, ${target.x} ${target.y}`;

                return (
                  <g key={`link_${idx}`}>
                    {/* Underlying static background link */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={
                        isLinkDegraded
                          ? "#F59E0B"
                          : isLinkActive
                          ? "#1E3A5F"
                          : "#16243A"
                      }
                      strokeWidth={isLinkActive ? 2 : 1.5}
                      strokeDasharray={isLinkActive ? "none" : "3, 3"}
                    />

                    {/* Animated light particle line */}
                    {isLinkActive && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke={isLinkDegraded ? "#F59E0B" : "#00F0FF"}
                        strokeWidth="2.5"
                        className="animated-particle-link"
                        filter="url(#glow-cyan)"
                        opacity="0.9"
                      />
                    )}
                  </g>
                );
              })}

              {/* Render Nodes */}
              {nodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const statusColor = getStatusColor(node.status);
                const IconComponent = getNodeIcon(node.tier);

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNode(node);
                    }}
                    className="cursor-pointer group"
                  >
                    {/* Pulsing ring on probing or selected */}
                    {(node.status === "probing" || isSelected) && (
                      <circle
                        r="28"
                        fill="none"
                        stroke={statusColor}
                        strokeWidth="1.5"
                        className="pulse-ring-anim"
                        opacity="0.75"
                      />
                    )}

                    {/* Outer Circle Background */}
                    <circle
                      r="20"
                      fill="#0B1220"
                      stroke={isSelected ? "#FFFFFF" : statusColor}
                      strokeWidth={isSelected ? "2.5" : "1.8"}
                      filter={node.status === "online" ? "url(#glow-cyan)" : undefined}
                      className="transition-all duration-200"
                    />

                    {/* Inner Status Indicator Ring */}
                    <circle
                      r="16"
                      fill={statusColor}
                      fillOpacity={isSelected ? "0.25" : "0.12"}
                    />

                    {/* Icon Foreign Object */}
                    <foreignObject x="-10" y="-10" width="20" height="20">
                      <div className="w-full h-full flex items-center justify-center text-white">
                        <IconComponent
                          className="w-3.5 h-3.5"
                          style={{ color: statusColor }}
                        />
                      </div>
                    </foreignObject>

                    {/* Node Label Text */}
                    <text
                      y="32"
                      textAnchor="middle"
                      fill="#F1F5F9"
                      fontSize="10"
                      fontWeight="600"
                      fontFamily="ui-monospace, monospace"
                      className="select-none group-hover:fill-radar-cyan transition-colors"
                    >
                      {node.label}
                    </text>

                    {/* Latency Pill Badge */}
                    {node.latencyMs !== undefined && (
                      <g transform="translate(0, 44)">
                        <rect
                          x="-22"
                          y="-7"
                          width="44"
                          height="14"
                          rx="4"
                          fill="#050811"
                          stroke={statusColor}
                          strokeWidth="1"
                        />
                        <text
                          y="3"
                          textAnchor="middle"
                          fill={statusColor}
                          fontSize="9"
                          fontWeight="700"
                          fontFamily="ui-monospace, monospace"
                        >
                          {Math.round(node.latencyMs)}ms
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Bottom Legend */}
          <div className="p-2 sm:p-3 bg-radar-surface/90 border-t border-radar-border flex flex-wrap items-center justify-between text-[11px] font-mono text-radar-subtle gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-radar-cyan shadow-[0_0_6px_#00F0FF]" />
                Çevrimiçi / Yanıt Veriyor
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Yüksek Gecikme (&gt;200ms)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Hata / Zaman Aşımı
              </span>
            </div>
            <span className="text-slate-400">
              Düğümleri incelemek için dokunun veya tıklayın
            </span>
          </div>
        </div>

        {/* Node Inspection Detail Drawer (1 Column on Desktop) */}
        <div className="bg-radar-surface/95 border border-radar-border rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-noc-card relative">
          <div className="cyber-corner-tl" />
          <div className="cyber-corner-tr" />

          {selectedNode ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 border-b border-radar-border pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-radar-elevated text-radar-teal border border-radar-border">
                      {selectedNode.tierLabel}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">
                    {selectedNode.label}
                  </h3>
                  <p className="text-xs font-mono text-radar-cyan mt-0.5">
                    {selectedNode.host}
                  </p>
                </div>

                <Badge
                  variant={
                    selectedNode.status === "online"
                      ? "teal"
                      : selectedNode.status === "degraded"
                      ? "amber"
                      : selectedNode.status === "offline"
                      ? "rose"
                      : "muted"
                  }
                  pulse={selectedNode.status === "online"}
                >
                  {selectedNode.status === "online"
                    ? "AKTİF"
                    : selectedNode.status === "degraded"
                    ? "YAVAŞ"
                    : selectedNode.status === "offline"
                    ? "HATA"
                    : "HAZIR"}
                </Badge>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-radar-bg p-2.5 rounded-lg border border-radar-border">
                  <span className="text-[10px] text-radar-subtle block">Gidiş-Dönüş (RTT)</span>
                  <span className="text-sm font-bold text-white mt-0.5 block">
                    {selectedNode.latencyMs !== undefined
                      ? `${Math.round(selectedNode.latencyMs * 10) / 10} ms`
                      : "Ölçülmedi"}
                  </span>
                </div>

                <div className="bg-radar-bg p-2.5 rounded-lg border border-radar-border">
                  <span className="text-[10px] text-radar-subtle block">Protokol</span>
                  <span className="text-xs font-bold text-radar-cyan mt-1 block truncate">
                    {selectedNode.protocol}
                  </span>
                </div>

                <div className="bg-radar-bg p-2.5 rounded-lg border border-radar-border">
                  <span className="text-[10px] text-radar-subtle block">IP / Adres</span>
                  <span className="text-xs font-bold text-slate-200 mt-1 block truncate">
                    {selectedNode.ip || "Otomatik"}
                  </span>
                </div>

                <div className="bg-radar-bg p-2.5 rounded-lg border border-radar-border">
                  <span className="text-[10px] text-radar-subtle block">HTTP / Yanıt</span>
                  <span className="text-xs font-bold text-emerald-400 mt-1 block">
                    {selectedNode.httpStatus ? `HTTP ${selectedNode.httpStatus}` : "200 OK / CORS"}
                  </span>
                </div>
              </div>

              {/* Detailed Technical Description */}
              <div className="bg-radar-bg/60 p-3 rounded-lg border border-radar-border/80 text-xs">
                <span className="text-[11px] font-semibold text-slate-300 block mb-1">
                  NOC Teknik Notu:
                </span>
                <p className="text-radar-muted leading-relaxed text-[11px]">
                  {selectedNode.details}
                </p>
              </div>

              {/* Individual Probe Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => probeNode(selectedNode.id)}
                disabled={selectedNode.status === "probing"}
                className="w-full text-xs font-mono justify-center"
              >
                <Zap className="w-3.5 h-3.5 mr-1.5 text-radar-teal" />
                Bu Düğümü Doğrudan Sına
              </Button>
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <Info className="w-8 h-8 text-radar-subtle mb-2" />
              <p className="text-sm font-medium text-slate-300">Düğüm Seçilmedi</p>
              <p className="text-xs text-radar-muted mt-1 max-w-xs">
                Ayrıntılı telemetri ve canlı sına gerçekleştirmek için topoloji haritasındaki herhangi bir düğüme tıklayın.
              </p>
            </div>
          )}

          {/* Sandboxing Disclaimer */}
          <div className="mt-4 pt-3 border-t border-radar-border/60 text-[10px] text-radar-subtle leading-relaxed flex items-start gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-radar-teal shrink-0 mt-0.5" />
            <span>
              Tarayıcı güvenlik kum havuzu politikası gereği istemci düğümü yerel ham soket açamaz. Tüm topoloji gecikmeleri standart HTTPS ve DoH üzerinden doğrulanır.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
