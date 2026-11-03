import http from 'http';
import net from 'net';
import os from 'os';
import { spawn, exec } from 'child_process';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

const HOME = process.env.HOME || '/data/data/com.termux/files/home';
const PREFIX = process.env.PREFIX || '/data/data/com.termux/files/usr';
const PID_FILE = join(HOME, '.antigem_bridge', 'gateway_proxy.pid');

export function getLanIPs() {
  const ips = [];
  const ifaces = os.networkInterfaces();
  for (const dev in ifaces) {
    ifaces[dev].forEach(details => {
      if (details.family === 'IPv4' && !details.internal) {
        ips.push(details.address);
      }
    });
  }
  return ips;
}

export function openBrowser(url) {
  // Android Termux
  if (existsSync('/data/data/com.termux/files/usr/bin/termux-open-url')) {
    exec(`/data/data/com.termux/files/usr/bin/termux-open-url "${url}"`);
    return;
  }
  if (existsSync('/data/data/com.termux/files/usr/bin/termux-open')) {
    exec(`/data/data/com.termux/files/usr/bin/termux-open "${url}"`);
    return;
  }

  // Desktop OS
  const cmd = process.platform === 'win32' ? `start "" "${url}"` :
              process.platform === 'darwin' ? `open "${url}"` :
              `xdg-open "${url}"`;
  exec(cmd, () => {});
}

export function acquireWakeLock() {
  if (existsSync('/data/data/com.termux/files/usr/bin/termux-wake-lock')) {
    exec('/data/data/com.termux/files/usr/bin/termux-wake-lock', () => {});
  }
}

export function checkBackendAlive(port = 1235, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const s = net.createConnection(port, host, () => {
      s.end();
      resolve(true);
    });
    s.on('error', () => resolve(false));
    s.setTimeout(1200, () => {
      s.destroy();
      resolve(false);
    });
  });
}

export async function ensureBackendRunning(targetPort = 1235) {
  const alive = await checkBackendAlive(targetPort);
  if (alive) return true;

  const bridgeBin = `${PREFIX}/bin/agy_ide_bridge`;
  const agyBin = `${HOME}/.local/bin/agy`;
  const tokenFile = `${HOME}/.antigem_bridge/csrf_token.txt`;

  if (!existsSync(bridgeBin) || !existsSync(agyBin)) {
    return false;
  }

  console.log('⚡ [Watchdog] Antigravity backend is down! Auto-reviving backend...');

  let token = 'aqkz8vmwnqfj';
  try {
    if (existsSync(tokenFile)) token = readFileSync(tokenFile, 'utf-8').trim();
  } catch {}

  const env = {
    ...process.env,
    NODE_OPTIONS: '--dns-result-order=ipv4first',
    GOMEMLIMIT: '1536MiB'
  };

  try {
    const child = spawn(bridgeBin, [
      '-f',
      '--token', token,
      '-p', '1234',
      '--hub-port', String(targetPort),
      '--tz-offset', '19800',
      '--bin', agyBin,
      '--no-claude'
    ], {
      detached: true,
      stdio: 'ignore',
      env
    });
    child.unref();
  } catch (err) {
    console.error('Failed to revive backend:', err.message);
  }

  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 200));
    if (await checkBackendAlive(targetPort)) {
      console.log('✅ [Watchdog] Backend restored successfully!');
      return true;
    }
  }

  return false;
}

