"""
core/analyzer.py — Security analysis engine
"""

import uuid
from typing import List, Dict, Tuple
from .models import Device, Finding, RiskLevel, AuditReport, NetworkInfo, DnsResult
from .scanner import RISKY_PORTS


# Known default credentials for common devices
DEFAULT_CREDENTIALS: List[Dict] = [
    {"device": "Generic Router", "user": "admin", "password": "admin"},
    {"device": "Generic Router", "user": "admin", "password": "password"},
    {"device": "Generic Router", "user": "admin", "password": "1234"},
    {"device": "Generic Router", "user": "admin", "password": ""},
    {"device": "Generic Router", "user": "root", "password": "root"},
    {"device": "Generic Router", "user": "root", "password": ""},
    {"device": "Netgear", "user": "admin", "password": "password"},
    {"device": "Linksys", "user": "admin", "password": "admin"},
    {"device": "D-Link", "user": "admin", "password": ""},
    {"device": "TP-Link", "user": "admin", "password": "admin"},
    {"device": "ASUS", "user": "admin", "password": "admin"},
    {"device": "Belkin", "user": "", "password": ""},
    {"device": "Ubiquiti", "user": "ubnt", "password": "ubnt"},
    {"device": "MikroTik", "user": "admin", "password": ""},
    {"device": "Hikvision", "user": "admin", "password": "12345"},
    {"device": "Dahua", "user": "admin", "password": "admin"},
]


def check_open_risky_ports(devices: List[Device]) -> List[Finding]:
    """Flag open ports that are commonly exploited."""
    findings = []
    
    for device in devices:
        for port in device.ports:
            if port.state != "open":
                continue
            if port.number in RISKY_PORTS:
                risk, reason = RISKY_PORTS[port.number]
                findings.append(Finding(
                    id=f"PORT-{port.number}-{device.ip.replace('.', '_')}",
                    category="Open Ports",
                    title=f"Risky port {port.number}/{port.protocol} open on {device.ip}",
                    description=f"Port {port.number} ({port.service or reason}) is open on {device.ip}. "
                                f"Reason flagged: {reason}",
                    risk=risk,
                    recommendation=_port_recommendation(port.number),
                    affected_devices=[device.ip],
                    evidence={"port": port.number, "service": port.service, "version": port.version},
                ))
    
    return findings


def _port_recommendation(port: int) -> str:
    recs = {
        21:  "Disable FTP and use SFTP (port 22) instead. FTP sends credentials in plaintext.",
        23:  "Disable Telnet immediately. Use SSH for remote administration.",
        80:  "If this is a router admin page, ensure it's not accessible from WAN. Consider redirecting to HTTPS.",
        111: "Disable RPC/portmapper if not needed. Block from external access.",
        135: "This is Windows RPC. Ensure firewall rules block external access to this port.",
        139: "Disable NetBIOS over TCP/IP if not required. Block externally.",
        445: "Ensure SMB is patched and not exposed to the internet. Disable SMBv1.",
        1433: "Do not expose SQL Server directly. Use VPN or SSH tunnel for remote DB access.",
        3306: "MySQL should not be exposed to the network. Bind to localhost only.",
        3389: "RDP is a high-value target. Use NLA, strong passwords, and VPN instead of direct exposure.",
        4444: "This port is associated with malware/backdoors. Investigate this device immediately.",
        5900: "Disable VNC or ensure it's protected with a strong password and encrypted tunnel.",
        6379: "Redis should never be exposed to the network. Bind to 127.0.0.1 only.",
        8080: "Verify this web server is intentional and uses HTTPS where possible.",
        27017: "MongoDB should not be network-accessible. Bind to localhost and require authentication.",
    }
    return recs.get(port, "Review whether this port needs to be open and consider firewall rules.")


def check_telnet_devices(devices: List[Device]) -> List[Finding]:
    """Flag devices with Telnet enabled."""
    findings = []
    telnet_devices = [
        d for d in devices
        if any(p.number == 23 and p.state == "open" for p in d.ports)
    ]
    if telnet_devices:
        findings.append(Finding(
            id="TELNET-ENABLED",
            category="Insecure Protocols",
            title=f"Telnet enabled on {len(telnet_devices)} device(s)",
            description="Telnet transmits all data including passwords in plaintext. "
                       "Any attacker on the network can capture credentials.",
            risk=RiskLevel.CRITICAL,
            recommendation="Disable Telnet and use SSH instead. For IoT devices, "
                          "check for firmware updates that add SSH support.",
            affected_devices=[d.ip for d in telnet_devices],
        ))
    return findings


def check_unencrypted_web(devices: List[Device]) -> List[Finding]:
    """Check for unencrypted HTTP admin interfaces."""
    findings = []
    http_devices = [
        d for d in devices
        if any(p.number in (80, 8080) and p.state == "open" for p in d.ports)
    ]
    if http_devices:
        findings.append(Finding(
            id="HTTP-ADMIN",
            category="Encryption",
            title=f"Unencrypted HTTP interface on {len(http_devices)} device(s)",
            description="HTTP interfaces transmit data without encryption. Credentials "
                       "and session tokens can be intercepted by network sniffers.",
            risk=RiskLevel.MEDIUM,
            recommendation="Switch to HTTPS for all web interfaces. If this is a router "
                          "admin page, disable HTTP access and enable HTTPS only.",
            affected_devices=[d.ip for d in http_devices],
        ))
    return findings


