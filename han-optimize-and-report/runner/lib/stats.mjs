export const round = (value) => Math.round(value * 10) / 10;

export const percentile = (sorted, p) => {
  if (sorted.length === 0) return null;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
};

const distribution = (values) => {
  if (values.length === 0) {
    return { min: null, max: null, avg: null, p50: null, p95: null, p99: null };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((total, value) => total + value, 0);
  return {
    min: round(sorted[0]),
    max: round(sorted.at(-1)),
    avg: round(sum / sorted.length),
    p50: round(percentile(sorted, 50)),
    p95: round(percentile(sorted, 95)),
    p99: round(percentile(sorted, 99)),
  };
};

export const summarize = (samples) => {
  const errors = samples.filter((sample) => sample.error).length;
  return {
    count: samples.length,
    errors,
    errorRate: samples.length === 0 ? 0 : errors / samples.length,
    bytes: samples.reduce((total, sample) => total + sample.bytes, 0),
    totalMs: distribution(samples.map((sample) => sample.totalMs)),
    ttfbMs: distribution(samples.map((sample) => sample.ttfbMs)),
  };
};

export const summarizeRun = (samples, pages, wallMs) => {
  const pagesSummary = pages.map((page) => {
    const pageSamples = samples.filter((sample) => sample.page === page.name);
    const documents = pageSamples.filter((sample) => sample.kind === 'document');
    const assets = pageSamples.filter((sample) => sample.kind !== 'document');
    const grouped = {};
    for (const sample of assets) {
      grouped[sample.kind] ??= [];
      grouped[sample.kind].push(sample);
    }
    const discovered = documents.map((sample) => sample.discovered ?? 0);
    return {
      name: page.name,
      path: page.path,
      assetsDiscovered: discovered.length === 0 ? 0 : Math.round(discovered.reduce((total, value) => total + value, 0) / discovered.length),
      document: summarize(documents),
      assets: {
        ...summarize(assets),
        byKind: Object.fromEntries(Object.entries(grouped).map(([kind, kindSamples]) => [kind, summarize(kindSamples)])),
      },
    };
  });

  const errors = samples.filter((sample) => sample.error).length;
  const documents = samples.filter((sample) => sample.kind === 'document').length;
  const seconds = wallMs / 1000;
  return {
    requests: samples.length,
    errors,
    errorRate: samples.length === 0 ? 0 : errors / samples.length,
    bytes: samples.reduce((total, sample) => total + sample.bytes, 0),
    rps: wallMs > 0 ? round(samples.length / seconds) : 0,
    pageRps: wallMs > 0 ? round(documents / seconds) : 0,
    pages: pagesSummary,
  };
};

const changePct = (current, previous) => {
  if (current == null || previous == null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
};

const pushLatency = (found, { page, scope, metric, current, previous, limit }) => {
  const delta = changePct(current, previous);
  if (delta == null || delta < limit) return;
  found.push({
    page,
    scope,
    metric,
    previous,
    current,
    delta: round(delta),
    limit,
    unit: 'pct',
  });
};

const collectRegressions = (page, scope, current, previous, thresholds) => {
  if (!current || !previous || current.count === 0 || previous.count === 0) return [];
  const found = [];
  pushLatency(found, {
    page,
    scope,
    metric: 'total p95',
    current: current.totalMs.p95,
    previous: previous.totalMs.p95,
    limit: thresholds.p95RegressionPct,
  });
  pushLatency(found, {
    page,
    scope,
    metric: 'ttfb p95',
    current: current.ttfbMs.p95,
    previous: previous.ttfbMs.p95,
    limit: thresholds.ttfbP95RegressionPct,
  });
  const errorIncrease = (current.errorRate - previous.errorRate) * 100;
  if (errorIncrease >= thresholds.errorRateIncreasePct) {
    found.push({
      page,
      scope,
      metric: 'error rate',
      previous: previous.errorRate,
      current: current.errorRate,
      delta: round(errorIncrease),
      limit: thresholds.errorRateIncreasePct,
      unit: 'pp',
    });
  }
  return found;
};

const sameShape = (current, previous) => sameComparableConfig(current.config, previous.config);

export const comparableConfig = (config = {}) => ({
  profile: config.profile ?? null,
  baseUrl: config.baseUrl ?? null,
  vus: config.vus ?? null,
  rps: config.rps ?? null,
  durationMs: config.durationMs ?? null,
  thinkTimeMs: config.thinkTimeMs ?? null,
  timeoutMs: config.timeoutMs ?? null,
  loadAssets: config.loadAssets ?? null,
  assetConcurrency: config.assetConcurrency ?? null,
  userAgent: config.userAgent ?? null,
  acceptLanguage: config.acceptLanguage ?? null,
  pages: (config.pages ?? []).map((page) => page.url ?? `${page.name} ${page.path}`),
});

export const configKey = (config) => JSON.stringify(comparableConfig(config));

export const sameComparableConfig = (left, right) => configKey(left) === configKey(right);

export const compareRuns = (current, previous, thresholds) => {
  if (!previous) {
    return {
      previousId: null,
      previousStartedAt: null,
      shapeMatches: false,
      notes: ['No earlier run with this profile, page, and load settings. This result is the baseline.'],
      regressions: [],
      pages: [],
    };
  }

  const notes = [];
  if (!sameShape(current, previous)) {
    return {
      previousId: null,
      previousStartedAt: null,
      shapeMatches: false,
      notes: ['The nearest saved run used different settings, so it is not used as a baseline.'],
      regressions: [],
      pages: [],
    };
  }

  const short = current.summary.pages.some((page) => page.document.count > 0 && page.document.count < 10);
  if (short) {
    notes.push('Document samples are under 10, so a percentile move can be ordinary variance.');
  }

  const regressions = [];
  const pages = current.summary.pages.map((page) => {
    const before = previous.summary.pages.find((item) => item.name === page.name);
    if (!before) {
      notes.push(`${page.name} has no baseline yet.`);
      return { name: page.name, baseline: false, previous: null };
    }
    regressions.push(...collectRegressions(page.name, 'document', page.document, before.document, thresholds));
    if (page.assets.count > 0 && before.assets.count > 0) {
      regressions.push(...collectRegressions(page.name, 'assets', page.assets, before.assets, thresholds));
    }
    return {
      name: page.name,
      baseline: true,
      previous: { document: before.document, assets: before.assets },
    };
  });

  return {
    previousId: previous.id,
    previousStartedAt: previous.startedAt,
    shapeMatches: true,
    notes,
    regressions,
    pages,
  };
};
