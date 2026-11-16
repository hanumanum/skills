import { readFile } from 'node:fs/promises';
import path from 'node:path';

const CHROME_UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export const HELP = `Browser-like load test for one page on a deployed site.

  node tests/load-tests/run.mjs --profile normal --page https://dev.example.com/
  node tests/load-tests/run.mjs --profile heavy --page https://dev.example.com/guide --no-assets

Profiles (users, page loads per second, duration, think time, timeout, asset parallelism):
  lightest, light, normal, heavy, superheavy, disaster

The page is always passed with --page. Asset loading is a separate flag and is on unless you pass --no-assets.

Options:
  --profile <name>           Load profile. Required.
  --page <url>              Full page URL, including https://. Required.
  --assets                   Load same-origin CSS, JS, and images. This is the default.
  --no-assets                Request the HTML document only.
  --config <file>            Config file. Default is tests/load-tests/config.json.
  --base-url <url>           Optional. When set, it must match the origin of --page.
  --vus <n>                  Override concurrent users.
  --rps <n>                  Override page loads per second.
  --duration <sec>           Override how long new page loads are started.
  --think-time <ms>          Override the pause after a page load.
  --timeout <ms>             Override the per-request timeout.
  --asset-concurrency <n>    Override parallel assets per user.
  --fail-on-regression       Exit 2 when a threshold is exceeded.

Environment overrides: LOAD_PROFILE, LOAD_PAGE, LOAD_BASE_URL, LOAD_VUS, LOAD_RPS, LOAD_DURATION,
LOAD_THINK_TIME, LOAD_TIMEOUT, LOAD_ASSET_CONCURRENCY, LOAD_ASSETS, LOAD_FAIL_ON_REGRESSION.
`;

const parseArgs = (argv) => {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--') continue;
    if (token === '--help' || token === '-h') {
      out.help = true;
      continue;
    }
    if (token === '--assets') {
      out.loadAssets = true;
      continue;
    }
    if (token === '--no-assets') {
      out.loadAssets = false;
      continue;
    }
    if (token === '--fail-on-regression') {
      out.failOnRegression = true;
      continue;
    }
    if (!token.startsWith('--')) {
      throw new Error(`Unexpected argument "${token}". Run with --help.`);
    }
    const key = token.slice(2);
    const value = argv[i + 1];
    if (value == null || value.startsWith('--')) throw new Error(`Missing value for --${key}`);
    const known = ['config', 'base-url', 'profile', 'page', 'vus', 'rps', 'duration', 'think-time', 'timeout', 'asset-concurrency'];
    if (!known.includes(key)) throw new Error(`Unknown option --${key}`);
    out[key] = value;
    i += 1;
  }
  return out;
};

const optionalInt = (value, label) => {
  if (value == null || value === '') return undefined;
  const number = Number(value);
  if (!Number.isInteger(number)) throw new Error(`${label} must be an integer`);
  return number;
};

const optionalNumber = (value, label) => {
  if (value == null || value === '') return undefined;
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`${label} must be a number`);
  return number;
};

const optionalBool = (value, label) => {
  if (value == null || value === '') return undefined;
  const normalized = String(value).toLowerCase();
  if (['1', 'true', 'yes'].includes(normalized)) return true;
  if (['0', 'false', 'no'].includes(normalized)) return false;
  throw new Error(`${label} must be true or false`);
};

const pick = (...values) => values.find((value) => value !== undefined);

const requireInt = (value, label, min) => {
  if (!Number.isInteger(value) || value < min) {
    throw new Error(`${label} must be an integer of at least ${min}`);
  }
  return value;
};

const requireNumber = (value, label, min) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min) {
    throw new Error(`${label} must be a number of at least ${min}`);
  }
  return value;
};

