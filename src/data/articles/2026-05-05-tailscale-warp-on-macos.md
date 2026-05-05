---
title: "Tailscale + Cloudflare WARP on macOS"
description: "Why macOS only allows one VPN at a time, and two real ways to run Tailscale and Cloudflare WARP together."
pubDate: 2026-05-05
tags:
  - macos
  - networking
  - tailscale
  - cloudflare
  - vpn
---

> **macOS networking.** Why one disconnects the other, what's actually layerable, and how to set it up.

## The verdict, up front

> **Your stated layering doesn't exist.** You asked for Tailscale "inside" and WARP "outside" — Tailscale's UDP transiting WARP's tunnel. That's the configuration that *breaks* both apps. WARP NATs and MASQUE-encapsulates packets; Tailscale's WireGuard peer/DERP traffic can't survive that. Every working coexistence config explicitly punches Tailscale's bytes *out* of WARP, in the opposite direction.

> **What's deliverable.** If your real intent is "all my open-internet traffic exits through Cloudflare and my Tailnet still works," that's a solved problem. WARP holds the default route; Tailscale runs alongside; WARP's split-tunnel exclusions let Tailscale reach its peers and control plane via the physical interface. Browser, curl, apps → Cloudflare. Tailscale → tailnet, directly.

You're picking between two real setups. There is no third option I'd put in front of you.

| Option | WARP scope | Tailscale | Pick when |
|---|---|---|---|
| **A · Recommended** — Systemwide WARP + Tailscale alongside | Every byte of internet traffic egresses through Cloudflare | Native, full Tailnet | You want WARP applied to everything, no per-app config. Requires a free Cloudflare Zero Trust account. |
| **B · Alternative** — WARP Proxy Mode + native Tailscale | Per-app SOCKS5/HTTP proxy on `127.0.0.1:40000` | Native, full Tailnet | You only want WARP for specific apps (browser, curl). No NetworkExtension conflict at all because WARP isn't a system VPN in this mode. |

## Why only one VPN at a time

It's a hard framework limit, not a soft UI choice. Both Tailscale (App Store and standalone) and WARP install themselves as `NEPacketTunnelProvider` system extensions on the Apple NetworkExtension framework. Apple's developer-tools engineering, on the developer forums, states the rule directly: *only one `NEPacketTunnelProvider` can run on the system at one time because they are considered Enterprise VPNs.* A "Personal VPN" (the older `NEVPNManager` path used by IKEv2) can coexist with one Enterprise tunnel — but that's not what either of these apps uses.

Even where macOS is more permissive than iOS at the kernel level (you can have multiple `utun` interfaces in principle), the moment two NE apps both try to claim the system default route or system DNS, they fight. WARP grabs `0.0.0.0/0` as egress and intercepts everything — including Tailscale's control-plane and DERP relay traffic — even though WARP's defaults already exclude the `100.64.0.0/10` CGNAT range Tailscale's peers live in. The fix is to extend WARP's exclusion list far enough to cover everything Tailscale needs to talk to.

## Option A — Systemwide WARP + Tailscale alongside

The configuration: WARP is the default-route VPN; Tailscale runs without an exit node and without route acceptance; WARP's Split Tunnel exclusions cover Tailscale's full set of endpoints so they exit directly via Wi-Fi/Ethernet.

### 1. Cloudflare Zero Trust account (free)

