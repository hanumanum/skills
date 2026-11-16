import { extractAssets } from './html.mjs';
import { round } from './stats.mjs';

let undiciModule;
const loadUndici = async () => {
  if (undiciModule) return undiciModule;
  try {
    undiciModule = await import('undici');
  } catch {
    throw new Error('The load test needs the undici package. Install it, then run again.');
  }
  return undiciModule;
};

const CLIENT_HINTS = {
  'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Linux"',
};

const clean = (headers) => Object.fromEntries(Object.entries(headers).filter(([, value]) => value != null && value !== ''));

const cookieHeader = (cookies) => {
  const learned = cookies.size === 0 ? '' : [...cookies.entries()].map(([name, value]) => `${name}=${value}`).join('; ');
  const preset = process.env.LOAD_COOKIE || '';
  const parts = [preset, learned].filter(Boolean);
  return parts.length === 0 ? undefined : parts.join('; ');
};

const authorizationHeader = () => process.env.LOAD_AUTHORIZATION || undefined;

const rememberCookies = (cookies, response) => {
  const lines = typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : [];
  for (const line of lines) {
    const pair = line.split(';', 1)[0];
    const eq = pair.indexOf('=');
    if (eq <= 0) continue;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    if (value === '') cookies.delete(name);
    else cookies.set(name, value);
  }
};

const documentHeaders = (config, cookies, referer) =>
  clean({
    ...CLIENT_HINTS,
    'user-agent': config.userAgent,
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'accept-language': config.acceptLanguage,
    'cache-control': 'no-cache',
    pragma: 'no-cache',
    'upgrade-insecure-requests': '1',
    referer,
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': referer ? 'same-origin' : 'none',
    'sec-fetch-user': '?1',
    authorization: authorizationHeader(),
    cookie: cookieHeader(cookies),
  });

const ACCEPT = {
  script: '*/*',
  style: 'text/css,*/*;q=0.1',
  image: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  font: '*/*',
};

