# NetRadar — Professional Network Diagnostics PWA

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-NOC_Dark-teal?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-iOS_Safari_Ready-4DE0C1?style=flat-square)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**NetRadar** is a production-grade Progressive Web App (PWA) designed for network administrators, IT technicians, system engineers, and security analysts. Inspired by cyber operations centers (NOC), NetRadar delivers genuine network telemetry, accurate latency calculations, DNS-over-HTTPS resolution, and persistent local history without relying on simulated or fabricated data.

---

## 1. Architectural Philosophy & Diagnostic Integrity

Unlike consumer speed-test tools or mock dashboards, NetRadar strictly distinguishes between what web browsers can authentically measure and what low-level operating system kernels restrict:

* **Zero Simulation Guarantee**: NetRadar never invents ping times, never fabricates speedometers, and never fakes traceroute hops. When a parameter cannot be measured due to browser security boundaries, it is labeled **"Unavailable"** or **"Restricted"** with an educational architectural explanation.
* **Advisory Connectivity Status**: The browser's `navigator.onLine` API indicates only the local interface state. NetRadar explicitly warns that this advisory hint does not guarantee external gateway reachability or WAN packet transit.
* **CORS & Opaque Isolation Transparency**: When cross-origin servers do not emit permissive CORS headers, the browser's security sandbox conceals response headers. NetRadar measures genuine Layer-7 round-trip duration with `performance.now()` while explaining CORS isolation transparently.
* **RFC-Compliant DNS**: Raw UDP port 53 sockets are structurally forbidden in browser JavaScript. NetRadar queries standard DNS-over-HTTPS (DoH via RFC 8427 / DNS-JSON) against Cloudflare (1.1.1.1), Google (8.8.8.8), or Quad9 (9.9.9.9), reporting authentic resource records, TTLs, and DNSSEC flags.
* **Local Vault Privacy**: All diagnostic results are persisted strictly on your client device in IndexedDB. No telemetry logs, targets, or credentials are ever transmitted to an external server.

---

## 2. Core Capabilities

### 📡 Overview Dashboard
* Real-time network interface telemetry and `navigator.connection` heuristics (Chromium/Android; cleanly identifies iOS WebKit restrictions).
* Instant **Quick Diagnostic Probe** executing concurrent HTTP latency and DNS DoH queries.
* Responsive **Response Latency Trend (ms)** graph rendered via Recharts directly from your local test history.
* Live PWA standalone mode and network status pill.

### 🌐 Diagnostics Suite
1. **HTTP / HTTPS Latency**:
   - URL/hostname validation and automatic normalization.
   - Microsecond precision round-trip measurement using `performance.now()`.
   - Distinguishes DNS/network errors, CORS opaque responses, mixed-content blocks, and timeout aborts.
2. **DNS-over-HTTPS (DoH)**:
   - Full support for `A`, `AAAA`, `CNAME`, `MX`, `NS`, `TXT`, `SOA`, `PTR`, and `SRV` records.
   - Displays resolver URL, authoritative answers, TTL countdowns, and DNSSEC authentic data (AD) verification.
3. **Controlled Throughput Measurement**:
   - Streams genuine non-compressible binary chunks via `/api/speed/download` and receives client streams at `/api/speed/upload`.
   - Live real-time Mbps transfer rate calculation and progress tracking.
4. **TCP Port Handshake Probe**:
   - Browser JavaScript cannot open raw TCP sockets (`new Socket()`). NetRadar provides genuine Layer-4 TCP SYN/ACK handshake measurements via a protected backend Node.js socket agent.
   - Built-in SSRF protection automatically blocks probes targeted at `localhost`, `127.0.0.1`, `::1`, and private RFC-1918 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
5. **Traceroute & ICMP Boundaries (Honesty View)**:
   - Educational breakdown detailing why ICMP Echo Request and IP TTL manipulation require raw kernel sockets (`CAP_NET_RAW` / `SOCK_RAW`) inaccessible within browser sandboxes and serverless microVMs.

### 📱 Network & Platform Information
* Egress public IP inspection and edge gateway headers (`cf-connecting-ip`, `x-real-ip`, Vercel edge region ID).
* WebRTC ICE candidate discovery with explanation of IETF mDNS UUID masking.
* Browser environment specs: Viewport geometry, screen scale, TLS secure context, Service Worker, and WebSockets.
* Native Mobile OS Sandbox boundary disclosures for iOS Safari (RSSI, BSSID, cellular dBm, carrier diagnostics).

### 💾 Local Telemetry Vault (IndexedDB)
* Persistent IndexedDB storage with in-memory fallback.
* Multi-field search, category filtering (`HTTP`, `DNS`, `Speed`, `TCP`), and sorting.
* Comprehensive detail modal showing raw JSON telemetry payloads.
* RFC 4180 compliant CSV export with automatic redaction of sensitive query tokens (`token`, `secret`, `key`, `password`).
* Per-item deletion and safe database purge with confirmation modal.

---

## 3. Technology Stack

