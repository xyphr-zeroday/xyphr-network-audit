import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Shield, ShieldAlert, ShieldCheck, Wifi, WifiOff,
  Cpu, Globe, Search, Download, RefreshCw, ChevronDown,
  ChevronUp, AlertTriangle, Info, XCircle, CheckCircle,
  Activity, Terminal, Clock, Zap, Server, Smartphone,
  Printer, Camera, Tv, Router, HelpCircle, Trash2, X
} from 'lucide-react'
import { RadialBarChart, RadialBar, PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts'

/* ─── STYLES ─────────────────────────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Syne:wght@400;600;700;800&display=swap');

  :root {
    --bg: #080c14;
    --surface: #0d1424;
    --surface2: #111827;
    --border: #1e2d45;
    --border2: #243550;
    --text: #e2e8f0;
    --muted: #64748b;
    --accent: #3b82f6;
    --accent2: #6366f1;
    --green: #10b981;
    --yellow: #f59e0b;
    --orange: #f97316;
    --red: #ef4444;
    --cyan: #06b6d4;
    --purple: #8b5cf6;
    --mono: 'JetBrains Mono', monospace;
    --sans: 'Syne', system-ui, sans-serif;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--sans);
    min-height: 100vh;
    overflow-x: hidden;
  }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--surface); }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 3px; }

  .app {
    display: grid;
    grid-template-columns: 240px 1fr;
    min-height: 100vh;
  }

  /* ── Sidebar ── */
  .sidebar {
    background: var(--surface);
    border-right: 1px solid var(--border);
    padding: 1.5rem 1rem;
    position: sticky;
    top: 0;
    height: 100vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .sidebar-logo {
    font-family: var(--sans);
    font-weight: 800;
    font-size: 1.2rem;
    color: var(--accent);
    letter-spacing: -0.03em;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .sidebar-logo span { color: var(--text); }
  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 0.75rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--muted);
    transition: all 0.15s;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
  }
  .nav-item:hover { color: var(--text); background: var(--surface2); }
  .nav-item.active { color: var(--accent); background: rgba(59,130,246,0.12); }
  .nav-section {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--muted);
    text-transform: uppercase;
    padding: 1rem 0.75rem 0.4rem;
  }
  .sidebar-bottom {
    margin-top: auto;
    padding-top: 1rem;
    border-top: 1px solid var(--border);
    font-size: 0.75rem;
    color: var(--muted);
  }

  /* ── Main ── */
  .main { overflow-y: auto; }
  .page { padding: 2rem; max-width: 1200px; }

  /* ── Header ── */
  .page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 2rem;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .page-title { font-size: 1.75rem; font-weight: 800; letter-spacing: -0.03em; }
  .page-sub { color: var(--muted); font-size: 0.875rem; margin-top: 0.25rem; font-family: var(--mono); }

  /* ── Cards ── */
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.25rem;
  }
  .card-title {
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted);
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  /* ── Grid ── */
  .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
  .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
  @media (max-width: 900px) { .grid-4, .grid-3 { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 600px) { .grid-4, .grid-3, .grid-2 { grid-template-columns: 1fr; } }

  /* ── Stat Card ── */
  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.25rem;
    position: relative;
    overflow: hidden;
  }
  .stat-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: var(--accent-color, var(--accent));
  }
  .stat-label { font-size: 0.75rem; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
  .stat-value { font-size: 2.25rem; font-weight: 800; line-height: 1.1; margin: 0.4rem 0; font-family: var(--mono); }
  .stat-icon { position: absolute; top: 1rem; right: 1rem; opacity: 0.15; }

  /* ── Score Ring ── */
  .score-ring-container {
    display: flex;
    align-items: center;
    gap: 2rem;
    padding: 1.5rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    margin-bottom: 1.5rem;
  }
  .score-label-big { font-size: 2rem; font-weight: 800; }
  .score-sub { color: var(--muted); font-size: 0.85rem; margin-top: 0.25rem; }
  .score-meta { display: flex; gap: 1.5rem; margin-top: 0.75rem; flex-wrap: wrap; }
  .score-meta-item { font-size: 0.8rem; color: var(--muted); }
  .score-meta-item strong { color: var(--text); }

  /* ── Buttons ── */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1.25rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 700;
    cursor: pointer;
    border: none;
    transition: all 0.15s;
    font-family: var(--sans);
    letter-spacing: 0.02em;
  }
  .btn-primary { background: var(--accent); color: white; }
  .btn-primary:hover { background: #2563eb; transform: translateY(-1px); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .btn-danger { background: rgba(239,68,68,0.15); color: var(--red); border: 1px solid rgba(239,68,68,0.3); }
  .btn-danger:hover { background: rgba(239,68,68,0.25); }
  .btn-ghost { background: var(--surface2); color: var(--text); border: 1px solid var(--border); }
  .btn-ghost:hover { border-color: var(--border2); background: var(--border); }
  .btn-sm { padding: 0.35rem 0.75rem; font-size: 0.8rem; }

  /* ── Badge ── */
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 0.2rem 0.6rem;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .badge-critical { background: rgba(239,68,68,0.15); color: var(--red); }
  .badge-high { background: rgba(249,115,22,0.15); color: var(--orange); }
  .badge-medium { background: rgba(245,158,11,0.15); color: var(--yellow); }
  .badge-low { background: rgba(59,130,246,0.15); color: var(--accent); }
  .badge-info { background: rgba(100,116,139,0.15); color: var(--muted); }
  .badge-ok { background: rgba(16,185,129,0.15); color: var(--green); }

  /* ── Table ── */
  .data-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  .data-table th {
    text-align: left;
    padding: 0.6rem 0.75rem;
    border-bottom: 1px solid var(--border);
    color: var(--muted);
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .data-table td { padding: 0.75rem; border-bottom: 1px solid rgba(30,45,69,0.5); }
  .data-table tr:hover td { background: rgba(255,255,255,0.02); }
  .data-table tr:last-child td { border-bottom: none; }

  /* ── Finding Card ── */
  .finding-card {
    border: 1px solid var(--border);
    border-left: 3px solid;
    border-radius: 8px;
    padding: 1rem 1.25rem;
    margin-bottom: 0.75rem;
    background: var(--surface);
    cursor: pointer;
    transition: all 0.15s;
  }
  .finding-card:hover { border-color: var(--border2); background: var(--surface2); }
  .finding-card.critical { border-left-color: var(--red); }
  .finding-card.high { border-left-color: var(--orange); }
  .finding-card.medium { border-left-color: var(--yellow); }
  .finding-card.low { border-left-color: var(--accent); }
  .finding-card.info { border-left-color: var(--muted); }
  .finding-title { font-weight: 700; font-size: 0.9rem; margin-bottom: 0.25rem; }
  .finding-desc { font-size: 0.825rem; color: var(--muted); line-height: 1.5; }
  .finding-rec {
    margin-top: 0.75rem;
    padding: 0.5rem 0.75rem;
    background: rgba(16,185,129,0.08);
    border: 1px solid rgba(16,185,129,0.2);
    border-radius: 6px;
    font-size: 0.8rem;
    color: var(--green);
    line-height: 1.5;
  }

  /* ── Progress ── */
  .progress-bar {
    height: 4px;
    background: var(--border);
    border-radius: 2px;
    overflow: hidden;
    margin: 0.5rem 0;
  }
  .progress-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 2px;
    transition: width 0.3s;
  }

  /* ── Scan Status ── */
  .scan-status {
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.5rem;
    background: var(--surface);
    margin-bottom: 1.5rem;
  }
  .scan-phase {
    font-family: var(--mono);
    font-size: 0.8rem;
    color: var(--cyan);
    margin-bottom: 0.5rem;
  }
  .scan-message { color: var(--muted); font-size: 0.875rem; }

  /* ── Device type icons ── */
  .device-icon { font-size: 1.25rem; }

  /* ── Port list ── */
  .port-chip {
    display: inline-flex;
    align-items: center;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 0.15rem 0.4rem;
    font-family: var(--mono);
    font-size: 0.75rem;
    margin: 0.1rem;
  }
  .port-chip.risky { border-color: rgba(239,68,68,0.4); color: var(--red); background: rgba(239,68,68,0.07); }
  .port-chip.warn { border-color: rgba(245,158,11,0.4); color: var(--yellow); background: rgba(245,158,11,0.07); }

  /* ── Log ── */
  .scan-log {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1rem;
    font-family: var(--mono);
    font-size: 0.78rem;
    max-height: 220px;
    overflow-y: auto;
    line-height: 1.7;
  }
  .log-line { display: block; }
  .log-info { color: var(--muted); }
  .log-ok { color: var(--green); }
  .log-warn { color: var(--yellow); }
  .log-err { color: var(--red); }
  .log-data { color: var(--cyan); }

  /* ── Pulse animation ── */
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
  .pulse { animation: pulse 1.5s infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .spin { animation: spin 1s linear infinite; display: inline-block; }

  /* ── Tooltip ── */
  .tip { position: relative; cursor: help; }
  .tip:hover::after {
    content: attr(data-tip);
    position: absolute;
    bottom: calc(100% + 4px);
    left: 50%;
    transform: translateX(-50%);
    background: var(--surface2);
    border: 1px solid var(--border2);
    color: var(--text);
    font-size: 0.75rem;
    padding: 0.4rem 0.6rem;
    border-radius: 6px;
    white-space: nowrap;
    z-index: 100;
    pointer-events: none;
  }

  /* ── DNS result ── */
  .dns-result {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.85rem 1rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    margin-bottom: 0.5rem;
    background: var(--surface);
  }
  .dns-result.pass { border-left: 3px solid var(--green); }
  .dns-result.fail { border-left: 3px solid var(--red); }

  /* ── Input ── */
  .input {
    background: var(--surface2);
    border: 1px solid var(--border2);
    border-radius: 8px;
    color: var(--text);
    font-family: var(--mono);
    font-size: 0.875rem;
    padding: 0.6rem 0.85rem;
    outline: none;
    width: 100%;
    transition: border-color 0.15s;
  }
  .input:focus { border-color: var(--accent); }
  .input::placeholder { color: var(--muted); }

  /* ── Toggle ── */
  .toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.6rem 0;
  }
  .toggle-label { font-size: 0.875rem; font-weight: 600; }
  .toggle-sub { font-size: 0.78rem; color: var(--muted); margin-top: 0.1rem; }
  .toggle {
    position: relative;
    width: 40px; height: 22px;
    background: var(--border2);
    border-radius: 11px;
    cursor: pointer;
    transition: background 0.2s;
    flex-shrink: 0;
  }
  .toggle.on { background: var(--accent); }
  .toggle::after {
    content: '';
    position: absolute;
    top: 3px; left: 3px;
    width: 16px; height: 16px;
    background: white;
    border-radius: 50%;
    transition: transform 0.2s;
  }
  .toggle.on::after { transform: translateX(18px); }

  /* ── Empty state ── */
  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: var(--muted);
  }
  .empty-state svg { margin: 0 auto 1rem; opacity: 0.3; }
  .empty-state h3 { font-size: 1.1rem; color: var(--text); margin-bottom: 0.5rem; }

  /* ── Scrollbar for log ── */
  .scan-log::-webkit-scrollbar { width: 4px; }
  .scan-log::-webkit-scrollbar-thumb { background: var(--border2); }
