# 🔍 NetAudit — Home Network Audit Tool

A comprehensive home network security and performance audit tool with both a **CLI** and a **web-based GUI**. Scan devices, detect vulnerabilities, analyze open ports, check DNS health, and get actionable security recommendations.

---

## Features

| Feature | CLI | GUI |
|---|---|---|
| Device discovery (ARP scan) | ✅ | ✅ |
| Port scanning | ✅ | ✅ |
| DNS leak test | ✅ | ✅ |
| Default credential check | ✅ | ✅ |
| Router config analysis | ✅ | ✅ |
| Security scoring | ✅ | ✅ |
| Export reports (JSON/HTML/PDF) | ✅ | ✅ |
| Real-time scan progress | ❌ | ✅ |
| Interactive device map | ❌ | ✅ |
| Historical scan comparison | ❌ | ✅ |

---

## Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+ (for GUI)
- `nmap` installed on your system
- Run as root/sudo for full scan capabilities

```bash
# macOS
brew install nmap

# Ubuntu/Debian
sudo apt install nmap

# Arch
sudo pacman -S nmap
```

### Installation

```bash
git clone https://github.com/yourusername/network-audit-tool.git
cd network-audit-tool
pip install -r requirements.txt
```

---

## CLI Usage

```bash
# Quick scan of local network
sudo python cli/netaudit.py scan

# Full audit with all checks
sudo python cli/netaudit.py audit --full

# Scan specific subnet
sudo python cli/netaudit.py scan --target 192.168.1.0/24

# Check specific host
sudo python cli/netaudit.py host 192.168.1.1 --ports --vulns

# Export report
sudo python cli/netaudit.py audit --full --export report.html

# DNS leak test
python cli/netaudit.py dns-test

# Watch mode (re-scan every N minutes)
sudo python cli/netaudit.py scan --watch 5
```

### CLI Commands

| Command | Description |
|---|---|
| `scan` | Discover devices on the network |
| `audit` | Run full security audit |
| `host <ip>` | Inspect a specific host |
| `dns-test` | Check for DNS leaks |
| `ports <ip>` | Port scan a host |
| `report` | Generate/view last report |
| `history` | Show scan history |
| `config` | Configure tool settings |

---

## GUI Usage

```bash
cd gui
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

For production build:
```bash
npm run build
# Serve the dist/ folder with any static server
```

---

## Architecture

```
network-audit-tool/
├── cli/
│   ├── netaudit.py          # CLI entry point
│   ├── commands/            # CLI command handlers
│   └── formatters.py        # Terminal output formatting
├── core/
│   ├── scanner.py           # Network/port scanning engine
│   ├── analyzer.py          # Security analysis & scoring
│   ├── dns_checker.py       # DNS leak detection
│   ├── vuln_checker.py      # Vulnerability checks
│   ├── reporter.py          # Report generation
│   └── models.py            # Data models
├── gui/
│   ├── src/
│   │   ├── App.jsx          # Main React app
│   │   ├── components/      # UI components
│   │   ├── hooks/           # Custom React hooks
│   │   └── api.js           # Backend API client
│   ├── server.py            # Flask API server for GUI
│   └── package.json
├── docs/
│   └── SECURITY.md
├── requirements.txt
└── README.md
```

---

## Security Notes

- This tool is intended for use **only on networks you own or have explicit permission to audit**
- Port scanning and vulnerability checks may trigger IDS/IPS alerts
- Some features require root/administrator privileges
- Default credential checking only tests against known public default lists — it does NOT attempt brute force

---

## Report Example

After running an audit, you get a security score and detailed findings:

```
╔══════════════════════════════════════════╗
║        NETAUDIT SECURITY REPORT         ║
╠══════════════════════════════════════════╣
║  Score: 72/100  [MODERATE RISK]         ║
║  Devices found: 14                      ║
║  Open ports flagged: 6                  ║
║  Critical issues: 2                     ║
║  Warnings: 5                            ║
╚══════════════════════════════════════════╝
```

---

## Contributing

PRs welcome! See [CONTRIBUTING.md](docs/CONTRIBUTING.md).

## License

MIT