* **Framework**: Next.js 14 (App Router)
* **Language**: TypeScript (Strict Mode)
* **Styling**: Tailwind CSS (Custom Dark NOC Navy `#0B1220`, Elevated Surface `#141F31`, Teal Accent `#4DE0C1`)
* **Icons**: Lucide Icons
* **Charts**: Recharts (Responsive SVG container)
* **Storage**: IndexedDB (`idb` promise wrapper with fallback)
* **Testing**: Vitest, React Testing Library, JSDOM, Fake-IndexedDB
* **PWA**: Web App Manifest (`standalone` mode), Service Worker (`sw.js`) with cache-busting diagnostics bypass and safe-area inset handling (`pb-safe`, `pt-safe`).

---

## 4. Linux Mint & Ubuntu Setup Instructions

To set up NetRadar on Linux Mint 21/22 or Ubuntu 22.04/24.04:

### Step 1: Install Node.js (v18+ or v20 LTS) & Git
```bash
# Update package lists
sudo apt update && sudo apt upgrade -y

# Install git and curl if not present
sudo apt install -y git curl

# Install Node.js 20.x via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify versions (Requires Node >= 18.17.0 and npm >= 9.0.0)
node -v
npm -v
```

### Step 2: Clone or Navigate to the Repository
```bash
cd /home/kerem/Desktop/proje
```

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 5. Testing & Verification

NetRadar includes comprehensive unit and component tests verifying URL validation, SSRF detection, HTTP timing calculations, DoH parsing, IndexedDB CRUD operations, and CSV sanitization:

```bash
# Run automated Vitest test suite
npm run test

# Run linter
npm run lint

# Run production build compilation check
npm run build
```

---

## 6. Git & GitHub Deployment

To push this project to your GitHub repository:

```bash
# Check git status
git status

# Add all files to staging
git add .

# Create initial commit
git commit -m "feat: complete NetRadar Network Diagnostics PWA"

# Add your GitHub remote repository (replace with your repo URL)
git remote add origin https://github.com/your-username/netradar.git

# Set main branch and push
git branch -M main
git push -u origin main
```

---

## 7. Vercel Deployment

NetRadar is fully optimized for one-click deployment on [Vercel](https://vercel.com):

### Option A: Via Vercel Web Dashboard
1. Go to [vercel.com](https://vercel.com) and log in.
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository (`netradar`).
4. Keep the default build settings:
   * **Framework Preset**: Next.js
   * **Root Directory**: `./`
   * **Build Command**: `npm run build`
   * **Output Directory**: `.next`
5. Click **Deploy**. Vercel will automatically deploy the application on a secure HTTPS edge domain.

### Option B: Via Vercel CLI
```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy directly from terminal
vercel --prod
```

### Serverless Limitations on Vercel
* Vercel Serverless Functions execute inside AWS Lambda microVMs.
* Inbound and outbound HTTP/HTTPS and outbound TCP to permitted ports (80, 443, 22, 53, 853) function seamlessly.
* ICMP packet creation (ping) and raw socket manipulation (traceroute) are dropped by the serverless virtualization hypervisor. NetRadar explains this honestly in the UI.

---

## 8. iPhone Safari Manual Verification Checklist

Follow this checklist to test and verify NetRadar on an iOS device (iPhone):

- [ ] **1. HTTPS Access**: Deploy to Vercel or test locally via an HTTPS tunnel (e.g. `mkcert` or `ngrok`). PWAs require HTTPS for Service Worker registration on iOS Safari.
- [ ] **2. Responsive Viewport**: Open the application in Safari. Confirm the dark NOC aesthetic (#0B1220), legible fonts, and responsive layout.
- [ ] **3. Safe Area Insets**: Verify that the top header does not collide with the iPhone Notch / Dynamic Island and the bottom navigation bar clears the iOS Home Indicator swipe bar (`env(safe-area-inset-bottom)`).
- [ ] **4. Add to Home Screen (Install)**:
  1. In Safari, tap the **Share** button (box with upward arrow) on the bottom toolbar.
  2. Scroll down and tap **Add to Home Screen**.
  3. Confirm the name **NetRadar** and the custom radar icon.
  4. Tap **Add** in the top-right corner.
- [ ] **5. Fullscreen Standalone Mode**:
  - Launch NetRadar from the iOS Home Screen.
  - Verify that Safari's URL address bar and bottom navigation toolbar are hidden (standalone PWA display mode).
  - Verify the **"PWA Mode"** badge appears in the header.
- [ ] **6. Offline Shell Verification**:
  - Enable iPhone **Airplane Mode**.
  - Refresh the PWA or navigate between tabs. Confirm the shell and local history remain accessible.
  - Confirm the **Offline Mode Banner** appears informing the user that live probes require connectivity.
  - Disable Airplane Mode; confirm automatic reconnection.
- [ ] **7. Quick Diagnostic Probe**:
  - Enter `cloudflare.com` and tap **Probe**.
  - Confirm HTTP response duration and DoH DNS answers render in milliseconds.
- [ ] **8. Local IndexedDB Persistence & CSV Export**:
  - Navigate to **History**.
  - Verify the completed test appears in the list.
  - Tap **Export CSV**; confirm iOS Safari prompts to download `netradar_telemetry_YYYY-MM-DD.csv`.
  - Open the CSV file and verify timestamps, durations, and metrics.

---

## 9. License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