`

/* ─── CONSTANTS ─────────────────────────────────────────────────────────── */
const DEVICE_ICONS = {
  router: '🌐', switch: '🔀', access_point: '📡',
  computer: '💻', phone: '📱', tablet: '📱',
  smart_tv: '📺', camera: '📷', iot: '🏠',
  printer: '🖨️', game_console: '🎮', unknown: '❓',
}

const RISK_ORDER = ['critical', 'high', 'medium', 'low', 'info']

const scoreColor = (score) => {
  if (score >= 85) return '#10b981'
  if (score >= 65) return '#f59e0b'
  if (score >= 40) return '#f97316'
  return '#ef4444'
}

const scoreLabel = (score) => {
  if (score >= 85) return 'SECURE'
  if (score >= 65) return 'MODERATE RISK'
  if (score >= 40) return 'HIGH RISK'
  return 'CRITICAL RISK'
}

const API = 'http://localhost:5000/api'

/* ─── API HELPERS ────────────────────────────────────────────────────────── */
async function apiFetch(path, opts = {}) {
  try {
    const res = await fetch(`${API}${path}`, opts)
    return await res.json()
  } catch {
    return null
  }
}

/* ─── MOCK DATA (for demo when server not running) ──────────────────────── */
const MOCK_SCAN = {
  scan_id: 'demo-scan-001',
  status: 'complete',
  timestamp: new Date().toISOString(),
  duration_seconds: 47.2,
  security_score: 62,
  network: {
    local_ip: '192.168.1.105',
    subnet: '192.168.1.0/24',
    gateway: '192.168.1.1',
    public_ip: '203.0.113.42',
    isp: 'AS15169 Google LLC',
    dns_servers: ['8.8.8.8', '8.8.4.4'],
  },
  devices: [
    { ip: '192.168.1.1', mac: 'a4:c3:f0:12:34:56', hostname: 'router.local', vendor: 'TP-Link', device_type: 'router', is_gateway: true, risk_score: 35,
      ports: [{ number: 80, protocol: 'tcp', state: 'open', service: 'http', version: '', risk: 'medium' }, { number: 443, protocol: 'tcp', state: 'open', service: 'https', version: '', risk: 'info' }], vulnerabilities: [] },
    { ip: '192.168.1.105', mac: 'b8:27:eb:ab:cd:ef', hostname: 'macbook.local', vendor: 'Apple', device_type: 'computer', is_gateway: false, risk_score: 10,
      ports: [], vulnerabilities: [] },
    { ip: '192.168.1.110', mac: '00:17:88:11:22:33', hostname: 'Philips-Hue', vendor: 'Philips', device_type: 'iot', is_gateway: false, risk_score: 45,
      ports: [{ number: 80, protocol: 'tcp', state: 'open', service: 'http', version: 'nginx', risk: 'medium' }], vulnerabilities: [] },
    { ip: '192.168.1.115', mac: 'dc:a6:32:44:55:66', hostname: 'raspberrypi', vendor: 'Raspberry Pi', device_type: 'iot', is_gateway: false, risk_score: 60,
      ports: [{ number: 22, protocol: 'tcp', state: 'open', service: 'ssh', version: 'OpenSSH 8.9', risk: 'info' }, { number: 23, protocol: 'tcp', state: 'open', service: 'telnet', version: '', risk: 'critical' }, { number: 3306, protocol: 'tcp', state: 'open', service: 'mysql', version: 'MySQL 8.0', risk: 'high' }], vulnerabilities: [] },
    { ip: '192.168.1.120', mac: 'ac:87:a3:77:88:99', hostname: 'iPhone', vendor: 'Apple', device_type: 'phone', is_gateway: false, risk_score: 5,
      ports: [], vulnerabilities: [] },
    { ip: '192.168.1.130', mac: '00:11:32:aa:bb:cc', hostname: 'NAS-Storage', vendor: 'Synology', device_type: 'unknown', is_gateway: false, risk_score: 25,
      ports: [{ number: 5000, protocol: 'tcp', state: 'open', service: 'http', version: 'DSM 7.2', risk: 'low' }, { number: 445, protocol: 'tcp', state: 'open', service: 'smb', version: '', risk: 'high' }], vulnerabilities: [] },
  ],
  findings: [
    { id: 'TELNET-001', category: 'Insecure Protocols', title: 'Telnet enabled on 192.168.1.115', description: 'Telnet transmits all data including passwords in plaintext. Any attacker on the network can capture credentials.', risk: 'critical', recommendation: 'Disable Telnet immediately. Use SSH for remote administration.', affected_devices: ['192.168.1.115'] },
    { id: 'DB-EXPOSED-001', category: 'Database Security', title: 'MySQL database exposed on 192.168.1.115', description: 'MySQL is listening on the network on port 3306. Many database servers ship with no authentication by default.', risk: 'high', recommendation: 'Bind MySQL to localhost (127.0.0.1) only. Never expose database ports to the local network.', affected_devices: ['192.168.1.115'] },
    { id: 'SMB-EXPOSED', category: 'File Sharing', title: 'SMB file sharing exposed on NAS', description: 'SMB (Windows File Sharing) is exposed. This was the vector for WannaCry ransomware. Ensure SMBv1 is disabled.', risk: 'high', recommendation: 'Disable SMBv1. Block SMB ports at the router firewall. Ensure systems are patched.', affected_devices: ['192.168.1.130'] },
    { id: 'HTTP-ADMIN', category: 'Encryption', title: 'Unencrypted HTTP interfaces detected', description: 'HTTP interfaces transmit data without encryption. Credentials can be intercepted.', risk: 'medium', recommendation: 'Switch to HTTPS for all web interfaces. Disable HTTP-only access on your router.', affected_devices: ['192.168.1.1', '192.168.1.110'] },
    { id: 'IOT-PRESENT', category: 'IoT Security', title: '2 IoT devices detected on main network', description: 'IoT devices often have poor security and are common botnet targets. They should be isolated.', risk: 'medium', recommendation: 'Place IoT devices on a separate VLAN or guest network. Change default credentials.', affected_devices: ['192.168.1.110', '192.168.1.115'] },
  ],
  dns_results: [
    { test_name: 'DNS Leak Test', passed: true, details: 'DNS servers in use: 8.8.8.8, 8.8.4.4. All appear to be known public servers.', servers_used: ['8.8.8.8', '8.8.4.4'], leak_detected: false },
    { test_name: 'DNS Hijacking Test', passed: true, details: 'No NXDOMAIN hijacking detected. Non-existent domains correctly fail to resolve.', servers_used: ['8.8.8.8'], leak_detected: false },
    { test_name: 'DNS Rebinding Test', passed: true, details: 'No obvious DNS rebinding vulnerability detected.', servers_used: ['8.8.8.8'] },
    { test_name: 'DNSSEC Validation', passed: false, details: 'DNSSEC validation may not be enabled on your current DNS resolver.', servers_used: ['8.8.8.8'], leak_detected: false },
  ],
}

/* ─── COMPONENTS ─────────────────────────────────────────────────────────── */

function Toggle({ on, onToggle }) {
  return <div className={`toggle ${on ? 'on' : ''}`} onClick={onToggle} />
}

function Badge({ risk }) {
  return <span className={`badge badge-${risk}`}>{risk}</span>
}

function ScoreRing({ score }) {
  const color = scoreColor(score)
  const label = scoreLabel(score)
  const data = [{ value: score, fill: color }, { value: 100 - score, fill: '#1e2d45' }]

  return (
    <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={42} outerRadius={54} startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
            {data.map((_, i) => <Cell key={i} fill={data[i].fill} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <span style={{ fontFamily: 'var(--mono)', fontWeight: 800, fontSize: '1.4rem', color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: '0.6rem', color: 'var(--muted)', fontWeight: 700 }}>/ 100</span>
      </div>
    </div>
  )
}

function FindingCard({ finding }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className={`finding-card ${finding.risk}`} onClick={() => setExpanded(e => !e)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Badge risk={finding.risk} />
            <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 600 }}>{finding.category}</span>
          </div>
          <div className="finding-title">{finding.title}</div>
        </div>
        <span style={{ color: 'var(--muted)', flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && (
        <div style={{ marginTop: '0.75rem' }}>
          <p className="finding-desc">{finding.description}</p>
          {finding.affected_devices?.length > 0 && (
            <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
              Affected: {finding.affected_devices.map(ip => (
                <code key={ip} style={{ background: 'var(--surface2)', padding: '0.1rem 0.3rem', borderRadius: '3px', marginRight: '0.25rem', fontSize: '0.75rem' }}>{ip}</code>
              ))}
            </p>
          )}
          <div className="finding-rec">💡 {finding.recommendation}</div>
        </div>
      )}
    </div>
  )
}

function DeviceRow({ device }) {
  const [expanded, setExpanded] = useState(false)
  const openPorts = device.ports?.filter(p => p.state === 'open') || []
  const icon = DEVICE_ICONS[device.device_type] || '❓'
  const riskColor = device.risk_score > 60 ? 'var(--red)' : device.risk_score > 30 ? 'var(--yellow)' : 'var(--green)'

  return (
    <>
      <tr style={{ cursor: 'pointer' }} onClick={() => setExpanded(e => !e)}>
        <td>
          <span style={{ marginRight: '0.4rem' }}>{icon}</span>
          <code style={{ fontFamily: 'var(--mono)', fontSize: '0.82rem' }}>{device.ip}</code>
          {device.is_gateway && <span className="badge badge-ok" style={{ marginLeft: '0.4rem', fontSize: '0.62rem' }}>Gateway</span>}
        </td>
        <td style={{ color: 'var(--muted)' }}>{device.hostname || '—'}</td>
        <td style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{device.vendor || 'unknown'}</td>
        <td>
          {openPorts.slice(0, 5).map(p => (
            <span key={p.number} className={`port-chip ${p.risk === 'critical' || p.risk === 'high' ? 'risky' : p.risk === 'medium' ? 'warn' : ''}`}>
              {p.number}
            </span>
          ))}
          {openPorts.length > 5 && <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}> +{openPorts.length - 5}</span>}
          {openPorts.length === 0 && <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>none</span>}
        </td>
        <td>
          <span style={{ color: riskColor, fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '0.9rem' }}>{device.risk_score}</span>
          <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>/100</span>
        </td>
        <td style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{expanded ? '▲' : '▼'}</td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} style={{ background: 'var(--bg)', padding: '1rem 1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 700, marginBottom: '0.4rem', textTransform: 'uppercase' }}>Info</div>
                <div style={{ fontSize: '0.82rem', lineHeight: 2 }}>
                  <div>MAC: <code style={{ color: 'var(--cyan)' }}>{device.mac || '—'}</code></div>
                  <div>OS Guess: {device.os_guess || 'unknown'}</div>
                  <div>Type: {device.device_type?.replace('_', ' ')}</div>
                </div>
              </div>
              {openPorts.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 700, marginBottom: '0.4rem', textTransform: 'uppercase' }}>Open Ports</div>
                  {openPorts.map(p => (
                    <div key={p.number} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                      <Badge risk={p.risk} />
                      <code>{p.number}/{p.protocol}</code>
                      <span style={{ color: 'var(--muted)' }}>{p.service} {p.version}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

/* ─── PAGES ──────────────────────────────────────────────────────────────── */

function DashboardPage({ scan }) {
  if (!scan) {
    return (
      <div className="empty-state">
        <Shield size={64} />
        <h3>No scan data yet</h3>
        <p>Run a scan to see your network security overview</p>
      </div>
    )
  }

  const critical = scan.findings?.filter(f => f.risk === 'critical').length || 0
  const high = scan.findings?.filter(f => f.risk === 'high').length || 0
  const medium = scan.findings?.filter(f => f.risk === 'medium').length || 0
  const openPorts = scan.devices?.reduce((acc, d) => acc + (d.ports?.filter(p => p.state === 'open').length || 0), 0) || 0

  const riskData = [
    { name: 'Critical', value: critical, fill: '#ef4444' },
    { name: 'High', value: high, fill: '#f97316' },
    { name: 'Medium', value: medium, fill: '#f59e0b' },
  ].filter(d => d.value > 0)

  return (
    <div>
      {/* Score */}
      <div className="score-ring-container">
        <ScoreRing score={scan.security_score} />
        <div>
          <div className="score-label-big" style={{ color: scoreColor(scan.security_score) }}>
            {scoreLabel(scan.security_score)}
          </div>
          <div className="score-sub">Network Security Score: {scan.security_score}/100</div>
          <div className="score-meta">
            <div className="score-meta-item">Subnet: <strong>{scan.network?.subnet}</strong></div>
            <div className="score-meta-item">Gateway: <strong>{scan.network?.gateway}</strong></div>
            <div className="score-meta-item">ISP: <strong>{scan.network?.isp?.split(' ').slice(1).join(' ') || '—'}</strong></div>
            <div className="score-meta-item">Scan time: <strong>{scan.duration_seconds}s</strong></div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4">
        {[
          { label: 'Devices Found', value: scan.devices?.length, color: '#3b82f6', icon: '💻' },
          { label: 'Critical Issues', value: critical, color: '#ef4444', icon: '🚨' },
          { label: 'High Risk', value: high, color: '#f97316', icon: '⚠️' },
          { label: 'Open Ports', value: openPorts, color: '#f59e0b', icon: '🔓' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ '--accent-color': s.color }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-icon" style={{ fontSize: '2.5rem' }}>{s.icon}</div>
          </div>
        ))}
      </div>

      {/* Findings + chart */}
      <div className="grid-2">
        <div className="card">
          <div className="card-title"><AlertTriangle size={14} /> Top Findings</div>
          {scan.findings?.slice(0, 4).map(f => (
            <FindingCard key={f.id} finding={f} />
          ))}
          {!scan.findings?.length && <p style={{ color: 'var(--green)', fontSize: '0.875rem' }}>✅ No significant findings</p>}
        </div>
        <div>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="card-title"><Activity size={14} /> Risk Distribution</div>
            {riskData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={riskData} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0d1424', border: '1px solid #1e2d45', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {riskData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: 'var(--green)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>✅ No risks found</p>
            )}
          </div>
          <div className="card">
            <div className="card-title"><Globe size={14} /> Network Info</div>
            {[
              ['Local IP', scan.network?.local_ip],
              ['Public IP', scan.network?.public_ip],
              ['DNS Servers', scan.network?.dns_servers?.join(', ')],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '0.35rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>{k}</span>
                <code style={{ color: 'var(--cyan)', fontSize: '0.8rem' }}>{v || '—'}</code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function DevicesPage({ scan }) {
  const [filter, setFilter] = useState('')
  const devices = scan?.devices?.filter(d =>
    !filter || d.ip.includes(filter) || d.hostname?.includes(filter) || d.vendor?.includes(filter)
  ) || []

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <input className="input" placeholder="Filter by IP, hostname, or vendor..." value={filter} onChange={e => setFilter(e.target.value)} style={{ maxWidth: '360px' }} />
      </div>
      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>IP / Type</th>
              <th>Hostname</th>
              <th>Vendor</th>
              <th>Open Ports</th>
              <th>Risk</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {devices.length ? devices.map(d => <DeviceRow key={d.ip} device={d} />) : (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>No devices found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FindingsPage({ scan }) {
  const [filter, setFilter] = useState('all')
  const findings = scan?.findings?.filter(f => filter === 'all' || f.risk === filter) || []
  const sorted = [...findings].sort((a, b) => RISK_ORDER.indexOf(a.risk) - RISK_ORDER.indexOf(b.risk))

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {['all', 'critical', 'high', 'medium', 'low'].map(r => (
          <button key={r} className={`btn btn-sm ${filter === r ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(r)}>
            {r.charAt(0).toUpperCase() + r.slice(1)}
            {r !== 'all' && <span style={{ marginLeft: '0.25rem', opacity: 0.7 }}>({scan?.findings?.filter(f => f.risk === r).length || 0})</span>}
          </button>
        ))}
      </div>
      {sorted.length ? sorted.map(f => <FindingCard key={f.id} finding={f} />) : (
        <div className="empty-state">
          <CheckCircle size={48} />
          <h3>No findings{filter !== 'all' ? ` at ${filter} level` : ''}</h3>
          <p>{filter === 'all' ? 'Your network looks clean!' : 'Try a different filter'}</p>
        </div>
      )}
    </div>
  )
}

