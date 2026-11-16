import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { configKey } from './stats.mjs';

export const createRunId = (date = new Date()) => date.toISOString().replace(/[-:]/g, '').replace('.', '');

const indexPath = (resultsDir) => path.join(resultsDir, 'index.json');

export const readHistory = async (resultsDir) => {
  try {
    const data = JSON.parse(await readFile(indexPath(resultsDir), 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const readPreviousRun = async (resultsDir, config) => {
  const history = await readHistory(resultsDir);
  const wanted = config ? configKey(config) : null;
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const entry = history[index];
    let run;
    try {
      run = JSON.parse(await readFile(path.join(resultsDir, 'runs', `${entry.id}.json`), 'utf8'));
    } catch {
      continue;
    }
    if (!wanted || configKey(run.config) === wanted) return run;
  }
  return null;
};

export const historyEntry = (run) => ({
  id: run.id,
  startedAt: run.startedAt,
  wallMs: run.wallMs,
  configKey: configKey(run.config),
  profile: run.config.profile,
  vus: run.config.vus,
  rps: run.config.rps,
  durationMs: run.config.durationMs,
  loadAssets: run.config.loadAssets,
  requests: run.summary.requests,
  errors: run.summary.errors,
  pages: Object.fromEntries(
    run.summary.pages.map((page) => [
      page.name,
      {
        documentP95: page.document.totalMs.p95,
        documentTtfbP95: page.document.ttfbMs.p95,
        documentErrors: page.document.errors,
        documentCount: page.document.count,
        assetP95: page.assets.totalMs.p95,
        assetErrors: page.assets.errors,
        assetCount: page.assets.count,
      },
    ]),
  ),
});

export const saveRun = async (resultsDir, run, html) => {
  const runsDir = path.join(resultsDir, 'runs');
  await mkdir(runsDir, { recursive: true });
  const json = JSON.stringify(run, null, 2);
  await writeFile(path.join(runsDir, `${run.id}.json`), json);
  await writeFile(path.join(runsDir, `${run.id}.html`), html);
  await writeFile(path.join(resultsDir, 'latest.json'), json);
  await writeFile(path.join(resultsDir, 'latest.html'), html);
  const history = [...(await readHistory(resultsDir)), historyEntry(run)];
  await writeFile(indexPath(resultsDir), JSON.stringify(history, null, 2));
  return {
    jsonPath: path.join(runsDir, `${run.id}.json`),
    htmlPath: path.join(runsDir, `${run.id}.html`),
    latestHtml: path.join(resultsDir, 'latest.html'),
  };
};