const requirePositive = (value, label) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a number greater than 0`);
  }
  return value;
};

const pageFromUrl = (value) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('Pass the page with --page https://host/path');
  }
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error('--page must be a full URL, for example https://dev.example.com/');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('--page must be an http or https URL');
  }
  url.hash = '';
  const trimmed = url.pathname.replace(/^\/+|\/+$/g, '');
  const name = trimmed === '' ? 'homepage' : trimmed.replaceAll('/', '-');
  return {
    name,
    path: `${url.pathname}${url.search}`,
    url: url.href,
    origin: url.origin,
  };
};

const normalizeProfile = (name, profile) => {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
    throw new Error(`Profile "${name}" must be an object`);
  }
  return {
    vus: requireInt(profile.vus, `${name}.vus`, 1),
    rps: requirePositive(profile.rps, `${name}.rps`),
    durationSec: requireInt(profile.durationSec, `${name}.durationSec`, 1),
    thinkTimeMs: requireInt(profile.thinkTimeMs, `${name}.thinkTimeMs`, 0),
    timeoutMs: requireInt(profile.timeoutMs, `${name}.timeoutMs`, 1000),
    assetConcurrency: requireInt(profile.assetConcurrency, `${name}.assetConcurrency`, 1),
  };
};

const normalizeBaseUrl = (value) => {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('bad protocol');
    return url.origin;
  } catch {
    throw new Error(`Invalid baseUrl: ${value}`);
  }
};

export const loadConfig = async ({ configPath, argv = [], env = {} }) => {
  const args = parseArgs(argv);
  if (args.help) return { help: true };

  const selectedPath = args.config ? path.resolve(args.config) : configPath;
  let file;
  try {
    file = JSON.parse(await readFile(selectedPath, 'utf8'));
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error(`Config file is not valid JSON: ${selectedPath}`);
    throw new Error(`Cannot read config file ${selectedPath}`);
  }

  const compare = file.compare ?? {};
  const profiles = file.profiles;
  if (!profiles || typeof profiles !== 'object' || Array.isArray(profiles)) {
    throw new Error('config.profiles must define lightest, light, normal, heavy, superheavy, and disaster');
  }
  const available = Object.keys(profiles);
  for (const name of available) normalizeProfile(name, profiles[name]);

  const requested = pick(args.profile, env.LOAD_PROFILE);
  if (!requested) {
    throw new Error(`Pass --profile with one of: ${available.join(', ')}`);
  }
  const profile = profiles[requested];
  if (!profile) throw new Error(`Unknown profile "${requested}". Use one of: ${available.join(', ')}`);
  const selected = normalizeProfile(requested, profile);

  const durationSec = requireInt(
    pick(optionalInt(args.duration, '--duration'), optionalInt(env.LOAD_DURATION, 'LOAD_DURATION'), selected.durationSec),
    'duration',
    1,
  );

  const page = pageFromUrl(pick(args.page, env.LOAD_PAGE));
  const requestedBase = pick(args['base-url'], env.LOAD_BASE_URL);
  if (requestedBase && normalizeBaseUrl(requestedBase) !== page.origin) {
    throw new Error('--base-url must match the origin of --page');
  }

  return {
    help: false,
    configPath: selectedPath,
    profile: requested,
    baseUrl: page.origin,
    vus: requireInt(pick(optionalInt(args.vus, '--vus'), optionalInt(env.LOAD_VUS, 'LOAD_VUS'), selected.vus), 'vus', 1),
    rps: requirePositive(pick(optionalNumber(args.rps, '--rps'), optionalNumber(env.LOAD_RPS, 'LOAD_RPS'), selected.rps), 'rps'),
    durationSec,
    durationMs: durationSec * 1000,
    thinkTimeMs: requireInt(
      pick(optionalInt(args['think-time'], '--think-time'), optionalInt(env.LOAD_THINK_TIME, 'LOAD_THINK_TIME'), selected.thinkTimeMs),
      'thinkTimeMs',
      0,
    ),
    timeoutMs: requireInt(
      pick(optionalInt(args.timeout, '--timeout'), optionalInt(env.LOAD_TIMEOUT, 'LOAD_TIMEOUT'), selected.timeoutMs),
      'timeoutMs',
      1000,
    ),
    loadAssets: pick(args.loadAssets, optionalBool(env.LOAD_ASSETS, 'LOAD_ASSETS'), true),
    assetConcurrency: requireInt(
      pick(
        optionalInt(args['asset-concurrency'], '--asset-concurrency'),
        optionalInt(env.LOAD_ASSET_CONCURRENCY, 'LOAD_ASSET_CONCURRENCY'),
        selected.assetConcurrency,
      ),
      'assetConcurrency',
      1,
    ),
    userAgent: file.userAgent || CHROME_UA,
    acceptLanguage: file.acceptLanguage || 'en-US,en;q=0.9',
    pages: [page],
    compare: {
      failOnRegression: Boolean(
        pick(args.failOnRegression, optionalBool(env.LOAD_FAIL_ON_REGRESSION, 'LOAD_FAIL_ON_REGRESSION'), compare.failOnRegression, false),
      ),
      p95RegressionPct: requireNumber(compare.p95RegressionPct ?? 20, 'compare.p95RegressionPct', 0),
      ttfbP95RegressionPct: requireNumber(compare.ttfbP95RegressionPct ?? 20, 'compare.ttfbP95RegressionPct', 0),
      errorRateIncreasePct: requireNumber(compare.errorRateIncreasePct ?? 1, 'compare.errorRateIncreasePct', 0),
    },
  };
};
