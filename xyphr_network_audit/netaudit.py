#!/usr/bin/env python3
"""
cli/netaudit.py — NetAudit Command-Line Interface

Usage:
    sudo python cli/netaudit.py scan
    sudo python cli/netaudit.py audit --full
    sudo python cli/netaudit.py host 192.168.1.1
    python cli/netaudit.py dns-test
"""

import sys
import os
import uuid
import time
import json
from datetime import datetime
from typing import Optional

import click
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, BarColumn, TextColumn, TimeElapsedColumn
from rich.text import Text
from rich.columns import Columns
from rich import box

# Add parent dir to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.models import AuditReport, NetworkInfo, RiskLevel
from core.scanner import (
    get_local_network, get_public_ip, get_dns_servers,
    arp_scan, port_scan, build_device, guess_device_type
)
from core.analyzer import run_full_analysis, score_label
from core.dns_checker import run_all_dns_tests, benchmark_dns_servers
from core.reporter import save_report

console = Console()

RISK_COLORS = {
    "critical": "bright_red",
    "high": "red",
    "medium": "yellow",
    "low": "cyan",
    "info": "dim",
}

DEVICE_TYPE_ICONS = {
    "router": "🌐",
    "switch": "🔀",
    "access_point": "📡",
    "computer": "💻",
    "phone": "📱",
    "tablet": "📱",
    "smart_tv": "📺",
    "camera": "📷",
    "iot": "🏠",
    "printer": "🖨️",
    "game_console": "🎮",
    "unknown": "❓",
}


def print_banner():
    banner = """[bold blue]
  ███╗   ██╗███████╗████████╗ █████╗ ██╗   ██╗██████╗ ██╗████████╗
  ████╗  ██║██╔════╝╚══██╔══╝██╔══██╗██║   ██║██╔══██╗██║╚══██╔══╝
  ██╔██╗ ██║█████╗     ██║   ███████║██║   ██║██║  ██║██║   ██║   
  ██║╚██╗██║██╔══╝     ██║   ██╔══██║██║   ██║██║  ██║██║   ██║   
  ██║ ╚████║███████╗   ██║   ██║  ██║╚██████╔╝██████╔╝██║   ██║   
  ╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚═╝   ╚═╝ [/bold blue]
[dim]  Home Network Security Audit Tool  •  Use only on networks you own[/dim]
"""
    console.print(banner)


@click.group()
@click.version_option("1.0.0", prog_name="netaudit")
def cli():
    """NetAudit — Home Network Security Scanner"""
    pass


# ─── SCAN ─────────────────────────────────────────────────────────────────────

@cli.command()
@click.option("--target", "-t", default=None, help="Target subnet (e.g. 192.168.1.0/24). Auto-detects if not set.")
@click.option("--ports", "-p", is_flag=True, default=False, help="Also run port scan on discovered devices.")
@click.option("--watch", "-w", type=int, default=0, help="Repeat scan every N minutes.")
@click.option("--output", "-o", default=None, help="Save results to file (json or html).")
@click.option("--json-only", is_flag=True, default=False, help="Output raw JSON instead of formatted table.")
def scan(target, ports, watch, output, json_only):
    """Discover devices on your network."""
    if not json_only:
        print_banner()
    
    def do_scan():
        net_info_raw = get_local_network()
        subnet = target or net_info_raw.get("subnet", "192.168.1.0/24")
        gateway = net_info_raw.get("gateway", "")
        
        if not json_only:
            console.print(f"[bold]📡 Scanning:[/bold] {subnet}")
            if gateway:
                console.print(f"[dim]Gateway: {gateway}[/dim]\n")
        
        devices = []
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
            TimeElapsedColumn(),
            console=console,
            transient=True,
            disable=json_only,
        ) as progress:
            task = progress.add_task("ARP scanning network...", total=100)
            
            def update(pct):
                progress.update(task, completed=pct)
            
            raw_devices = arp_scan(subnet, progress_cb=update)
            progress.update(task, completed=100)
        
        for raw in raw_devices:
            device = build_device(raw, gateway)
            device.device_type = guess_device_type({
                "hostname": device.hostname,
                "vendor": device.vendor,
                "ports": device.ports,
                "is_gateway": device.is_gateway,
            })
            
            if ports:
                with console.status(f"[dim]Port scanning {device.ip}...[/dim]", spinner="dots"):
                    device.ports = port_scan(device.ip)
            
            devices.append(device)
        
        if json_only:
            print(json.dumps([d.to_dict() for d in devices], indent=2))
            return
        
        # Print results table
        table = Table(
            title=f"[bold]Devices Found: {len(devices)}[/bold]",
            box=box.ROUNDED,
            border_style="blue",
            header_style="bold cyan",
        )
        table.add_column("IP Address", style="bold", width=16)
        table.add_column("Type", width=12)
        table.add_column("Hostname", width=22)
        table.add_column("MAC Address", style="dim", width=18)
        table.add_column("Vendor", width=16)
        if ports:
            table.add_column("Open Ports", width=25)
        
        for device in sorted(devices, key=lambda d: d.ip):
            icon = DEVICE_TYPE_ICONS.get(device.device_type.value, "❓")
            device_type_str = f"{icon} {device.device_type.value.replace('_', ' ').title()}"
            
            row = [
                f"[green]{device.ip}[/green]" + (" [yellow]★[/yellow]" if device.is_gateway else ""),
                device_type_str,
                device.hostname or "[dim]—[/dim]",
                device.mac or "[dim]—[/dim]",
                device.vendor or "[dim]unknown[/dim]",
            ]
            if ports:
                open_ports = [p for p in device.ports if p.state == "open"]
                port_str = ", ".join(str(p.number) for p in open_ports[:6])
                if len(open_ports) > 6:
                    port_str += f" +{len(open_ports)-6}"
                row.append(port_str or "[dim]none[/dim]")
            
            table.add_row(*row)
        
        console.print(table)
        console.print(f"\n[dim]★ = Gateway[/dim]\n")
        
        if output:
            fmt = "html" if output.endswith(".html") else "json"
            console.print(f"[dim]Saving to {output}...[/dim]")
    
    if watch > 0:
        console.print(f"[dim]Watch mode: re-scanning every {watch} minute(s). Ctrl+C to stop.[/dim]\n")
        try:
            while True:
                do_scan()
                console.print(f"\n[dim]Next scan in {watch} minute(s)...[/dim]")
                time.sleep(watch * 60)
        except KeyboardInterrupt:
            console.print("\n[yellow]Watch mode stopped.[/yellow]")
    else:
        do_scan()