export function startGateway(options = {}) {
  const TARGET_HOST = options.targetHost || '127.0.0.1';
  const TARGET_PORT = parseInt(options.targetPort || '1235', 10);
  const LISTEN_PORT = parseInt(options.proxyPort || '4400', 10);
  const FRAMED_HEADER = 'x-agaqkz8vmwnqfj_9qx';

  acquireWakeLock();

  let cachedCsrfToken = '907c52b4-6603-48d9-a40f-a2d710697713';

  function refreshCsrfToken() {
    const req = http.get(`http://${TARGET_HOST}:${TARGET_PORT}/`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const match = data.match(/"csrfToken"\s*:\s*"([^"]+)"/);
        if (match && match[1]) {
          cachedCsrfToken = match[1];
        }
      });
    });
    req.on('error', () => {});
    req.setTimeout(2000, () => req.destroy());
  }

  refreshCsrfToken();
  const intervalId = setInterval(async () => {
    const alive = await checkBackendAlive(TARGET_PORT, TARGET_HOST);
    if (!alive) {
      await ensureBackendRunning(TARGET_PORT);
    } else {
      refreshCsrfToken();
    }
  }, 10000);

  const server = http.createServer((req, res) => {
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Keep-Alive', 'timeout=65');

    const reqOptions = {
      hostname: TARGET_HOST,
      port: TARGET_PORT,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: `localhost:${TARGET_PORT}`,
        'x-forwarded-host': req.headers.host || '',
        'x-forwarded-for': req.socket.remoteAddress || ''
      }
    };

    const token = cachedCsrfToken || req.headers['x-codeium-csrf-token'] || req.headers[FRAMED_HEADER];
    if (token) {
      reqOptions.headers[FRAMED_HEADER] = token;
      reqOptions.headers['x-codeium-csrf-token'] = token;
    }

    if (req.url === '/' || req.url.startsWith('/?')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }

    let proxyReq = null;
    let isDone = false;

    const sendRequest = (isRetry = false) => {
      proxyReq = http.request(reqOptions, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
        proxyRes.on('end', () => { isDone = true; });
      });

      proxyReq.on('error', async (err) => {
        if (isDone) return;
        if (!isRetry && (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED' || err.code === 'EPIPE')) {
          await ensureBackendRunning(TARGET_PORT);
          return sendRequest(true);
        }
        isDone = true;
        if (!res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Antigravity Hub restarting, please refresh in a moment: ' + err.message);
        }
      });

      req.pipe(proxyReq);
    };

    req.on('aborted', () => {
      if (!isDone && proxyReq) {
        isDone = true;
        proxyReq.destroy();
      }
    });

    sendRequest(false);
  });

  server.on('upgrade', async (req, clientSocket, head) => {
    clientSocket.setKeepAlive(true, 15000);

    const alive = await checkBackendAlive(TARGET_PORT, TARGET_HOST);
    if (!alive) {
      await ensureBackendRunning(TARGET_PORT);
    }

    const proxySocket = net.connect(TARGET_PORT, TARGET_HOST, () => {
      proxySocket.setKeepAlive(true, 15000);

      let rawHeaders = `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n`;
      const headers = { ...req.headers, host: `localhost:${TARGET_PORT}` };
      const token = cachedCsrfToken || headers['x-codeium-csrf-token'] || headers[FRAMED_HEADER];
      if (token) {
        headers[FRAMED_HEADER] = token;
        headers['x-codeium-csrf-token'] = token;
      }
      for (const [key, value] of Object.entries(headers)) {
        rawHeaders += `${key}: ${value}\r\n`;
      }
      rawHeaders += '\r\n';

      proxySocket.write(rawHeaders);
      if (head && head.length > 0) proxySocket.write(head);
      clientSocket.pipe(proxySocket);
      proxySocket.pipe(clientSocket);
    });

    const closeBoth = () => {
      try { clientSocket.destroy(); } catch {}
      try { proxySocket.destroy(); } catch {}
    };

    clientSocket.on('close', closeBoth);
    clientSocket.on('error', closeBoth);
    proxySocket.on('close', closeBoth);
    proxySocket.on('error', closeBoth);
  });

  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
  server.requestTimeout = 300000;

  server.listen(LISTEN_PORT, '0.0.0.0', () => {
    try {
      writeFileSync(PID_FILE, String(process.pid));
    } catch {}

    const lanIps = getLanIPs();
    const localUrl = `http://localhost:${LISTEN_PORT}`;

    console.log('\n' + '═'.repeat(60));
    console.log('   🚀 Google Antigravity Web Gateway is Active! 🚀');
    console.log('═'.repeat(60));
    console.log(`📱 Mobile Browser URL  : ${localUrl}`);
    lanIps.forEach(ip => {
      console.log(`💻 PC / Laptop (Wi-Fi) : http://${ip}:${LISTEN_PORT}`);
    });
    console.log('═'.repeat(60));
    console.log('💡 Tip: Chrome me 3-dots (⋮) par tap karke "Add to Home screen"');
    console.log('   karein taaki yeh pura fullscreen app ban jaye.');
    console.log('   (Press Ctrl+C to stop)');
    console.log('═'.repeat(60) + '\n');

    if (options.autoOpen !== false) {
      console.log(`🌐 Opening ${localUrl} in your default browser...`);
      openBrowser(localUrl);
    }
  });

  return { server, intervalId };
}
