export interface NetworkInformationState {
  isOnline: boolean;
  effectiveType?: string; // '4g' | '3g' | '2g' | 'slow-2g'
  downlink?: number; // megabits per second estimate
  rtt?: number; // milliseconds estimate
  saveData?: boolean;
  type?: string; // 'wifi' | 'cellular' | 'ethernet' etc if exposed
  isNetworkInfoSupported: boolean;
}

export interface ClientIpInfo {
  ip: string;
  version: "IPv4" | "IPv6" | "Unknown";
  country?: string;
  city?: string;
  org?: string;
  timezone?: string;
  source: string;
}

export interface BrowserEnvironmentInfo {
  userAgent: string;
  platform: string;
  language: string;
  screenResolution: string;
  viewportSize: string;
  devicePixelRatio: number;
  cookieEnabled: boolean;
  serviceWorkerSupported: boolean;
  indexedDbSupported: boolean;
  webSocketSupported: boolean;
  webRtcSupported: boolean;
  isIos: boolean;
  isStandalonePwa: boolean;
  secureContext: boolean;
}
