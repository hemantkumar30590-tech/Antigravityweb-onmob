# 🚀 Antigravity Web — Mobile & Browser Gateway

> **Zero-config web gateway** for running Google Antigravity in any mobile browser (Chrome, Firefox) directly from Termux — no desktop required.

[![npm version](https://img.shields.io/badge/version-2.0.0-blue)](https://github.com/hemantkumar30590-tech/Antigravityweb-onmob)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## ⚡ Quick Start (npx — No Install Needed)

```bash
npx github:hemantkumar30590-tech/Antigravityweb-onmob
```

Then open in Chrome: **`http://localhost:4400`**

---

## ✅ v2.0.0 — What's New (Performance Upgrades)

| Upgrade | Benefit |
|---------|---------|
| 🗜️ **Gzip + Brotli Compression** | 60–80% faster page load |
| 🗄️ **Static Asset Caching** | Instant repeat visits (JS/CSS cached 1 day) |
| 🔗 **HTTP Connection Pool** | 20–40% less latency (25 pooled connections) |
| 🚫 **COOP/CSP Header Fix** | Removes headers that block Antigravity on mobile |
| ⚡ **WebSocket Nagle OFF** | Smoother real-time typing & AI responses |
| ⏱️ **Smart Watchdog (30s)** | Less CPU overhead (was 10s) |
| 📱 **Mobile Timeout Tuning** | Optimized for mobile network conditions |

---

## 📋 Commands

```bash
# Start gateway (opens browser automatically)
npx github:hemantkumar30590-tech/Antigravityweb-onmob

# Start without auto-open
npx github:hemantkumar30590-tech/Antigravityweb-onmob --no-open

# Check status
npx github:hemantkumar30590-tech/Antigravityweb-onmob --status

# Stop running gateway
npx github:hemantkumar30590-tech/Antigravityweb-onmob --stop

# Custom ports
npx github:hemantkumar30590-tech/Antigravityweb-onmob --port=5000 --target-port=1235
```

---

## 📱 Setup Guide (Termux on Android)

### Step 1 — Install Requirements
```bash
pkg update && pkg upgrade -y
pkg install nodejs git -y
```

### Step 2 — Run Gateway
```bash
npx github:hemantkumar30590-tech/Antigravityweb-onmob
```

### Step 3 — Open in Browser
Open Chrome and go to:
```
http://localhost:4400
```

### Step 4 — Add to Home Screen (PWA)
- Chrome mein 3-dots menu (⋮) tap karo
- **"Add to Home screen"** select karo
- Ab Antigravity ek full-screen app ki tarah chalega! 🎉

---

## 🌐 LAN Access (PC/Laptop se bhi access karo)

When gateway starts, it shows your Wi-Fi IP:
```
💻 PC / Laptop (Wi-Fi) : http://192.168.x.x:4400
```
Open this URL on any device on the same Wi-Fi network.

---

## 🏗️ Architecture

```
Chrome/Browser
      ↓
Gateway Proxy (:4400)        ← This package
  • Gzip/Brotli Compression
  • Static Asset Cache
  • Connection Pool (25)
  • Header Security Fix
  • WebSocket Proxy
      ↓
Antigravity Hub (:1235)      ← Antigravity backend
```

---

## ⚙️ Options

| Option | Default | Description |
|--------|---------|-------------|
| `--port=N` | `4400` | Gateway listen port |
| `--target-port=N` | `1235` | Antigravity Hub port |
| `--no-open` | — | Don't auto-open browser |
| `--status` | — | Show running status |
| `--stop` | — | Stop gateway |
| `--help` | — | Show help |

---

## 📦 Requirements

- **Android** with [Termux](https://f-droid.org/packages/com.termux/) (F-Droid version recommended)
- **Node.js >= 18** (`pkg install nodejs`)
- **Google Antigravity** installed and configured

---

## 📄 License

MIT © [hemantkumar30590-tech](https://github.com/hemantkumar30590-tech)
