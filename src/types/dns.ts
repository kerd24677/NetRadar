export type DnsRecordType = "A" | "AAAA" | "CNAME" | "MX" | "NS" | "TXT" | "SOA" | "PTR" | "SRV";

export interface DnsAnswer {
  name: string;
  type: number;
  typeName?: string;
  TTL: number;
  data: string;
}

export interface DnsQuestion {
  name: string;
  type: number;
  typeName?: string;
}

export interface DnsResponse {
  Status: number; // 0 = NOERROR, 2 = SERVFAIL, 3 = NXDOMAIN, etc.
  TC: boolean; // Truncated
  RD: boolean; // Recursion Desired
  RA: boolean; // Recursion Available
  AD: boolean; // Authentic Data (DNSSEC)
  CD: boolean; // Checking Disabled
  Question?: DnsQuestion[];
  Answer?: DnsAnswer[];
  Authority?: DnsAnswer[];
  Additional?: DnsAnswer[];
  Comment?: string;
}

export interface DnsQueryResult {
  resolver: string;
  domain: string;
  recordType: DnsRecordType;
  durationMs: number;
  status: "success" | "error";
  statusCode: number;
  statusText: string;
  answers: DnsAnswer[];
  raw?: DnsResponse;
  dnssecValidated?: boolean;
  errorMessage?: string;
  timestamp: number;
}
