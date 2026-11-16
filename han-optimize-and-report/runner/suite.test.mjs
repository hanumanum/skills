import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadConfig } from './lib/config.mjs';
import { productionHostBlocked } from './lib/guard.mjs';
import { extractAssets } from './lib/html.mjs';
import { compareRuns, percentile, summarize, summarizeRun } from './lib/stats.mjs';
import { pageLoadCount } from './lib/session.mjs';
import { readPreviousRun, saveRun } from './lib/store.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));

test('extractAssets keeps same-origin files and drops duplicates and third parties', () => {
  const html = `
    <link rel="stylesheet" href="/_nuxt/entry.css">
    <link rel="modulepreload" href="/_nuxt/a.js">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Noto">
    <script type="module" src="/_nuxt/a.js"></script>
    <script src="/_nuxt/b.js"></script>
    <img src="/cms/x.svg">
    <img src="https://example.com/a.png">
    <link rel="icon" href="/favicon.ico">
  `;
  const assets = extractAssets(html, 'https://dev.example.com/');
  assert.deepEqual(
    assets.map((asset) => `${asset.kind} ${asset.url}`),
    [
      'style https://dev.example.com/_nuxt/entry.css',
      'script https://dev.example.com/_nuxt/a.js',
      'script https://dev.example.com/_nuxt/b.js',
      'image https://dev.example.com/cms/x.svg',
      'image https://dev.example.com/favicon.ico',
    ],
  );
});

test('percentile uses the nearest rank', () => {
  assert.equal(percentile([10, 20, 30, 40], 95), 40);
  assert.equal(percentile([10], 50), 10);
  assert.equal(percentile([], 95), null);
});

test('summarize counts errors separately from successful requests', () => {
  const summary = summarize([
    { totalMs: 100, ttfbMs: 40, bytes: 10, error: null },
    { totalMs: 300, ttfbMs: 80, bytes: 5, error: 'HTTP 502' },
  ]);
  assert.equal(summary.count, 2);
  assert.equal(summary.errors, 1);
  assert.equal(summary.errorRate, 0.5);
  assert.equal(summary.bytes, 15);
  assert.equal(summary.totalMs.p95, 300);
});

const metrics = (totalP95, errorRate = 0) => ({
  count: 10,
  errors: 0,
  errorRate,
  bytes: 1000,
  totalMs: { min: 1, max: totalP95, avg: totalP95, p50: totalP95, p95: totalP95, p99: totalP95 },
  ttfbMs: { min: 1, max: 10, avg: 10, p50: 10, p95: 10, p99: 10 },
});

const runShape = (id, documentP95, assetP95 = 50) => ({
  id,
  startedAt: '2026-11-12T08:00:00.000Z',
  config: {
    vus: 2,
    iterations: 1,
    loadAssets: true,
    pages: [{ name: 'homepage', path: '/' }],
    compare: { p95RegressionPct: 25, ttfbP95RegressionPct: 25, errorRateIncreasePct: 1 },
  },
  summary: {
    pages: [
      {
        name: 'homepage',
        path: '/',
        document: metrics(documentP95),
        assets: metrics(assetP95),
      },
    ],
  },
});

test('the first run is a baseline and a slower p95 is a regression', () => {
  const thresholds = { p95RegressionPct: 25, ttfbP95RegressionPct: 25, errorRateIncreasePct: 1 };
  const baseline = compareRuns(runShape('current', 100), null, thresholds);
  assert.equal(baseline.previousId, null);
  assert.equal(baseline.regressions.length, 0);

  const compared = compareRuns(runShape('current', 140, 80), runShape('previous', 100, 50), thresholds);
  assert.equal(compared.previousId, 'previous');
  assert.deepEqual(
    compared.regressions.map((item) => `${item.scope} ${item.metric}`),
    ['document total p95', 'assets total p95'],
  );
});

