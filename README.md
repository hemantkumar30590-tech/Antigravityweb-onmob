# 🚀 Antigravityweb-onmob

Zero-config web gateway and launcher for **Google Antigravity IDE** on Android (Termux) mobile browsers and LAN.

Run Google Antigravity seamlessly in Chrome, Brave, or any mobile browser with full touch support, 24/7 background persistence, and zero black-screen issues.

---

## ⚡ Instant Run via npx

Run directly from anywhere without cloning:

```bash
npx github:hemantkumar30590-tech/Antigravityweb-onmob
```

Or if installed globally:
```bash
npx antigravityweb-onmob
```

---

## ✨ Features

- **No Black Screen (CSRF Header Bridge):** Automatically intercepts RPC requests and injects the valid CSRF token, solving the black screen crash.
- **Self-Healing Watchdog:** If Android Doze or Low Memory Killer kills the backend process while idle, the gateway automatically revives it when you reload.
- **Mobile Keep-Alive & Socket Cleanup:** Solves connection drops and infinite reload spinners after switching away from the browser.
- **Termux Wake-Lock Automation:** Automatically holds Termux wake-lock to keep CPU active.
- **Cross-Device LAN Access:** Access Antigravity from your PC/Laptop over Wi-Fi without `Unauthorized Host` errors.
- **Zero External Dependencies:** Built with pure native Node.js standard libraries for blazing-fast startup (<100ms).

---

## 📱 Browser Access

Once started, open:

* **Phone Browser:** `http://localhost:4400`
* **PC / Laptop (Same Wi-Fi):** `http://<phone-ip>:4400`

### 💡 PWA (Fullscreen App Tip)
1. Open `http://localhost:4400` in Chrome or Brave.
2. Tap the **3 dots (⋮)** in the top right.
3. Tap **"Add to Home screen"** / **"Install app"**.
4. Antigravity will now open like a native fullscreen app without any browser URL bars!

---

## 🛠️ CLI Commands & Options

```bash
# Check if Antigravity backend and gateway are running
npx antigravityweb-onmob --status

# Stop background gateway instances
npx antigravityweb-onmob --stop

# Custom gateway port
npx antigravityweb-onmob --port=8080

# Do not open browser automatically
npx antigravityweb-onmob --no-open
```

---

## ⚙️ Recommended Mobile Settings (Android)

To prevent Android from killing Termux when screen is locked:
1. Go to **Phone Settings** -> **Apps** -> **Termux** -> **Battery**.
2. Select **"Unrestricted"** (or *"Don't optimize"*).
3. In Recent Apps, lock 🔒 the Termux card so it doesn't get cleared.

---

## 📄 License

MIT © [hemantkumar30590-tech](https://github.com/hemantkumar30590-tech)
