"""
tests/test_core.py — Unit tests for NetAudit core
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from core.models import Device, Port, Finding, RiskLevel, DeviceType
from core.analyzer import (
    check_open_risky_ports,
    check_telnet_devices,
    check_unencrypted_web,
    check_smb_exposure,
    calculate_security_score,
    score_label,
)
from core.scanner import lookup_mac_vendor, guess_device_type


# ─── Model tests ──────────────────────────────────────────────────────────────

def make_device(ip="192.168.1.1", ports=None):
    d = Device(ip=ip)
    if ports:
        d.ports = ports
    return d


def test_device_risk_score_clean():
    d = make_device()
    assert d.risk_score == 0


def test_device_risk_score_with_critical_vuln():
    from core.models import Vulnerability
    d = make_device()
    d.vulnerabilities = [
        Vulnerability(id="V1", title="Test", description="", risk=RiskLevel.CRITICAL, recommendation="")
    ]
    assert d.risk_score == 30


def test_device_to_dict():
    d = make_device("10.0.0.1")
    d_dict = d.to_dict()
    assert d_dict["ip"] == "10.0.0.1"
    assert "ports" in d_dict
    assert "risk_score" in d_dict


# ─── Scanner tests ────────────────────────────────────────────────────────────

def test_lookup_mac_vendor_known():
    vendor = lookup_mac_vendor("b8:27:eb:00:00:00")
    assert vendor == "Raspberry Pi"


def test_lookup_mac_vendor_unknown():
    vendor = lookup_mac_vendor("aa:bb:cc:00:00:00")
    assert vendor == ""


def test_guess_device_type_router():
    dt = guess_device_type({"hostname": "router.local", "vendor": "", "ports": [], "is_gateway": True})
    assert dt == DeviceType.ROUTER


def test_guess_device_type_printer():
    ports = [Port(number=515, protocol="tcp", state="open", service="printer")]
    dt = guess_device_type({"hostname": "", "vendor": "", "ports": ports, "is_gateway": False})
    assert dt == DeviceType.PRINTER


def test_guess_device_type_phone():
    dt = guess_device_type({"hostname": "iphone-john", "vendor": "", "ports": [], "is_gateway": False})
    assert dt == DeviceType.PHONE


# ─── Analyzer tests ───────────────────────────────────────────────────────────

def test_check_telnet_finds_telnet():
    port = Port(number=23, protocol="tcp", state="open", service="telnet", risk=RiskLevel.CRITICAL)
    device = make_device("192.168.1.5", ports=[port])
    findings = check_telnet_devices([device])
    assert len(findings) == 1
    assert findings[0].risk == RiskLevel.CRITICAL


def test_check_telnet_clean():
    findings = check_telnet_devices([make_device()])
    assert len(findings) == 0


def test_check_smb_exposure():
    port = Port(number=445, protocol="tcp", state="open", service="smb", risk=RiskLevel.HIGH)
    device = make_device("192.168.1.10", ports=[port])
    findings = check_smb_exposure([device])
    assert len(findings) == 1
    assert findings[0].risk == RiskLevel.HIGH


def test_check_http_web():
    port = Port(number=80, protocol="tcp", state="open", service="http", risk=RiskLevel.MEDIUM)
    device = make_device("192.168.1.1", ports=[port])
    findings = check_unencrypted_web([device])
    assert len(findings) == 1


def test_risky_ports():
    ports = [
        Port(number=23, protocol="tcp", state="open", service="telnet", risk=RiskLevel.CRITICAL),
        Port(number=3306, protocol="tcp", state="open", service="mysql", risk=RiskLevel.HIGH),
    ]
    device = make_device("192.168.1.20", ports=ports)
    findings = check_open_risky_ports([device])
    assert len(findings) == 2


def test_calculate_score_clean():
    score = calculate_security_score([], [])
    assert score == 100


def test_calculate_score_with_findings():
    findings = [
        Finding(id="F1", category="Test", title="Critical issue", description="", risk=RiskLevel.CRITICAL, recommendation=""),
        Finding(id="F2", category="Test", title="High issue", description="", risk=RiskLevel.HIGH, recommendation=""),
    ]
    score = calculate_security_score([], findings)
    assert score < 100
    assert score == 75  # 100 - 15 - 10


def test_score_label_secure():
    label, color = score_label(90)
    assert label == "SECURE"
    assert color == "green"


def test_score_label_critical():
    label, color = score_label(25)
    assert "CRITICAL" in label


# ─── Integration-style test ───────────────────────────────────────────────────

def test_full_analysis_pipeline():
    from core.analyzer import run_full_analysis
    ports = [
        Port(number=23, protocol="tcp", state="open", service="telnet", risk=RiskLevel.CRITICAL),
        Port(number=80, protocol="tcp", state="open", service="http", risk=RiskLevel.MEDIUM),
    ]
    device = Device(ip="192.168.1.1", ports=ports, is_gateway=True)
    findings, score = run_full_analysis([device])
    assert score < 100
    assert any(f.risk == RiskLevel.CRITICAL for f in findings)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
