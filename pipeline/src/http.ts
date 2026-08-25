import { REQUEST_DELAY_MS, USER_AGENT, MAX_RETRIES } from "./config.js";

let lastRequest = 0;

async function throttle() {
  const now = Date.now();
  const wait = REQUEST_DELAY_MS - (now - lastRequest);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequest = Date.now();
}

export async function fetchText(url: string): Promise<string> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    await throttle();
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en,fr;q=0.9",
        },
      });
      if (res.status === 429 || res.status >= 500) {
        const backoff = REQUEST_DELAY_MS * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${url}`);
      }
      return await res.text();
    } catch (e) {
      lastError = e;
      const backoff = REQUEST_DELAY_MS * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(`Failed to fetch ${url}`);
}
