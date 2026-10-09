/**
 * Network input validation & URL sanitization for NetRadar.
 * Prevents SSRF, malformed protocol inputs, and credential leakage.
 */

export interface UrlValidationResult {
  isValid: boolean;
  normalizedUrl: string;
  hostname: string;
  protocol: "http:" | "https:" | "";
  port?: number;
  isPrivateOrLocal: boolean;
  error?: string;
}

const PRIVATE_IP_REGEXES = [
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/, // 127.0.0.0/8
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/, // 10.0.0.0/8
  /^192\.168\.\d{1,3}\.\d{1,3}$/, // 192.168.0.0/16
  /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/, // 172.16.0.0/12
  /^169\.254\.\d{1,3}\.\d{1,3}$/, // Link-local
  /^0\.0\.0\.0$/,
  /^::1$/, // IPv6 loopback
  /^fe80:/i, // IPv6 link-local
  /^fc00:/i, // IPv6 unique local
  /^fd00:/i,
];

export function isPrivateIpOrLocalhost(hostname: string): boolean {
  const clean = hostname.trim().toLowerCase();
  if (
    clean === "localhost" ||
    clean.endsWith(".localhost") ||
    clean.endsWith(".local") ||
    clean.endsWith(".internal") ||
    clean === "ip6-localhost" ||
    clean === "ip6-loopback"
  ) {
    return true;
  }

  for (const regex of PRIVATE_IP_REGEXES) {
    if (regex.test(clean)) {
      return true;
    }
  }

  return false;
}

export function validateAndNormalizeUrl(rawInput: string): UrlValidationResult {
  const input = rawInput.trim();

  if (!input) {
    return {
      isValid: false,
      normalizedUrl: "",
      hostname: "",
      protocol: "",
      isPrivateOrLocal: false,
      error: "Target address cannot be empty.",
    };
  }

  // Prepend https:// if no protocol provided
  let urlString = input;
  if (!/^https?:\/\//i.test(urlString)) {
    // If it starts with another protocol like ftp://, javascript:, file:, reject immediately
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(urlString)) {
      return {
        isValid: false,
        normalizedUrl: "",
        hostname: "",
        protocol: "",
        isPrivateOrLocal: false,
        error: "Only HTTP and HTTPS protocols are supported for diagnostics.",
      };
    }
    urlString = "https://" + urlString;
  }

  try {
    const parsed = new URL(urlString);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return {
        isValid: false,
        normalizedUrl: "",
        hostname: "",
        protocol: "",
        isPrivateOrLocal: false,
        error: "Only HTTP and HTTPS protocols are supported.",
      };
    }

    // Strip credentials for safety
    parsed.username = "";
    parsed.password = "";

    const hostname = parsed.hostname.toLowerCase();
    if (!hostname) {
      return {
        isValid: false,
        normalizedUrl: "",
        hostname: "",
        protocol: "",
        isPrivateOrLocal: false,
        error: "Hostname is missing or invalid.",
      };
    }

    const isPrivate = isPrivateIpOrLocalhost(hostname);
    const port = parsed.port ? parseInt(parsed.port, 10) : undefined;

    return {
      isValid: true,
      normalizedUrl: parsed.toString(),
      hostname,
      protocol: parsed.protocol as "http:" | "https:",
      port,
      isPrivateOrLocal: isPrivate,
    };
  } catch {
    return {
      isValid: false,
      normalizedUrl: "",
      hostname: "",
      protocol: "",
      isPrivateOrLocal: false,
      error: "Invalid URL or domain format.",
    };
  }
}

export function validateHostname(rawInput: string): {
  isValid: boolean;
  cleanHostname: string;
  error?: string;
} {
  let clean = rawInput.trim();

  if (!clean) {
    return { isValid: false, cleanHostname: "", error: "Domain name cannot be empty." };
  }

  // Strip leading http:// or https:// if user pasted a URL
  clean = clean.replace(/^https?:\/\//i, "");
  // Strip trailing path/slash
  clean = clean.split("/")[0];
  // Strip port if present
  clean = clean.split(":")[0];
  clean = clean.toLowerCase();

  // Basic RFC 1123 hostname check (letters, digits, hyphens, dots) or IPv4/IPv6
  const hostnameRegex =
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$|^[a-z0-9]+$/i;

  if (!hostnameRegex.test(clean)) {
    return {
      isValid: false,
      cleanHostname: clean,
      error: "Invalid hostname format. Please enter a valid domain (e.g., example.com).",
    };
  }

  return { isValid: true, cleanHostname: clean };
}

export function validatePort(portInput: number | string): {
  isValid: boolean;
  port: number;
  error?: string;
} {
  const port = typeof portInput === "string" ? parseInt(portInput.trim(), 10) : portInput;

  if (isNaN(port) || port < 1 || port > 65535) {
    return {
      isValid: false,
      port: 0,
      error: "Port must be an integer between 1 and 65535.",
    };
  }

  return { isValid: true, port };
}
