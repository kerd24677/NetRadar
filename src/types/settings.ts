export interface UserSettings {
  dohResolverUrl: string;
  dohResolverName: string;
  defaultTimeoutMs: number;
  speedPayloadSizeMb: number;
  allowPrivateIpWarning: boolean;
  theme: "dark";
}

export const DOH_RESOLVERS = [
  {
    name: "Cloudflare (1.1.1.1)",
    url: "https://cloudflare-dns.com/dns-query",
    description: "Cloudflare 1.1.1.1 DNS over HTTPS JSON API",
  },
  {
    name: "Google (8.8.8.8)",
    url: "https://dns.google/resolve",
    description: "Google Public DNS over HTTPS REST API",
  },
  {
    name: "Quad9 (9.9.9.9)",
    url: "https://dns.quad9.net/dns-query",
    description: "Quad9 Threat-blocking DNS over HTTPS",
  },
];

export const DEFAULT_SETTINGS: UserSettings = {
  dohResolverUrl: "https://cloudflare-dns.com/dns-query",
  dohResolverName: "Cloudflare (1.1.1.1)",
  defaultTimeoutMs: 5000,
  speedPayloadSizeMb: 5,
  allowPrivateIpWarning: true,
  theme: "dark",
};