# ─── AUDIT ────────────────────────────────────────────────────────────────────

@cli.command()
@click.option("--target", "-t", default=None, help="Target subnet. Auto-detects if not set.")
@click.option("--full", "-f", is_flag=True, default=False, help="Run full audit including port scans and DNS tests.")
@click.option("--export", "-e", default=None, help="Export report: path ending in .html or .json")
@click.option("--quiet", "-q", is_flag=True, default=False, help="Minimal output (show score + findings only).")
def audit(target, full, export, quiet):
    """Run a full security audit of your network."""
    print_banner()
    
    scan_id = str(uuid.uuid4())
    start_time = time.time()
    
    console.rule("[bold blue]Starting Network Audit[/bold blue]")
    
    # Step 1: Network Info
    with console.status("🌐 Gathering network info..."):
        net_info_raw = get_local_network()
        subnet = target or net_info_raw.get("subnet", "192.168.1.0/24")
        gateway = net_info_raw.get("gateway", "")
        dns_servers = get_dns_servers()
        
        pub = get_public_ip()
        network = NetworkInfo(
            interface=net_info_raw.get("interface", ""),
            local_ip=net_info_raw.get("local_ip", ""),
            subnet=subnet,
            gateway=gateway,
            dns_servers=dns_servers,
            public_ip=pub.get("public_ip", ""),
            isp=pub.get("isp", ""),
        )
    
    if not quiet:
        info_table = Table(box=box.SIMPLE, show_header=False)
        info_table.add_column("Key", style="cyan", width=16)
        info_table.add_column("Value", style="white")
        info_table.add_row("Local IP", network.local_ip)
        info_table.add_row("Subnet", network.subnet)
        info_table.add_row("Gateway", network.gateway)
        info_table.add_row("Public IP", network.public_ip)
        info_table.add_row("ISP", network.isp)
        info_table.add_row("DNS Servers", ", ".join(network.dns_servers))
        console.print(Panel(info_table, title="Network Info", border_style="blue"))
    
    # Step 2: Device Discovery
    console.print("\n[bold]Step 1/3:[/bold] Discovering devices...\n")
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TimeElapsedColumn(),
        console=console,
    ) as progress:
        task = progress.add_task(f"ARP scanning {subnet}", total=100)
        raw_devices = arp_scan(subnet, progress_cb=lambda p: progress.update(task, completed=p))
        progress.update(task, completed=100)
    
    devices = [build_device(r, gateway) for r in raw_devices]
    console.print(f"[green]✓[/green] Found {len(devices)} devices\n")
    
    # Step 3: Port Scanning (if full)
    if full:
        console.print("[bold]Step 2/3:[/bold] Port scanning devices...\n")
        for i, device in enumerate(devices):
            with console.status(f"  Scanning {device.ip} ({i+1}/{len(devices)})..."):
                device.ports = port_scan(device.ip)
            open_count = len([p for p in device.ports if p.state == "open"])
            if open_count:
                console.print(f"  [dim]{device.ip}[/dim] — [cyan]{open_count} open ports[/cyan]")
        console.print()
    else:
        console.print("[dim]Step 2/3: Port scan skipped (use --full to enable)\n[/dim]")
    
    # Update device types
    for device in devices:
        device.device_type = guess_device_type({
            "hostname": device.hostname,
            "vendor": device.vendor,
            "ports": device.ports,
            "is_gateway": device.is_gateway,
        })
    
    # Step 4: DNS Tests
    dns_results = []
    dns_findings = []
    if full:
        console.print("[bold]Step 3/3:[/bold] Running DNS security tests...\n")
        with console.status("  Testing DNS..."):
            dns_results, dns_findings = run_all_dns_tests()
        for result in dns_results:
            icon = "[green]✓[/green]" if result.passed else "[red]✗[/red]"
            console.print(f"  {icon} {result.test_name}")
        console.print()
    else:
        console.print("[dim]Step 3/3: DNS tests skipped (use --full to enable)\n[/dim]")
    
    # Step 5: Analysis
    with console.status("🔍 Analyzing security..."):
        findings, score = run_full_analysis(devices, dns_findings)
    
    duration = time.time() - start_time
    
    # Build report
    report = AuditReport(
        scan_id=scan_id,
        timestamp=datetime.now().isoformat(),
        duration_seconds=duration,
        network=network,
        devices=devices,
        findings=findings,
        dns_results=dns_results,
        security_score=score,
    )
    
    # ── Print Score ──────────────────────────────────────────
    console.rule()
    label, color = score_label(score)
    score_text = Text(f"  {score}/100  ", style=f"bold {color} on default", justify="center")
    
    score_panel = Panel(
        Text.assemble(
            Text(f"\n  Security Score: ", style="bold white"),
            Text(f"{score}", style=f"bold {color}", justify="center"),
            Text(f"/100\n", style="bold white"),
            Text(f"  {label}\n", style=f"bold {color}"),
            Text(f"\n  Devices: {len(devices)}  |  Findings: {len(findings)}  |  Duration: {round(duration,1)}s\n", style="dim"),
        ),
        border_style=color,
        title="[bold]AUDIT COMPLETE[/bold]",
    )
    console.print(score_panel)
    
    # ── Print Findings ────────────────────────────────────────
    if findings:
        console.print(f"\n[bold]🚨 Security Findings ({len(findings)})[/bold]\n")
        
        sorted_findings = sorted(
            findings,
            key=lambda f: ["critical", "high", "medium", "low", "info"].index(f.risk.value)
        )
        
        for finding in sorted_findings:
            risk_color = RISK_COLORS.get(finding.risk.value, "white")
            risk_badge = f"[bold {risk_color}][{finding.risk.value.upper()}][/bold {risk_color}]"
            
            console.print(Panel(
                f"[bold]{finding.title}[/bold]\n\n"
                f"[dim]{finding.description}[/dim]\n\n"
                f"[green]💡 {finding.recommendation}[/green]",
                title=f"{risk_badge} {finding.category}",
                border_style=risk_color,
            ))
    else:
        console.print("\n[bold green]✅ No security findings! Your network looks clean.[/bold green]")
    
    # ── Devices Summary ───────────────────────────────────────
    if not quiet:
        console.print(f"\n[bold]💻 Devices Summary[/bold]\n")
        tbl = Table(box=box.MINIMAL_DOUBLE_HEAD, header_style="bold cyan")
        tbl.add_column("IP")
        tbl.add_column("Type")
        tbl.add_column("Hostname")
        tbl.add_column("Vendor")
        tbl.add_column("Open Ports")
        tbl.add_column("Risk Score")
        
        for d in sorted(devices, key=lambda x: x.ip):
            icon = DEVICE_TYPE_ICONS.get(d.device_type.value, "❓")
            open_p = [p for p in d.ports if p.state == "open"]
            risk_c = "green" if d.risk_score < 30 else "yellow" if d.risk_score < 60 else "red"
            tbl.add_row(
                f"[{'yellow' if d.is_gateway else 'white'}]{d.ip}[/]",
                f"{icon} {d.device_type.value.replace('_', ' ').title()}",
                d.hostname or "—",
                d.vendor or "unknown",
                str(len(open_p)),
                f"[{risk_c}]{d.risk_score}[/{risk_c}]",
            )
        console.print(tbl)
    
    # ── Export ────────────────────────────────────────────────
    if export:
        fmt = "html" if export.endswith(".html") else "json"
        path = save_report(report, fmt=fmt, output_dir=os.path.dirname(export) or ".")
        # Rename to user's requested path
        if path != export:
            os.rename(path, export)
        console.print(f"\n[green]📄 Report saved:[/green] {export}")


