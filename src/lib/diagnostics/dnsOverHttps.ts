import { DnsAnswer, DnsQueryResult, DnsRecordType, DnsResponse } from "@/types/dns";
import { validateHostname } from "../validation/urlValidation";

const TYPE_NUMBER_TO_NAME: Record<number, string> = {
  1: "A",
  2: "NS",
  5: "CNAME",
  6: "SOA",
  12: "PTR",
  15: "MX",
  16: "TXT",
  28: "AAAA",
  33: "SRV",
  257: "CAA",
};

const DNS_RCODE_NAMES: Record<number, string> = {
  0: "NOERROR (Success)",
  1: "FORMERR (Format Error)",
  2: "SERVFAIL (Server Failure)",
  3: "NXDOMAIN (Non-Existent Domain)",
  4: "NOTIMP (Not Implemented)",
  5: "REFUSED (Query Refused)",
  6: "YXDOMAIN (Name Exists when it should not)",
  7: "YXRRSET (RR Set Exists when it should not)",
  8: "NXRRSET (RR Set That Ought To Exist Does Not)",
  9: "NOTAUTH (Server Not Authoritative for zone)",
  10: "NOTZONE (Name not contained in zone)",
};

export interface DnsQueryOptions {
  resolverUrl?: string;
  timeoutMs?: number;
  abortSignal?: AbortSignal;
}

/**
 * Executes genuine DNS queries over HTTPS (DoH) via RFC 8427 / DNS-JSON APIs.
 * Works from any modern web browser or mobile client without requiring raw UDP port 53.
 */
export async function queryDnsOverHttps(
  domainInput: string,
  recordType: DnsRecordType = "A",
  options: DnsQueryOptions = {}
): Promise<DnsQueryResult> {
  const resolverUrl = options.resolverUrl || "https://cloudflare-dns.com/dns-query";
  const timeoutMs = options.timeoutMs ?? 6000;

  const validation = validateHostname(domainInput);
  if (!validation.isValid) {
    return {
      resolver: resolverUrl,
      domain: domainInput,
      recordType,
      durationMs: 0,
      status: "error",
      statusCode: -1,
      statusText: "Invalid Hostname",
      answers: [],
      errorMessage: validation.error || "Invalid domain name syntax.",
      timestamp: Date.now(),
    };
  }

  const cleanDomain = validation.cleanHostname;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (options.abortSignal) {
    options.abortSignal.addEventListener("abort", () => {
      clearTimeout(timeoutId);
      controller.abort();
    });
  }

  // Construct DoH request URL
  const url = new URL(resolverUrl);
  url.searchParams.set("name", cleanDomain);
  url.searchParams.set("type", recordType);
  url.searchParams.set("ct", "application/dns-json");

  const startTime = performance.now();

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/dns-json",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    const endTime = performance.now();
    clearTimeout(timeoutId);
    const durationMs = Math.round((endTime - startTime) * 100) / 100;

    if (!res.ok) {
      return {
        resolver: resolverUrl,
        domain: cleanDomain,
        recordType,
        durationMs,
        status: "error",
        statusCode: res.status,
        statusText: `Resolver HTTP ${res.status}`,
        answers: [],
        errorMessage: `DoH resolver returned HTTP ${res.status}: ${res.statusText}`,
        timestamp: Date.now(),
      };
    }

    const data: DnsResponse = await res.json();
    const rcode = data.Status ?? 0;
    const rcodeText = DNS_RCODE_NAMES[rcode] || `RCODE ${rcode}`;

    const formattedAnswers: DnsAnswer[] = (data.Answer || []).map((ans) => ({
      name: ans.name,
      type: ans.type,
      typeName: TYPE_NUMBER_TO_NAME[ans.type] || `TYPE${ans.type}`,
      TTL: ans.TTL,
      data: ans.data,
    }));

    const isSuccess = rcode === 0;

    return {
      resolver: resolverUrl,
      domain: cleanDomain,
      recordType,
      durationMs,
      status: isSuccess ? "success" : "error",
      statusCode: rcode,
      statusText: rcodeText,
      answers: formattedAnswers,
      dnssecValidated: Boolean(data.AD),
      raw: data,
      timestamp: Date.now(),
      errorMessage:
        rcode !== 0
          ? `DNS Query completed with error code ${rcode} (${rcodeText}).`
          : undefined,
    };
  } catch (err: unknown) {
    const endTime = performance.now();
    clearTimeout(timeoutId);
    const durationMs = Math.round((endTime - startTime) * 100) / 100;

    const isAbort =
      err instanceof DOMException && err.name === "AbortError";

    return {
      resolver: resolverUrl,
      domain: cleanDomain,
      recordType,
      durationMs,
      status: "error",
      statusCode: -1,
      statusText: isAbort ? "Query Timeout" : "Resolver Unreachable",
      answers: [],
      timestamp: Date.now(),
      errorMessage: isAbort
        ? `DNS-over-HTTPS query timed out after ${timeoutMs}ms.`
        : `Could not reach DNS-over-HTTPS resolver at ${resolverUrl}. Check network connectivity.`,
    };
  }
}
