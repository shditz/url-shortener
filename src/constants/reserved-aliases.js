/**
 * Reserved aliases that cannot be claimed by custom aliases
 * to avoid collision with application routes and static assets.
 */
export const RESERVED_ALIASES = new Set([
  'api',
  'health',
  'favicon.ico',
  'static',
  'css',
  'js',
  'assets',
  'public',
  'index.html',
  'robots.txt',
  'sitemap.xml',
  'urls',
]);