Consumer 1.1.1.1+WARP has a Split Tunnel editor in *Preferences → Advanced*, but the full exclusion list (especially domain wildcards and IPv6 ranges) is cleaner to manage in the Zero Trust dashboard. Free up to 50 users, no credit card. Sign up at [one.dash.cloudflare.com](https://one.dash.cloudflare.com/), pick a team name, complete onboarding.

### 2. Install the apps

- **Tailscale**: standalone PKG from [pkgs.tailscale.com/stable](https://pkgs.tailscale.com/stable/). Don't use the App Store version alongside it — they conflict. If you've installed Tailscale before, fully remove it first (the [Tahoe + orphaned-extension](https://github.com/tailscale/tailscale/issues/17891) install break is real).
- **WARP**: Cloudflare One client from [Cloudflare's docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-devices/warp/download-warp/). Enroll the device into your Zero Trust team.

### 3. Bring up Tailscale without owning routes

```bash
tailscale up --accept-routes=false
```

No `--exit-node`. If you ever turn on a Tailscale exit node, this whole config breaks — Tailscale will then claim `0.0.0.0/0` and fight WARP for the default route. Tailscale's own KB confirms this is unworkable.

### 4. Add WARP Split Tunnel exclusions

Zero Trust dashboard → *Settings → WARP Client → Device Settings → Profile → Split Tunnels → Manage*. Confirm mode is *Exclude IPs and domains*. Add:

```
100.64.0.0/10
fd7a:115c:a1e0::/48
2606:B740:49::/48
controlplane.tailscale.com
login.tailscale.com
*.tailscale.com
*.ts.net
```

The `*.tailscale.com` wildcard covers DERP relay hostnames (`derpN.tailscale.com`), which is important — DERP IPs change over time, so excluding them by domain is more durable than by IP. Domain-based exclusions are slightly slower than IP-based per Cloudflare's docs, but with the wildcard backstop here the safety wins.

### 5. Fix MagicDNS resolution

Both apps want to set the system resolver. Without intervention, lookups for `*.ts.net` hit WARP's resolver, which doesn't know MagicDNS. The fix is Local Domain Fallback: in the Zero Trust dashboard under *WARP → Profile → Local Domains*, add:

```
ts.net
```

(Plus your custom MagicDNS suffix if you've set one.) This tells WARP to hand `.ts.net` queries to the system resolver, which Tailscale has pointed at `100.100.100.100`.

## Option B — WARP Proxy Mode + native Tailscale

Different shape: WARP doesn't run as a system VPN at all. It runs as a local proxy on `127.0.0.1:40000` (SOCKS5 or HTTPS). Tailscale gets full native networking; nothing fights for the default route; you opt apps into Cloudflare egress on a per-app basis.

This is the cleanest match for the "Tailscale native, WARP as a configurable filter" mental model — but it's per-app, not systemwide.

### Setup

1. Install Tailscale (standalone PKG) and the WARP client.
2. Tailscale: `tailscale up`. Nothing special needed.
3. WARP: open the menu bar app → *Preferences → Advanced → Configure Proxy*. Toggle on. Default port `40000`, SOCKS5 + HTTPS both available.
4. Switch WARP from VPN mode to Proxy mode (the toggle replaces the system-VPN behavior; WARP stops claiming default route).
5. Configure your apps:
   - Browser: SOCKS5 proxy `127.0.0.1:40000`, or use a per-tab proxy extension.
   - curl: `curl --socks5 127.0.0.1:40000 https://example.com`.
   - Shell: `export ALL_PROXY=socks5://127.0.0.1:40000` in the sessions you want.

## Verifying it works

Run these after either setup. Output should look as described.

```bash
tailscale status
```

Peers should show `active` or `direct`, not `relay only` indefinitely.

```bash
tailscale ping <peer-name>
```

Should succeed with low latency. `pong via DERP` for an extended period means peer connections aren't establishing — your exclusions are missing something.

```bash
curl https://www.cloudflare.com/cdn-cgi/trace
```

Option A: `warp=on` and `ip=` a Cloudflare egress IP. Option B (without forcing the proxy): `warp=off`; with `--socks5 127.0.0.1:40000`: `warp=on`.

```bash
traceroute 1.1.1.1
```

Option A: first hop inside Cloudflare's network. Option B (no proxy): your normal ISP path.

```bash
traceroute <peer-100.x-IP>
```

Should leave via the Tailscale `utun` interface, not Cloudflare. If a tailnet peer's traceroute shows Cloudflare hops, your exclusions for the CGNAT range broke.

```bash
scutil --dns | head -40
```

Resolver chain. `ts.net` should route via `100.100.100.100` (Tailscale MagicDNS).

```bash
dig +short controlplane.tailscale.com
```

Should resolve. Then `traceroute` the result and verify it leaves the box on the physical interface, not via WARP.

## Gotchas

- **MagicDNS is the most common "it's broken" mode.** If `*.ts.net` intermittently fails, you forgot the Local Domain Fallback. Tailscale appears connected but unreachable by name.
- **MTU stacking.** Both tunnels add overhead. If large transfers hang in Option A, drop Tailscale's MTU below the default 1280.
- **Performance hit.** Option A adds ~10–30 ms latency on every internet request (depends on closest Cloudflare PoP). Free WARP de-prioritizes at peak times; WARP+ helps if it bites.
- **Don't run two Tailscale variants.** App Store + standalone simultaneously can prevent the Tailscale extension from launching. Pick one.
- **Tahoe install pitfall.** An orphaned App Store Tailscale system extension can break a fresh standalone PKG install on macOS 26. Fully uninstall first.
- **Exit nodes are off the table in Option A.** A Tailscale exit node will fight WARP for `0.0.0.0/0` and one of them loses. If you need an exit node sometimes, switch to Option B for that period, or accept toggling.
- **DERP IPs aren't stable.** The `*.tailscale.com` wildcard is what makes the exclusion list survive over time; don't replace it with a hardcoded IP list.

## Sources

- [Apple Developer Forums — Multiple Simultaneous VPN Tunnels in macOS (DTS engineer answer)](https://developer.apple.com/forums/thread/675507)
- [Apple Developer Docs — NEPacketTunnelProvider](https://developer.apple.com/documentation/networkextension/nepackettunnelprovider)
- [Tailscale #5631 — Tailscale and Cloudflare WARP do not interoperate on macOS](https://github.com/tailscale/tailscale/issues/5631)
- [Tailscale #7252 — Incompatibility with Cloudflare WARP](https://github.com/tailscale/tailscale/issues/7252)
- [mxcao.me — Running Tailscale and Cloudflare WARP Together on macOS (Oct 2025, tested)](https://mxcao.me/posts/tailscale-cloudflare-warp-coexistence/)
- [Tailscale KB 1105 — Using Tailscale alongside other VPNs](https://tailscale.com/kb/1105/other-vpns)
- [Tailscale Docs — Three ways to run Tailscale on macOS](https://tailscale.com/docs/concepts/macos-variants)
- [Cloudflare Docs — WARP modes (consumer)](https://developers.cloudflare.com/warp-client/warp-modes/)
- [Cloudflare Docs — Split Tunnels](https://developers.cloudflare.com/cloudflare-one/team-and-resources/devices/warp/configure-warp/route-traffic/split-tunnels/)
- [Cloudflare Blog — Zero Trust Free plan (50 users)](https://blog.cloudflare.com/teams-plans/)
- [jasongodson.com — Local DNS Resolution with WARP and Zero Trust](https://jasongodson.com/blog/warp-with-local-dns/)
- [Tailscale #17891 — Tahoe orphaned App Store extension breaks PKG install](https://github.com/tailscale/tailscale/issues/17891)
