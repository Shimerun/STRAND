import { loadEnv } from 'vite';
import { site } from '../src/data/site.js';

const THEME_COLOR = '#0A0A0A';
const LOCALE = 'uk_UA';
const PRICE_RANGE = '₴₴';
const WEEKDAYS = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
};

const escapeHtml = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const meta = (key, name, content) => `<meta ${key}="${name}" content="${escapeHtml(content)}" />`;

// "S" on the page background until site.images.favicon points at a real file.
function placeholderFavicon() {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="${THEME_COLOR}"/>` +
    `<text x="16" y="22" font-family="Montserrat,Arial,sans-serif" font-size="18" font-weight="800" fill="#F2F2F2" text-anchor="middle">${site.name[0]}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// Days with identical hours share one entry; closed (null) days are left out.
function openingHours() {
  const groups = new Map();
  Object.entries(WEEKDAYS).forEach(([key, day]) => {
    const hours = site.hours[key];
    if (!hours) return;
    const id = `${hours.open}-${hours.close}`;
    if (!groups.has(id)) groups.set(id, { '@type': 'OpeningHoursSpecification', dayOfWeek: [], opens: hours.open, closes: hours.close });
    groups.get(id).dayOfWeek.push(day);
  });
  return [...groups.values()];
}

function assetUrl(path, baseUrl) {
  return `${baseUrl}${path.replace(/^\/+/, '')}`;
}

function jsonLd(siteUrl, baseUrl) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BarberShop',
    name: site.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.addressShort,
      addressLocality: site.city,
      postalCode: site.postalCode,
      addressCountry: 'UA',
    },
    geo: { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lng },
    telephone: site.phone,
    priceRange: PRICE_RANGE,
    openingHoursSpecification: openingHours(),
  };
  if (siteUrl) {
    data.url = `${siteUrl}/`;
    data.image = `${siteUrl}${site.images.og}`;
  }
  const sameAs = Object.values(site.social).filter(Boolean);
  if (sameAs.length) data.sameAs = sameAs;
  // "<" escaped so no string in site.js can close the script tag.
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

function headTags(siteUrl, baseUrl) {
  const { title, description } = site.seo;
  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    meta('name', 'description', description),
    meta('name', 'theme-color', THEME_COLOR),
    `<link rel="icon" href="${escapeHtml(site.images.favicon ? assetUrl(site.images.favicon, baseUrl) : placeholderFavicon())}" />`,
    meta('property', 'og:type', 'website'),
    meta('property', 'og:locale', LOCALE),
    meta('property', 'og:title', title),
    meta('property', 'og:description', description),
  ];
  if (siteUrl) {
    tags.push(
      `<link rel="canonical" href="${escapeHtml(`${siteUrl}/`)}" />`,
      meta('property', 'og:url', `${siteUrl}/`),
      meta('property', 'og:image', `${siteUrl}${site.images.og}`),
    );
  }
  if (site.images.hero) {
    tags.push(`<link rel="preload" as="image" href="${escapeHtml(assetUrl(site.images.hero, baseUrl))}" fetchpriority="high" />`);
  }
  tags.push(jsonLd(siteUrl, baseUrl));
  return tags.map((tag) => `    ${tag}`).join('\n');
}

function readSiteUrl(raw) {
  if (!raw) return '';
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`[site-meta] VITE_SITE_URL is not a valid URL: "${raw}"`);
  }
  if (!/^https?:$/.test(url.protocol)) throw new Error(`[site-meta] VITE_SITE_URL must start with http(s)://: "${raw}"`);
  return url.href.replace(/\/+$/, '');
}

/** Head meta, Open Graph, JSON-LD, robots.txt and sitemap.xml, all from src/data/site.js. */
export default function siteMeta() {
  let siteUrl = '';
  let baseUrl = '/';
  let logger = null;

  return {
    name: 'site-meta',
    configResolved(config) {
      logger = config.logger;
      baseUrl = config.base;
      const env = loadEnv(config.mode, config.envDir || config.root, 'VITE_');
      siteUrl = readSiteUrl(env.VITE_SITE_URL);
    },
    transformIndexHtml(html) {
      return html.replace(/\s*<\/head>/, `\n${headTags(siteUrl, baseUrl)}\n  </head>`);
    },
    generateBundle() {
      if (!siteUrl) {
        logger.warn('[site-meta] VITE_SITE_URL is not set: skipped robots.txt, sitemap.xml, canonical and og:image.');
        return;
      }
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
      });
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source:
          '<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
          `  <url><loc>${escapeHtml(`${siteUrl}/`)}</loc></url>\n` +
          '</urlset>\n',
      });
    },
  };
}