def check_smb_exposure(devices: List[Device]) -> List[Finding]:
    """Check for SMB/file sharing exposure."""
    findings = []
    smb_devices = [
        d for d in devices
        if any(p.number in (445, 139) and p.state == "open" for p in d.ports)
    ]
    if smb_devices:
        findings.append(Finding(
            id="SMB-EXPOSED",
            category="File Sharing",
            title=f"SMB file sharing exposed on {len(smb_devices)} device(s)",
            description="SMB (Windows File Sharing) is exposed. This was the vector for "
                       "WannaCry and other major ransomware. Ensure SMBv1 is disabled.",
            risk=RiskLevel.HIGH,
            recommendation="1) Disable SMBv1 on all Windows devices. "
                          "2) Block SMB ports at the router firewall. "
                          "3) Ensure Windows is fully patched (MS17-010).",
            affected_devices=[d.ip for d in smb_devices],
        ))
    return findings


def check_database_exposure(devices: List[Device]) -> List[Finding]:
    """Check for databases exposed on the network."""
    findings = []
    db_ports = {3306: "MySQL", 5432: "PostgreSQL", 1433: "MSSQL", 27017: "MongoDB", 6379: "Redis"}
    
    for device in devices:
        for port in device.ports:
            if port.number in db_ports and port.state == "open":
                db_name = db_ports[port.number]
                findings.append(Finding(
                    id=f"DB-EXPOSED-{port.number}-{device.ip.replace('.', '_')}",
                    category="Database Security",
                    title=f"{db_name} database exposed on {device.ip}",
                    description=f"{db_name} is listening on the network on port {port.number}. "
                               f"Many database servers ship with no authentication by default.",
                    risk=RiskLevel.CRITICAL,
                    recommendation=f"Bind {db_name} to localhost (127.0.0.1) only. "
                                  f"Never expose database ports to the local network unless strictly required.",
                    affected_devices=[device.ip],
                ))
    
    return findings


def check_too_many_open_ports(devices: List[Device]) -> List[Finding]:
    """Flag devices with an unusual number of open ports."""
    findings = []
    for device in devices:
        open_ports = [p for p in device.ports if p.state == "open"]
        if len(open_ports) > 15:
            findings.append(Finding(
                id=f"MANY-PORTS-{device.ip.replace('.', '_')}",
                category="Attack Surface",
                title=f"Excessive open ports on {device.ip} ({len(open_ports)} open)",
                description=f"Device at {device.ip} has {len(open_ports)} open ports. "
                           f"This increases the attack surface significantly.",
                risk=RiskLevel.MEDIUM,
                recommendation="Audit all services running on this device. "
                              "Disable or firewall services that are not needed.",
                affected_devices=[device.ip],
                evidence={"open_port_count": len(open_ports)},
            ))
    return findings


def check_iot_devices(devices: List[Device]) -> List[Finding]:
    """Warn about IoT devices on the network."""
    from .models import DeviceType
    findings = []
    iot_types = {DeviceType.IOT, DeviceType.CAMERA}
    iot_devices = [d for d in devices if d.device_type in iot_types]
    
    if iot_devices:
        findings.append(Finding(
            id="IOT-PRESENT",
            category="IoT Security",
            title=f"{len(iot_devices)} IoT device(s) detected",
            description="IoT devices often have poor security, rarely receive updates, "
                       "and are common botnet targets. They should be isolated.",
            risk=RiskLevel.MEDIUM,
            recommendation="Place IoT devices on a separate VLAN or guest network. "
                          "Change default credentials immediately. Check for firmware updates.",
            affected_devices=[d.ip for d in iot_devices],
        ))
    
    return findings


def calculate_security_score(devices: List[Device], findings: List[Finding]) -> int:
    """
    Calculate overall network security score 0-100.
    100 = perfect, 0 = critical vulnerabilities everywhere.
    """
    score = 100
    
    for finding in findings:
        if finding.risk == RiskLevel.CRITICAL:
            score -= 15
        elif finding.risk == RiskLevel.HIGH:
            score -= 10
        elif finding.risk == RiskLevel.MEDIUM:
            score -= 5
        elif finding.risk == RiskLevel.LOW:
            score -= 2
    
    return max(0, min(100, score))


def run_full_analysis(devices: List[Device], findings_extra: List[Finding] = None) -> Tuple[List[Finding], int]:
    """Run all security checks and return findings + score."""
    findings: List[Finding] = []
    
    findings.extend(check_open_risky_ports(devices))
    findings.extend(check_telnet_devices(devices))
    findings.extend(check_unencrypted_web(devices))
    findings.extend(check_smb_exposure(devices))
    findings.extend(check_database_exposure(devices))
    findings.extend(check_too_many_open_ports(devices))
    findings.extend(check_iot_devices(devices))
    
    if findings_extra:
        findings.extend(findings_extra)
    
    # Deduplicate by id
    seen = set()
    unique_findings = []
    for f in findings:
        if f.id not in seen:
            seen.add(f.id)
            unique_findings.append(f)
    
    score = calculate_security_score(devices, unique_findings)
    return unique_findings, score


def score_label(score: int) -> Tuple[str, str]:
    """Return (label, color_name) for a security score."""
    if score >= 85:
        return "SECURE", "green"
    elif score >= 65:
        return "MODERATE RISK", "yellow"
    elif score >= 40:
        return "HIGH RISK", "red"
    else:
        return "CRITICAL RISK", "bright_red"