test('a profile sets the load and the page comes from the argument', async () => {
  const config = await loadConfig({
    configPath: path.join(root, 'config.json'),
    argv: ['--', '--profile', 'light', '--page', 'https://dev.example.com/holidays', '--no-assets', '--vus', '3'],
    env: {},
  });
  assert.equal(config.profile, 'light');
  assert.equal(config.vus, 3);
  assert.equal(config.baseUrl, 'https://dev.example.com');
  assert.equal(config.acceptLanguage, 'en-US,en;q=0.9');
  assert.equal(config.compare.p95RegressionPct, 20);
  assert.equal(config.compare.errorRateIncreasePct, 1);
  assert.equal(config.authorization, undefined);
  assert.equal(config.rps, 0.5);
  assert.equal(config.durationSec, 30);
  assert.equal(config.thinkTimeMs, 1000);
  assert.equal(config.assetConcurrency, 6);
  assert.equal(config.loadAssets, false);
  assert.deepEqual(config.pages, [
    {
      name: 'holidays',
      path: '/holidays',
      url: 'https://dev.example.com/holidays',
      origin: 'https://dev.example.com',
    },
  ]);

  const heavy = await loadConfig({
    configPath: path.join(root, 'config.json'),
    argv: ['--profile', 'heavy', '--page', 'https://dev.example.com/'],
    env: {},
  });
  assert.equal(heavy.profile, 'heavy');
  assert.equal(heavy.vus, 10);
  assert.equal(heavy.rps, 2);
  assert.equal(heavy.loadAssets, true);

  const disaster = await loadConfig({
    configPath: path.join(root, 'config.json'),
    argv: ['--profile', 'disaster', '--page', 'https://dev.example.com/'],
    env: {},
  });
  assert.equal(disaster.profile, 'disaster');
  assert.equal(disaster.vus, 100);
  assert.equal(disaster.rps, 20);
  assert.equal(disaster.durationSec, 60);
  assert.equal(disaster.thinkTimeMs, 0);
  assert.equal(disaster.timeoutMs, 60000);
  assert.equal(disaster.assetConcurrency, 24);
  assert.deepEqual(heavy.pages, [
    {
      name: 'homepage',
      path: '/',
      url: 'https://dev.example.com/',
      origin: 'https://dev.example.com',
    },
  ]);

  await assert.rejects(
    () => loadConfig({ configPath: path.join(root, 'config.json'), argv: ['--profile', 'light'], env: {} }),
    /--page/,
  );
  await assert.rejects(
    () => loadConfig({ configPath: path.join(root, 'config.json'), argv: ['--profile', 'light', '--page', 'holidays'], env: {} }),
    /full URL/,
  );
});

test('a production host named in the interview is refused', () => {
  assert.equal(productionHostBlocked('www.example.com', ['www.example.com', 'example.com']), true);
  assert.equal(productionHostBlocked('dev.example.com', ['https://www.example.com/']), false);
  assert.equal(productionHostBlocked('WWW.Example.com', ['https://www.example.com']), true);
});

test('page load count follows the profile rate and duration', () => {
  assert.equal(pageLoadCount(0.2, 20_000), 4);
  assert.equal(pageLoadCount(1, 30_000), 30);
  assert.equal(pageLoadCount(4, 60_000), 240);
  assert.equal(pageLoadCount(20, 60_000), 1200);
});

test('saved runs are compared only with the same profile and settings', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'load-test-'));
  const summary = summarizeRun(
    [
      {
        page: 'homepage',
        kind: 'document',
        totalMs: 120,
        ttfbMs: 40,
        bytes: 50,
        error: null,
        discovered: 2,
      },
    ],
    [{ name: 'homepage', path: '/' }],
    1000,
  );
  assert.equal(summary.rps, 1);
  assert.equal(summary.pageRps, 1);
  const light = {
    id: '20261112T080000000Z',
    startedAt: '2026-11-12T08:00:00.000Z',
    wallMs: 1000,
    config: {
      profile: 'light',
      baseUrl: 'https://dev.example.com',
      vus: 2,
      rps: 0.5,
      durationMs: 30000,
      thinkTimeMs: 1000,
      timeoutMs: 30000,
      loadAssets: true,
      assetConcurrency: 6,
      pages: [{ name: 'homepage', path: '/' }],
    },
    summary,
    samples: [],
  };
  const heavy = {
    ...light,
    id: '20261112T080100000Z',
    startedAt: '2026-11-12T08:01:00.000Z',
    config: { ...light.config, profile: 'heavy', vus: 10, rps: 2, durationMs: 45000, thinkTimeMs: 200, timeoutMs: 45000, assetConcurrency: 16 },
  };
  await saveRun(dir, light, '<p>light</p>');
  await saveRun(dir, heavy, '<p>heavy</p>');

  const previous = await readPreviousRun(dir, light.config);
  assert.equal(previous.id, light.id);
  assert.equal(previous.summary.pages[0].document.totalMs.p95, 120);
  const html = await readFile(path.join(dir, 'latest.html'), 'utf8');
  assert.match(html, /heavy/);
});
