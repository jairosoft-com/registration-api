import http from 'http';
import https from 'https';

const BASE_URL = process.env.BASE_URL || 'http://localhost:4010';
const PATH = process.env.READY_PATH || '/api/v1/health/ready';
const TIMEOUT_SECONDS = parseInt(process.env.WAIT_TIMEOUT_SECONDS || '60', 10);
const INTERVAL_MS = 2000;

function ping(urlStr: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const lib = urlStr.startsWith('https') ? https : http;
    const req = lib.get(urlStr, (res) => {
      resolve(res.statusCode || 0);
    });
    req.on('error', reject);
  });
}

async function waitForReady() {
  const target = `${BASE_URL.replace(/\/$/, '')}${PATH}`;
  const deadline = Date.now() + TIMEOUT_SECONDS * 1000;
  while (Date.now() < deadline) {
    try {
      const status = await ping(target);
      if (status >= 200 && status < 400) {
        console.log(`Ready: ${target} (status ${status})`);
        process.exit(0);
      }
    } catch {
      // ignore and retry
    }
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  }
  console.error(`Timeout waiting for readiness: ${target}`);
  process.exit(1);
}

waitForReady();