function DnsPage({ scan }) {
  const results = scan?.dns_results || []
  return (
    <div>
      {results.length === 0 && (
        <div className="empty-state">
          <Globe size={48} />
          <h3>No DNS tests run</h3>
          <p>Enable DNS tests in the scan settings</p>
        </div>
      )}
      {results.map((r, i) => (
        <div key={i} className={`dns-result ${r.passed ? 'pass' : 'fail'}`}>
          <div style={{ fontSize: '1.2rem', flexShrink: 0 }}>{r.passed ? '✅' : '❌'}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{r.test_name}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{r.details}</div>
            {r.servers_used?.length > 0 && (
              <div style={{ marginTop: '0.4rem', fontSize: '0.78rem' }}>
                Servers: {r.servers_used.map(s => <code key={s} style={{ background: 'var(--surface2)', padding: '0.1rem 0.3rem', borderRadius: 3, marginRight: '0.25rem' }}>{s}</code>)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function ScanPage({ onScanComplete }) {
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState('')
  const [message, setMessage] = useState('')
  const [logs, setLogs] = useState([])
  const [opts, setOpts] = useState({ full: false, dns: true, target: '' })
  const logRef = useRef(null)

  const addLog = useCallback((msg, type = 'info') => {
    setLogs(prev => [...prev.slice(-80), { msg, type, ts: new Date().toLocaleTimeString() }])
    setTimeout(() => logRef.current?.scrollTo(0, 99999), 50)
  }, [])

  const runDemoScan = useCallback(() => {
    setScanning(true)
    setProgress(0)
    setLogs([])
    addLog('Starting network scan...', 'info')

    const steps = [
      [5, 'network_info', 'Gathering network information...', 'ok'],
      [15, 'discovery', 'ARP scanning 192.168.1.0/24...', 'info'],
      [40, 'discovery', 'Found 6 devices on network', 'ok'],
      [55, 'port_scan', 'Port scanning 192.168.1.1...', 'info'],
      [65, 'port_scan', 'Port scanning 192.168.1.115...', 'warn'],
      [75, 'port_scan', 'Found risky open ports: 23 (telnet), 3306 (mysql)', 'warn'],
      [82, 'dns', 'Running DNS security tests...', 'info'],
      [90, 'analysis', 'Analyzing security findings...', 'info'],
      [100, 'complete', 'Scan complete! Score: 62/100', 'ok'],
    ]

    let i = 0
    const interval = setInterval(() => {
      if (i < steps.length) {
        const [pct, ph, msg, type] = steps[i]
        setProgress(pct)
        setPhase(ph)
        setMessage(msg)
        addLog(msg, type)
        i++
      } else {
        clearInterval(interval)
        setScanning(false)
        onScanComplete(MOCK_SCAN)
      }
    }, 600)
  }, [addLog, onScanComplete])

  return (
    <div>
      {/* Options */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-title"><Zap size={14} /> Scan Options</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '0.4rem' }}>Target Subnet</label>
            <input className="input" placeholder="Auto-detect (e.g. 192.168.1.0/24)" value={opts.target} onChange={e => setOpts(o => ({ ...o, target: e.target.value }))} />
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
          {[
            { key: 'full', label: 'Full Port Scan', sub: 'Scan ports on every discovered device (slower, requires sudo)' },
            { key: 'dns', label: 'DNS Security Tests', sub: 'Test for DNS leaks, hijacking, and DNSSEC' },
          ].map(opt => (
            <div key={opt.key} className="toggle-row">
              <div>
                <div className="toggle-label">{opt.label}</div>
                <div className="toggle-sub">{opt.sub}</div>
              </div>
              <Toggle on={opts[opt.key]} onToggle={() => setOpts(o => ({ ...o, [opt.key]: !o[opt.key] }))} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <button className="btn btn-primary" onClick={runDemoScan} disabled={scanning}>
          {scanning ? <><span className="spin"><RefreshCw size={14} /></span> Scanning...</> : <><Search size={14} /> Start Scan</>}
        </button>
        {scanning && (
          <button className="btn btn-danger" onClick={() => setScanning(false)}>
            <X size={14} /> Cancel
          </button>
        )}
      </div>

      {/* Progress */}
      {(scanning || logs.length > 0) && (
        <div className="scan-status">
          {scanning && (
            <>
              <div className="scan-phase">● {phase.replace('_', ' ').toUpperCase()}</div>
              <div className="scan-message">{message}</div>
              <div className="progress-bar" style={{ marginTop: '0.75rem' }}>
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>{progress}%</div>
            </>
          )}
          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.4rem', fontWeight: 700, textTransform: 'uppercase' }}>Scan Log</div>
            <div className="scan-log" ref={logRef}>
              {logs.map((l, i) => (
                <span key={i} className={`log-line log-${l.type}`}>
                  <span style={{ color: 'var(--muted)', marginRight: '0.5rem' }}>{l.ts}</span>
                  {l.msg}{'\n'}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CLI equivalent */}
      <div className="card">
        <div className="card-title"><Terminal size={14} /> CLI Equivalent</div>
        <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '0.85rem', fontFamily: 'var(--mono)', fontSize: '0.8rem', color: 'var(--cyan)' }}>
          <span style={{ color: 'var(--muted)' }}>$ </span>
          sudo python cli/netaudit.py audit
          {opts.full ? ' --full' : ''}
          {opts.target ? ` --target ${opts.target}` : ''}
          {' --export report.html'}
        </div>
      </div>
    </div>
  )
}

/* ─── MAIN APP ───────────────────────────────────────────────────────────── */

export default function App() {
  const [page, setPage] = useState('scan')
  const [scan, setScan] = useState(null)
  const [serverConnected, setServerConnected] = useState(false)

  // Try connecting to real backend
  useEffect(() => {
    apiFetch('/status').then(data => {
      if (data?.status === 'ok') setServerConnected(true)
    })
  }, [])

  const nav = [
    { id: 'scan', label: 'New Scan', icon: <Search size={16} /> },
    { id: 'dashboard', label: 'Dashboard', icon: <Activity size={16} /> },
    { id: 'devices', label: 'Devices', icon: <Cpu size={16} /> },
    { id: 'findings', label: 'Findings', icon: <AlertTriangle size={16} /> },
    { id: 'dns', label: 'DNS Tests', icon: <Globe size={16} /> },
  ]

  const pages = {
    scan: <ScanPage onScanComplete={data => { setScan(data); setPage('dashboard') }} />,
    dashboard: <DashboardPage scan={scan} />,
    devices: <DevicesPage scan={scan} />,
    findings: <FindingsPage scan={scan} />,
    dns: <DnsPage scan={scan} />,
  }

  const titles = {
    scan: { t: 'New Scan', s: 'Configure and run a network audit' },
    dashboard: { t: 'Dashboard', s: scan ? `Last scan: ${new Date(scan.timestamp).toLocaleString()}` : 'No scan yet' },
    devices: { t: 'Devices', s: `${scan?.devices?.length || 0} devices discovered` },
    findings: { t: 'Security Findings', s: `${scan?.findings?.length || 0} issues found` },
    dns: { t: 'DNS Security', s: `${scan?.dns_results?.length || 0} tests run` },
  }

  const { t, s } = titles[page]

  return (
    <>
      <style>{css}</style>
      <div className="app">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            🔍 <span>Net<span style={{ color: 'var(--accent)' }}>Audit</span></span>
          </div>

          <div className="nav-section">Navigation</div>
          {nav.map(n => (
            <button key={n.id} className={`nav-item ${page === n.id ? 'active' : ''}`} onClick={() => setPage(n.id)}>
              {n.icon} {n.label}
              {n.id === 'findings' && scan?.findings?.length > 0 && (
                <span style={{ marginLeft: 'auto', background: 'var(--red)', color: 'white', borderRadius: '10px', padding: '0.1rem 0.4rem', fontSize: '0.7rem', fontWeight: 800 }}>
                  {scan.findings.filter(f => f.risk === 'critical' || f.risk === 'high').length}
                </span>
              )}
            </button>
          ))}

          {scan && (
            <>
              <div className="nav-section">Last Scan</div>
              <div style={{ padding: '0 0.75rem' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.8 }}>
                  <div>Score: <strong style={{ color: scoreColor(scan.security_score) }}>{scan.security_score}/100</strong></div>
                  <div>Devices: <strong>{scan.devices?.length}</strong></div>
                  <div>Issues: <strong style={{ color: scan.findings?.filter(f => f.risk === 'critical').length > 0 ? 'var(--red)' : 'var(--green)' }}>{scan.findings?.length}</strong></div>
                </div>
              </div>
              <div style={{ padding: '0.5rem 0.75rem' }}>
                <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(scan, null, 2)], { type: 'application/json' })
                    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
                    a.download = `netaudit-${scan.scan_id?.slice(0, 8)}.json`; a.click()
                  }}>
                  <Download size={13} /> Export JSON
                </button>
              </div>
            </>
          )}

          <div className="sidebar-bottom">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: serverConnected ? 'var(--green)' : 'var(--muted)', display: 'inline-block' }} />
              <span>{serverConnected ? 'Server connected' : 'Demo mode'}</span>
            </div>
            <div>v1.0.0 · MIT License</div>
          </div>
        </aside>

        {/* Main */}
        <main className="main">
          <div className="page">
            <div className="page-header">
              <div>
                <div className="page-title">{t}</div>
                <div className="page-sub">{s}</div>
              </div>
              {page !== 'scan' && !scan && (
                <button className="btn btn-primary" onClick={() => setPage('scan')}>
                  <Search size={14} /> Run First Scan
                </button>
              )}
            </div>
            {pages[page]}
          </div>
        </main>
      </div>
    </>
  )
}
