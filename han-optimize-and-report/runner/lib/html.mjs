const TAG = /<(script|link|img)\b[^>]*>/gi;

const decodeEntities = (value) => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"');

const readAttributes = (tag) => {
  const attributes = {};
  for (const match of tag.matchAll(/([^\s=]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) {
    attributes[match[1].toLowerCase()] = match[3] ?? match[4] ?? '';
  }
  return attributes;
};

const relTokens = (rel = '') => rel.toLowerCase().split(/\s+/).filter(Boolean);

const kindFor = (element, attributes) => {
  if (element === 'script') return attributes.src ? 'script' : null;
  if (element === 'img') return attributes.src ? 'image' : null;

  const rel = relTokens(attributes.rel);
  const as = (attributes.as || '').toLowerCase();
  if (rel.includes('stylesheet')) return 'style';
  if (rel.includes('modulepreload')) return 'script';
  if (rel.includes('preload') && as === 'script') return 'script';
  if (rel.includes('preload') && as === 'style') return 'style';
  if (rel.includes('preload') && (as === 'image' || as === 'font')) return as === 'font' ? 'font' : 'image';
  if (rel.includes('icon')) return 'image';
  return null;
};

const sameOrigin = (raw, page) => {
  if (!raw || /^(data:|blob:|javascript:)/i.test(raw)) return null;
  try {
    const url = new URL(raw, page);
    if (url.origin !== page.origin) return null;
    url.hash = '';
    return url.href;
  } catch {
    return null;
  }
};

export const extractAssets = (html, pageUrl) => {
  const page = new URL(pageUrl);
  const seen = new Set();
  const assets = [];

  for (const match of html.matchAll(TAG)) {
    const attributes = readAttributes(match[0]);
    const element = match[1].toLowerCase();
    const kind = kindFor(element, attributes);
    const raw = element === 'link' ? attributes.href : attributes.src;
    if (!kind || !raw) continue;

    const url = sameOrigin(decodeEntities(raw), page);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    assets.push({ url, kind });
  }

  return assets;
};
