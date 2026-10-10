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
    description: "Cloudflare 1.1.1.1 HTTPS üzerinden DNS JSON API'si",
  },
  {
    name: "Google (8.8.8.8)",
    url: "https://dns.google/resolve",
    description: "Google Genel DNS HTTPS üzerinden REST API'si",
  },
  {
    name: "Quad9 (9.9.9.9)",
    url: "https://dns.quad9.net/dns-query",
    description: "Quad9 Tehdit Engelleyici HTTPS üzerinden DNS",
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
