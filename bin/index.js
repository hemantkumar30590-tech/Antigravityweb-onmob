#!/usr/bin/env node
import { startGateway, checkBackendAlive, ensureBackendRunning } from '../src/proxy.js';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';

const HOME = process.env.HOME || '/data/data/com.termux/files/home';
const PID_FILE = join(HOME, '.antigem_bridge', 'gateway_proxy.pid');

const args = process.argv.slice(2);

let proxyPort = 4400;
let targetPort = 1235;
let autoOpen = true;

for (const arg of args) {
  if (arg === '--help' || arg === '-h') {
    console.log(`
Antigravity Web — Mobile & Browser Gateway

Usage:
  npx antigravityweb-onmob [options]
  npx github:hemantkumar30590-tech/Antigravityweb-onmob [options]

Commands:
  --status       Check if Antigravity Web Gateway & Backend are running
  --stop         Stop running background gateway instances
  --no-open      Do not automatically open browser

Options:
  --port=<port>         Port to run Gateway on (default: 4400)
  --target-port=<port>  Antigravity Hub port (default: 1235)
  --help, -h            Show this help message
`);
    process.exit(0);
  }

  if (arg === '--status') {
    const isTargetUp = await checkBackendAlive(targetPort);
    const isProxyUp = await checkBackendAlive(proxyPort);
    console.log('\n--- Antigravity Web Status ---');
    console.log(`Backend Hub (:${targetPort}): ${isTargetUp ? '✅ ACTIVE' : '❌ STOPPED'}`);
    console.log(`Gateway Proxy (:${proxyPort}): ${isProxyUp ? '✅ ACTIVE' : '❌ STOPPED'}`);
    if (isProxyUp) {
      console.log(`📱 Browser URL: http://localhost:${proxyPort}`);
    }
    process.exit(0);
  }

  if (arg === '--stop') {
    if (existsSync(PID_FILE)) {
      try {
        const pid = parseInt(readFileSync(PID_FILE, 'utf-8'), 10);
        process.kill(pid);
        unlinkSync(PID_FILE);
        console.log(`Stopped Antigravity Web Gateway (PID: ${pid})`);
      } catch (e) {
        console.log('No active gateway found or already stopped.');
      }
    } else {
      console.log('No gateway pid file found.');
    }
    process.exit(0);
  }

  if (arg === '--no-open') {
    autoOpen = false;
  }

  if (arg.startsWith('--port=')) {
    proxyPort = parseInt(arg.split('=')[1], 10);
  }
  if (arg.startsWith('--target-port=')) {
    targetPort = parseInt(arg.split('=')[1], 10);
  }
}

// Check if already running on the gateway port
const alreadyRunning = await checkBackendAlive(proxyPort);
if (alreadyRunning) {
  console.log(`\n⚡ Antigravity Web Gateway is already running on http://localhost:${proxyPort}`);
  if (autoOpen) {
    console.log('Opening browser...');
    const { openBrowser } = await import('../src/proxy.js');
    openBrowser(`http://localhost:${proxyPort}`);
  }
  process.exit(0);
}

// Ensure backend is started
await ensureBackendRunning(targetPort);

// Start Gateway
startGateway({
  targetPort,
  proxyPort,
  autoOpen
});