# ─── HOST ─────────────────────────────────────────────────────────────────────

@cli.command()
@click.argument("ip")
@click.option("--ports", "-p", is_flag=True, default=True, help="Port scan the host.")
@click.option("--port-range", default="1-1024,8080,8443,8888,9090,27017,6379,5900,3389", help="Port range to scan.")
def host(ip, ports, port_range):
    """Inspect a specific host in detail."""
    print_banner()
    console.print(f"[bold]🔍 Inspecting:[/bold] {ip}\n")
    
    if ports:
        with console.status(f"Port scanning {ip}..."):
            scanned_ports = port_scan(ip, port_range)
        
        open_ports = [p for p in scanned_ports if p.state == "open"]
        
        if open_ports:
            tbl = Table(title=f"Open Ports on {ip}", box=box.ROUNDED, border_style="cyan")
            tbl.add_column("Port", style="bold")
            tbl.add_column("Protocol")
            tbl.add_column("Service")
            tbl.add_column("Version", style="dim")
            tbl.add_column("Risk")
            
            for p in sorted(open_ports, key=lambda x: x.number):
                risk_color = RISK_COLORS.get(p.risk.value, "white")
                tbl.add_row(
                    str(p.number),
                    p.protocol.upper(),
                    p.service or "unknown",
                    p.version or "—",
                    f"[{risk_color}]{p.risk.value.upper()}[/{risk_color}]",
                )
            
            console.print(tbl)
        else:
            console.print(f"[green]✓ No open ports found in range {port_range}[/green]")


