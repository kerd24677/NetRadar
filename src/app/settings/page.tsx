"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { loadSettings, saveSettings } from "@/lib/storage/settingsStore";
import { clearAllHistory } from "@/lib/storage/historyStore";
import { DOH_RESOLVERS, DEFAULT_SETTINGS, UserSettings } from "@/types/settings";
import {
  Settings,
  Server,
  Clock,
  Smartphone,
  Trash2,
  CheckCircle2,
  Share,
  PlusSquare,
  ShieldCheck,
} from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
  }, []);

  function handleSave() {
    saveSettings(settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  }

  async function handlePurgeStorage() {
    await clearAllHistory();
    setIsPurgeModalOpen(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Settings className="w-5 h-5 text-radar-teal" />
          Settings & Configuration
        </h1>
        <p className="text-xs sm:text-sm text-radar-muted mt-1">
          Customize DNS-over-HTTPS resolvers, request timeouts, and view iPhone PWA installation instructions.
        </p>
      </div>

      {/* Main Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Server className="w-4 h-4 text-radar-teal" />
            DNS-over-HTTPS Resolver Configuration
          </CardTitle>
          <Badge variant="teal">RFC 8427</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-mono text-radar-subtle block">
              Default DoH Provider
            </label>
            <div className="space-y-2">
              {DOH_RESOLVERS.map((res) => {
                const isSelected = settings.dohResolverUrl === res.url;
                return (
                  <label
                    key={res.url}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-radar-elevated border-radar-teal/50 shadow-noc-glow"
                        : "bg-radar-bg border-radar-border hover:bg-radar-elevated/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="dohResolver"
                      checked={isSelected}
                      onChange={() => {
                        setSettings({
                          ...settings,
                          dohResolverUrl: res.url,
                          dohResolverName: res.name,
                        });
                      }}
                      className="mt-1 text-radar-teal focus:ring-radar-teal"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{res.name}</span>
                        {isSelected && <Badge variant="emerald" className="text-[10px]">Active</Badge>}
                      </div>
                      <p className="text-xs text-radar-muted mt-0.5">{res.description}</p>
                      <code className="text-[11px] text-radar-teal font-mono block mt-1 truncate">
                        {res.url}
                      </code>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diagnostic Engine Parameters */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Clock className="w-4 h-4 text-radar-teal" />
            Diagnostic Engine Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-radar-subtle block">
                HTTP & DNS Query Timeout
              </label>
              <select
                value={settings.defaultTimeoutMs}
                onChange={(e) =>
                  setSettings({ ...settings, defaultTimeoutMs: Number(e.target.value) })
                }
                className="w-full bg-radar-bg border border-radar-border rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-radar-teal"
              >
                <option value={3000}>3,000 ms (Fast)</option>
                <option value={5000}>5,000 ms (Standard)</option>
                <option value={10000}>10,000 ms (High latency links)</option>
              </select>
              <span className="text-[10px] text-radar-muted block">
                Maximum duration before aborting unresponsive network probes.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-radar-subtle block">
                Default Speed Test Payload
              </label>
              <select
                value={settings.speedPayloadSizeMb}
                onChange={(e) =>
                  setSettings({ ...settings, speedPayloadSizeMb: Number(e.target.value) })
                }
                className="w-full bg-radar-bg border border-radar-border rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-radar-teal"
              >
                <option value={1}>1.0 MB (Fast check)</option>
                <option value={2}>2.0 MB (Recommended)</option>
                <option value={5}>5.0 MB (High speed connections)</option>
              </select>
              <span className="text-[10px] text-radar-muted block">
                Controls size of raw byte stream transferred during throughput testing.
              </span>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Button onClick={handleSave}>
              Save Preferences
            </Button>
            {savedSuccess && (
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Preferences saved!
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* iOS Safari Installation Guide Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Smartphone className="w-4 h-4 text-radar-teal" />
            iOS Safari Home Screen Installation (PWA)
          </CardTitle>
          <Badge variant="cyan">Standalone Mode</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-radar-muted leading-relaxed">
            NetRadar is engineered as an installable Progressive Web App (PWA) compliant with Apple WebKit specifications. When added to the Home Screen, it runs in fullscreen standalone mode with native safe-area adaptation and offline capability.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-radar-bg border border-radar-border space-y-1.5">
              <div className="w-7 h-7 rounded-md bg-radar-elevated border border-radar-border flex items-center justify-center text-radar-teal text-xs font-bold font-mono">
                1
              </div>
              <span className="text-xs font-semibold text-slate-200 block">Open in Safari</span>
              <p className="text-[11px] text-radar-subtle leading-normal">
                Navigate to your deployed HTTPS URL on iPhone using Apple Safari.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-radar-bg border border-radar-border space-y-1.5">
              <div className="w-7 h-7 rounded-md bg-radar-elevated border border-radar-border flex items-center justify-center text-radar-teal text-xs font-bold font-mono">
                <Share className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200 block">Tap Share</span>
              <p className="text-[11px] text-radar-subtle leading-normal">
                Tap the Safari toolbar Share icon at the bottom of your screen.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-radar-bg border border-radar-border space-y-1.5">
              <div className="w-7 h-7 rounded-md bg-radar-elevated border border-radar-border flex items-center justify-center text-radar-teal text-xs font-bold font-mono">
                <PlusSquare className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200 block">Add to Home Screen</span>
              <p className="text-[11px] text-radar-subtle leading-normal">
                Scroll down the action sheet and select &apos;Add to Home Screen&apos;.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-radar-bg border border-radar-border space-y-1.5">
              <div className="w-7 h-7 rounded-md bg-radar-elevated border border-radar-border flex items-center justify-center text-radar-teal text-xs font-bold font-mono">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200 block">Launch Standalone</span>
              <p className="text-[11px] text-radar-subtle leading-normal">
                Open NetRadar from your iOS Home Screen icon without browser chrome.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vault Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Trash2 className="w-4 h-4 text-rose-400" />
            Storage & Local Vault Maintenance
          </CardTitle>
          <Badge variant="rose">Destructive Action</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-radar-muted">
            All telemetry history is persisted exclusively on this device inside IndexedDB. If you want to wipe all records and restore default settings, you may purge local vault data here.
          </p>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsPurgeModalOpen(true)}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Purge All Local Data
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isPurgeModalOpen}
        onClose={() => setIsPurgeModalOpen(false)}
        title="Purge Local Database"
        description="Permanently clear all cached measurements"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-radar-muted">
            This will immediately remove all diagnostic history from IndexedDB. Proceed?
          </p>
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-radar-border">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsPurgeModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handlePurgeStorage}
            >
              Purge Database
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
