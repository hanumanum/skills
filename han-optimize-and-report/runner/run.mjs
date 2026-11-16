// han-optimize-and-report runner. Stack-agnostic browser-like load test.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { HELP, loadConfig } from './lib/config.mjs';
import { loadSkillEnv } from './lib/env.mjs';
import { productionHostBlocked } from './lib/guard.mjs';
import { renderHtml, renderText } from './lib/report.mjs';
import { runAtRate } from './lib/session.mjs';
import { compareRuns, summarizeRun } from './lib/stats.mjs';
import { createRunId, historyEntry, readHistory, readPreviousRun, saveRun } from './lib/store.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));

const verdict = (samples, comparison, config) => {
  const failed = samples.filter((sample) => sample.error).length;
  if (failed > 0) return { code: 1, label: `failed, ${failed} request(s) errored` };
  if (comparison.regressions.length > 0 && config.compare.failOnRegression) {
    return { code: 2, label: `regression against ${comparison.previousId}` };
  }
  if (comparison.regressions.length > 0) {
    return { code: 0, label: `finished with ${comparison.regressions.length} regression(s)` };
  }
  return { code: 0, label: 'passed' };
};

const readOptimize = async (dir) => {
  try {
    return JSON.parse(await readFile(path.join(dir, '.han-optimize.json'), 'utf8'));
  } catch {
    return {};
  }
};

const main = async () => {
  await loadSkillEnv(root);
  const loaded = await loadConfig({
    configPath: path.join(root, 'config.json'),
    argv: process.argv.slice(2),
    env: process.env,
  });
  if (loaded.help) {
    console.log(HELP);
    return;
  }

  const { configPath, help: _help, ...config } = loaded;
  const optimize = await readOptimize(root);
  const hosts = Array.isArray(optimize.productionHosts) ? optimize.productionHosts : [];
  const pageHost = new URL(config.pages[0].url).hostname;
  if (productionHostBlocked(pageHost, hosts)) {
    throw new Error(`Refusing to load-test production host ${pageHost}`);
  }

  const resultsDir = path.join(root, 'results');
  const previous = await readPreviousRun(resultsDir, config);

  console.log(`Load test  ${config.profile}  ${config.pages[0].url}`);
  console.log(`${config.vus} users · ${config.rps} page loads/s · ${config.durationSec}s`);
  console.log(config.loadAssets ? `Same-origin assets, ${config.assetConcurrency} at a time per user` : 'Document requests only');

  const started = new Date();
  const samplesResult = await runAtRate(config, (count) => {
    if (count === 1 || count % 5 === 0) console.log(`started ${count} page loads`);
  });
  const { samples, skipped } = samplesResult;
  const finished = new Date();
  const wallMs = finished.getTime() - started.getTime();
  const summary = summarizeRun(samples, config.pages, wallMs);
  const comparison = compareRuns({ config, summary }, previous, config.compare);

  const run = {
    id: createRunId(finished),
    startedAt: started.toISOString(),
    finishedAt: finished.toISOString(),
    wallMs,
    config,
    summary,
    comparison,
    skipped,
    samples,
  };
  const history = [...(await readHistory(resultsDir)), historyEntry(run)];
  const html = renderHtml(run, history);
  const saved = await saveRun(resultsDir, run, html);
  const outcome = verdict(samples, comparison, config);

  console.log('');
  console.log(renderText(run));
  console.log('');
  console.log(`Result: ${outcome.label}`);
  console.log(`Report: ${saved.latestHtml}`);
  console.log(`Saved:  ${saved.jsonPath}`);
  if (configPath) console.log(`Config: ${configPath}`);
  process.exitCode = outcome.code;
};

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