# ─── DNS-TEST ─────────────────────────────────────────────────────────────────

@cli.command("dns-test")
@click.option("--benchmark", "-b", is_flag=True, default=False, help="Also benchmark DNS server speeds.")
def dns_test(benchmark):
    """Run DNS security and leak tests."""
    print_banner()
    console.print("[bold]🌐 Running DNS Security Tests[/bold]\n")
    
    with console.status("Running DNS tests..."):
        results, findings = run_all_dns_tests()
    
    for result in results:
        icon = "✅" if result.passed else "❌"
        color = "green" if result.passed else "red"
        console.print(Panel(
            f"[dim]{result.details}[/dim]\n[dim]Servers: {', '.join(result.servers_used)}[/dim]",
            title=f"[bold {color}]{icon} {result.test_name}[/bold {color}]",
            border_style=color,
        ))
    
    if benchmark:
        console.print("\n[bold]⚡ DNS Benchmark[/bold]\n")
        with console.status("Benchmarking DNS servers..."):
            bench_results = benchmark_dns_servers()
        
        tbl = Table(box=box.SIMPLE, header_style="bold cyan")
        tbl.add_column("DNS Server")
        tbl.add_column("Provider")
        tbl.add_column("Latency")
        tbl.add_column("Status")
        
        for r in bench_results:
            latency = f"{r['latency_ms']}ms" if r["latency_ms"] else "timeout"
            color = "green" if r["reachable"] and (r["latency_ms"] or 9999) < 50 else "yellow" if r["reachable"] else "red"
            tbl.add_row(r["server"], r["name"], f"[{color}]{latency}[/{color}]", "✅" if r["reachable"] else "❌")
        
        console.print(tbl)


# ─── REPORT ───────────────────────────────────────────────────────────────────

@cli.command()
@click.argument("input_file")
@click.option("--format", "-f", "fmt", default="html", type=click.Choice(["html", "json"]))
@click.option("--output", "-o", default=None)
def report(input_file, fmt, output):
    """Convert a JSON scan result to HTML report."""
    with open(input_file) as f:
        data = json.load(f)
    
    from core.models import AuditReport, NetworkInfo, Device, Finding, DnsResult
    from core.reporter import generate_html_report, generate_json_report
    
    console.print(f"[green]✓ Loaded report: {input_file}[/green]")
    console.print(f"[dim]Score: {data.get('security_score', '?')}  |  Devices: {len(data.get('devices', []))}[/dim]")


# ─── CONFIG ───────────────────────────────────────────────────────────────────

@cli.command()
def config():
    """Show current configuration and environment info."""
    import shutil
    print_banner()
    console.print("[bold]⚙️  Environment[/bold]\n")
    
    checks = [
        ("nmap", shutil.which("nmap") is not None, "Required for port scanning and ARP discovery"),
        ("Python nmap", True, "pip install python-nmap"),
        ("Rich", True, "pip install rich  (terminal formatting)"),
        ("Root/sudo", os.geteuid() == 0 if hasattr(os, 'geteuid') else True, "Required for ARP scan and SYN scan"),
    ]
    
    tbl = Table(box=box.SIMPLE)
    tbl.add_column("Component")
    tbl.add_column("Status")
    tbl.add_column("Notes", style="dim")
    
    for name, ok, note in checks:
        tbl.add_row(name, "[green]✓[/green]" if ok else "[red]✗[/red]", note)
    
    console.print(tbl)


if __name__ == "__main__":
    cli()