const assetHeaders = (config, cookies, pageUrl, kind) =>
  clean({
    ...CLIENT_HINTS,
    'user-agent': config.userAgent,
    accept: ACCEPT[kind] ?? '*/*',
    'accept-language': config.acceptLanguage,
    'cache-control': 'no-cache',
    pragma: 'no-cache',
    referer: pageUrl,
    'sec-fetch-dest': kind === 'style' ? 'style' : kind,
    'sec-fetch-mode': kind === 'image' ? 'no-cors' : 'cors',
    'sec-fetch-site': 'same-origin',
    authorization: authorizationHeader(),
    cookie: cookieHeader(cookies),
  });

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const mapLimit = async (items, limit, fn) => {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await fn(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
};

const createBrowser = async () => {
  const { Agent } = await loadUndici();
  const agent = new Agent({ allowH2: true, connections: 1 });
  return {
    agent,
    cookies: new Map(),
    close: () => agent.close(),
  };
};

const timedFetch = async (browser, url, headers, timeoutMs) => {
  const { fetch: undiciFetch } = await loadUndici();
  const start = performance.now();
  try {
    const response = await undiciFetch(url, {
      dispatcher: browser.agent,
      headers,
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
    });
    const ttfbMs = performance.now() - start;
    const body = Buffer.from(await response.arrayBuffer());
    rememberCookies(browser.cookies, response);
    const status = response.status;
    return {
      url: response.url || url,
      status,
      ttfbMs,
      totalMs: performance.now() - start,
      bytes: body.length,
      body,
      contentType: response.headers.get('content-type') ?? '',
      requestId: response.headers.get('x-request-id'),
      error: status >= 200 && status < 300 ? null : `HTTP ${status}`,
    };
  } catch (error) {
    const totalMs = performance.now() - start;
    const message = error.name === 'TimeoutError' ? `Timed out after ${timeoutMs} ms` : error.message;
    return {
      url,
      status: 0,
      ttfbMs: totalMs,
      totalMs,
      bytes: 0,
      body: Buffer.alloc(0),
      contentType: '',
      requestId: null,
      error: message,
    };
  }
};

const toSample = ({ result, page, kind, vu, iteration }) => ({
  page,
  kind,
  url: result.url,
  status: result.status,
  ttfbMs: round(result.ttfbMs),
  totalMs: round(result.totalMs),
  bytes: result.bytes,
  error: result.error,
  requestId: result.requestId || null,
  vu,
  iteration,
});

const isHtml = (contentType, text) =>
  /text\/html|application\/xhtml\+xml/i.test(contentType) || /^\s*(<!doctype html|<html)/i.test(text);

export const loadPage = async (browser, config, page, vu, iteration, referer) => {
  const requestUrl = page.url ?? new URL(page.path, config.baseUrl).href;
  const result = await timedFetch(browser, requestUrl, documentHeaders(config, browser.cookies, referer), config.timeoutMs);
  const sample = toSample({ result, page: page.name, kind: 'document', vu, iteration });
  const samples = [sample];
  if (sample.error) return samples;

  const html = new TextDecoder().decode(result.body);
  if (!isHtml(result.contentType, html)) {
    sample.error = `Expected HTML, got ${result.contentType || 'an empty body'}`;
    return samples;
  }
  if (!config.loadAssets) return samples;

  let assets;
  try {
    assets = extractAssets(html, result.url || requestUrl);
  } catch (error) {
    sample.error = error.message;
    return samples;
  }
  sample.discovered = assets.length;

  const assetSamples = await mapLimit(assets, config.assetConcurrency, async (asset) => {
    const assetResult = await timedFetch(
      browser,
      asset.url,
      assetHeaders(config, browser.cookies, result.url || requestUrl, asset.kind),
      config.timeoutMs,
    );
    return toSample({ result: assetResult, page: page.name, kind: asset.kind, vu, iteration });
  });
  samples.push(...assetSamples);
  return samples;
};

const failedUser = (config, vu, error) => ({
  page: config.pages[0]?.name ?? 'run',
  kind: 'document',
  url: config.baseUrl,
  status: 0,
  ttfbMs: 0,
  totalMs: 0,
  bytes: 0,
  error: error.message,
  vu,
  iteration: 0,
});

export const pageLoadCount = (rps, durationMs) => {
  if (rps <= 0 || durationMs <= 0) return 0;
  const interval = 1000 / rps;
  let count = 0;
  for (let at = 0; at < durationMs; at += interval) count += 1;
  return count;
};

export const runAtRate = async (config, onStart) => {
  const page = config.pages[0];
  const browsers = await Promise.all(Array.from({ length: config.vus }, () => createBrowser()));
  const free = browsers.map((_, index) => index);
  const samples = [];
  const jobs = new Set();
  let skipped = 0;

  const intervalMs = 1000 / config.rps;
  const deadline = performance.now() + config.durationMs;
  let nextAt = performance.now();
  let sequence = 0;

  try {
    while (performance.now() < deadline) {
      const wait = nextAt - performance.now();
      if (wait > 0) await delay(wait);
      if (performance.now() >= deadline) break;
      nextAt += intervalMs;
      sequence += 1;
      onStart?.(sequence);
      if (free.length === 0) {
        skipped += 1;
        continue;
      }
      const slot = free.shift();
      const iteration = sequence;
      const job = (async () => {
        try {
          const pageSamples = await loadPage(browsers[slot], config, page, slot + 1, iteration);
          samples.push(...pageSamples);
          if (config.thinkTimeMs > 0) await delay(config.thinkTimeMs);
        } catch (error) {
          samples.push(failedUser(config, slot + 1, error));
        } finally {
          free.push(slot);
        }
      })();
      jobs.add(job);
      job.finally(() => jobs.delete(job));
    }
    await Promise.all([...jobs]);
  } finally {
    await Promise.all(browsers.map((browser) => browser.close().catch(() => {})));
  }

  return { samples, skipped };
};
