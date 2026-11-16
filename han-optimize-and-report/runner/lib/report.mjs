import { configKey } from './stats.mjs';

const escapeHtml = (value) =>
  String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

export const formatMs = (value) => {
  if (value == null) return '—';
  return `${value < 100 ? value.toFixed(1) : value.toFixed(0)} ms`;
};

export const formatBytes = (bytes) => {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatRate = (rate) => `${(rate * 100).toFixed(1)}%`;

const formatDelta = (current, previous, kind) => {
  if (current == null || previous == null) return '—';
  if (kind === 'pp') {
    const delta = (current - previous) * 100;
    return `${delta > 0 ? '+' : ''}${delta.toFixed(1)} pp`;
  }
  if (kind === 'count') {
    const delta = current - previous;
    return `${delta > 0 ? '+' : ''}${delta}`;
  }
  if (previous === 0) return '—';
  const delta = ((current - previous) / previous) * 100;
  return `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`;
};

const previousPage = (run, name) => run.comparison.pages.find((page) => page.name === name)?.previous ?? null;

const regressionFor = (run, page, scope, metric) =>
  run.comparison.regressions.find((item) => item.page === page && item.scope === scope && item.metric === metric);

const show = (value) => (value == null ? '—' : String(value));

const rowsFor = (current, previous) => [
  ['Requests', show(current.count), show(previous?.count), 'count', null],
  ['Errors', show(current.errors), show(previous?.errors), 'count', null],
  ['Error rate', formatRate(current.errorRate), previous ? formatRate(previous.errorRate) : '—', 'pp', 'error rate'],
  ['TTFB p50', formatMs(current.ttfbMs.p50), formatMs(previous?.ttfbMs.p50), 'pct', null],
  ['TTFB p95', formatMs(current.ttfbMs.p95), formatMs(previous?.ttfbMs.p95), 'pct', 'ttfb p95'],
  ['Total p50', formatMs(current.totalMs.p50), formatMs(previous?.totalMs.p50), 'pct', null],
  ['Total p95', formatMs(current.totalMs.p95), formatMs(previous?.totalMs.p95), 'pct', 'total p95'],
  ['Total p99', formatMs(current.totalMs.p99), formatMs(previous?.totalMs.p99), 'pct', null],
  ['Decoded total', formatBytes(current.bytes), previous ? formatBytes(previous.bytes) : '—', 'pct', null],
];

const deltaValue = (kind, currentMetrics, previousMetrics, label) => {
  if (!previousMetrics) return '—';
  if (kind === 'pp') return formatDelta(currentMetrics.errorRate, previousMetrics.errorRate, 'pp');
  if (label === 'Requests') return formatDelta(currentMetrics.count, previousMetrics.count, 'count');
  if (label === 'Errors') return formatDelta(currentMetrics.errors, previousMetrics.errors, 'count');
  if (label === 'TTFB p50') return formatDelta(currentMetrics.ttfbMs.p50, previousMetrics.ttfbMs.p50, 'pct');
  if (label === 'TTFB p95') return formatDelta(currentMetrics.ttfbMs.p95, previousMetrics.ttfbMs.p95, 'pct');
  if (label === 'Total p50') return formatDelta(currentMetrics.totalMs.p50, previousMetrics.totalMs.p50, 'pct');
  if (label === 'Total p95') return formatDelta(currentMetrics.totalMs.p95, previousMetrics.totalMs.p95, 'pct');
  if (label === 'Total p99') return formatDelta(currentMetrics.totalMs.p99, previousMetrics.totalMs.p99, 'pct');
  if (label === 'Decoded total') return formatDelta(currentMetrics.bytes, previousMetrics.bytes, 'pct');
  return '—';
};

const pad = (value, width) => String(value).padEnd(width);

const textTable = (run, page, scope, current) => {
  const previous = previousPage(run, page.name)?.[scope] ?? null;
  const header = `${pad('Metric', 16)}${pad('Current', 16)}${pad('Previous', 16)}Change`;
  const lines = [header];
  for (const [label, currentText, previousText, kind, metric] of rowsFor(current, previous)) {
    const change = deltaValue(kind, current, previous, label);
    const mark = metric && regressionFor(run, page.name, scope, metric) ? '  regression' : '';
    lines.push(`${pad(label, 16)}${pad(currentText, 16)}${pad(previousText, 16)}${change}${mark}`);
  }
  return lines.join('\n');
};

const kindLine = (assets) => {
  const parts = Object.entries(assets.byKind).map(([kind, metrics]) => `${kind} ${metrics.count} (p95 ${formatMs(metrics.totalMs.p95)})`);
  return parts.length === 0 ? '' : `${parts.join(' · ')} (all views)`;
};

export const renderText = (run) => {
  const lines = [
    `Load test ${run.id}`,
    `${run.config.profile}  ·  ${run.config.pages[0]?.url ?? run.config.baseUrl}  ·  ${run.config.vus} users  ·  ${run.config.rps} page loads/s target  ·  ${run.summary.pageRps} achieved  ·  ${run.config.durationSec}s  ·  ${run.wallMs} ms`,
    `Requests ${run.summary.requests}  ·  errors ${run.summary.errors}  ·  ${run.summary.rps} req/s  ·  ${formatBytes(run.summary.bytes)} decoded`,
    '',
  ];
  if (run.skipped > 0) {
    lines.push(`${run.skipped} page loads were not started because every user was busy.`, '');
  }

  if (run.comparison.regressions.length === 0) {
    lines.push(run.comparison.previousId ? `Comparison: within limits of ${run.comparison.previousId}` : 'Comparison: baseline saved for this profile and settings');
  } else {
    lines.push('Regressions:');
    for (const item of run.comparison.regressions) {
      const unit = item.unit === 'pp' ? 'pp' : '%';
      lines.push(`  ${item.page} ${item.scope} ${item.metric}: ${item.previous} → ${item.current} (${item.delta > 0 ? '+' : ''}${item.delta} ${unit}, limit ${item.limit})`);
    }
  }
  for (const note of run.comparison.notes) lines.push(note);

  for (const page of run.summary.pages) {
    lines.push('', `${page.name}  ${page.url ?? page.path}`);
    if (run.config.loadAssets) lines.push(`Same-origin assets per view: ${page.assetsDiscovered}`);
    lines.push('', 'Document', textTable(run, page, 'document', page.document));
    if (run.config.loadAssets) {
      lines.push('', 'Assets', textTable(run, page, 'assets', page.assets));
      if (kindLine(page.assets)) lines.push(kindLine(page.assets));
    }
  }

  const failures = run.samples.filter((sample) => sample.error);
  if (failures.length > 0) {
    lines.push('', 'Failures:');
    for (const sample of failures.slice(0, 20)) {
      lines.push(`  ${sample.status || 'ERR'}  ${sample.kind}  ${sample.error}  ${sample.url}`);
    }
    if (failures.length > 20) lines.push(`  … ${failures.length - 20} more in the JSON result`);
  }

  lines.push(
    '',
    `Limits: total p95 +${run.config.compare.p95RegressionPct}%, TTFB p95 +${run.config.compare.ttfbP95RegressionPct}%, error rate +${run.config.compare.errorRateIncreasePct} percentage point.`,
  );
  return lines.join('\n');
};

const htmlTable = (run, page, scope, current) => {
  const previous = previousPage(run, page.name)?.[scope] ?? null;
  const body = rowsFor(current, previous)
    .map(([label, currentText, previousText, kind, metric]) => {
      const change = deltaValue(kind, current, previous, label);
      const failed = metric && regressionFor(run, page.name, scope, metric);
      const improved = change.startsWith('-');
      const cls = failed ? 'bad' : improved ? 'good' : '';
      return `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(currentText)}</td><td>${escapeHtml(previousText)}</td><td class="${cls}">${escapeHtml(change)}</td></tr>`;
    })
    .join('');
  return `<table><thead><tr><th>Metric</th><th>Current</th><th>Previous</th><th>Change</th></tr></thead><tbody>${body}</tbody></table>`;
};

const historyHtml = (run, history) => {
  const key = configKey(run.config);
  const rows = history
    .filter((entry) => entry.configKey === key)
    .slice(-12)
    .flatMap((entry) =>
      Object.entries(entry.pages).map(([name, metrics]) => ({
        id: entry.id,
        name,
        p95: metrics.documentP95,
        errors: metrics.documentErrors,
      })),
    );
  if (rows.length === 0) return '';
  const max = Math.max(...rows.map((row) => row.p95 ?? 0), 1);
  const body = rows
    .map((row) => {
      const width = Math.max(2, Math.round(((row.p95 ?? 0) / max) * 100));
      return `<tr><td>${escapeHtml(row.id)}</td><td>${escapeHtml(row.name)}</td><td><span class="bar" style="width:${width}%">${escapeHtml(formatMs(row.p95))}</span></td><td>${row.errors}</td></tr>`;
    })
    .join('');
  return `<h2>Recent document p95 for this setup</h2><table><thead><tr><th>Run</th><th>Page</th><th>p95</th><th>Errors</th></tr></thead><tbody>${body}</tbody></table>`;
};

export const renderHtml = (run, history) => {
  const regressions =
    run.comparison.regressions.length === 0
      ? `<p class="good">${run.comparison.previousId ? `Within the limits of ${escapeHtml(run.comparison.previousId)}.` : 'Baseline saved for this profile, page, and load settings. The next matching run compares against this one.'}</p>`
      : `<ul class="bad">${run.comparison.regressions
          .map((item) => {
            const unit = item.unit === 'pp' ? 'pp' : '%';
            return `<li>${escapeHtml(item.page)} ${escapeHtml(item.scope)} ${escapeHtml(item.metric)}: ${escapeHtml(item.previous)} → ${escapeHtml(item.current)} (${item.delta > 0 ? '+' : ''}${item.delta} ${unit}, limit ${item.limit})</li>`;
          })
          .join('')}</ul>`;

  const pages = run.summary.pages
    .map((page) => {
      const kinds = kindLine(page.assets);
        return `<section><h2>${escapeHtml(page.name)} <span class="muted">${escapeHtml(page.url ?? page.path)}</span></h2>
        ${run.config.loadAssets ? `<p class="muted">${page.assetsDiscovered} same-origin assets per view. Third-party fonts and tag manager are skipped.</p>` : ''}
        <h3>Document</h3>${htmlTable(run, page, 'document', page.document)}
        ${run.config.loadAssets ? `<h3>Assets</h3>${htmlTable(run, page, 'assets', page.assets)}${kinds ? `<p class="muted">${escapeHtml(kinds)}</p>` : ''}` : ''}
      </section>`;
    })
    .join('');

  const failures = run.samples.filter((sample) => sample.error);
  const failureHtml =
    failures.length === 0
      ? ''
      : `<h2>Failures</h2><table><thead><tr><th>Status</th><th>Kind</th><th>Error</th><th>URL</th></tr></thead><tbody>${failures
          .slice(0, 30)
          .map(
            (sample) =>
              `<tr><td>${sample.status || 'ERR'}</td><td>${escapeHtml(sample.kind)}</td><td>${escapeHtml(sample.error)}</td><td>${escapeHtml(sample.url)}</td></tr>`,
          )
          .join('')}</tbody></table>`;

  const notes = run.comparison.notes.map((note) => `<p class="muted">${escapeHtml(note)}</p>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Load test ${escapeHtml(run.id)}</title>
  <style>
    body { margin: 32px auto; max-width: 980px; color: #1a1a1a; font: 15px/1.5 ui-sans-serif, system-ui, sans-serif; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    h2 { font-size: 18px; margin-top: 28px; }
    table { border-collapse: collapse; width: 100%; margin: 8px 0 16px; }
    th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e6e6e6; vertical-align: top; }
    th { font-size: 13px; color: #444; }
    .bad { color: #9b1c1c; font-weight: 600; }
    .good { color: #0f6b3c; }
    .muted { color: #555; }
    .bar { display: inline-block; min-width: 72px; background: #d9e7f5; padding: 2px 8px; }
    code { font-size: 13px; }
  </style>
</head>
<body>
  <h1>Load test ${escapeHtml(run.id)}</h1>
  <p class="muted">${escapeHtml(run.config.profile)} · ${escapeHtml(run.config.pages[0]?.url ?? run.config.baseUrl)} · ${run.config.vus} users · ${run.config.rps} page loads/s target · ${run.summary.pageRps} achieved · ${run.config.durationSec}s · ${run.wallMs} ms wall time<br>
  ${run.summary.requests} requests · ${run.summary.errors} errors · ${run.summary.rps} req/s · ${escapeHtml(formatBytes(run.summary.bytes))} decoded${run.skipped > 0 ? `<br>${run.skipped} page loads were not started because every user was busy.` : ''}</p>
  <h2>Comparison</h2>
  ${regressions}
  ${notes}
  <p class="muted">Limits: total p95 +${run.config.compare.p95RegressionPct}%, TTFB p95 +${run.config.compare.ttfbP95RegressionPct}%, error rate +${run.config.compare.errorRateIncreasePct} percentage point. Each user sends a Chrome document request, then loads the same-origin files from that HTML on one connection.</p>
  ${pages}
  ${failureHtml}
  ${historyHtml(run, history)}
</body>
</html>`;
};
