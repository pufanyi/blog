import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareDeploymentAssets } from './lib/deployment-assets.mts';
import { prepareMarkdownWorker } from './lib/markdown-deployment.mts';
import { loadSiteConfiguration } from './lib/site-config.mts';
import { prepareSitemap } from './lib/sitemap.mts';

const root = fileURLToPath(new URL('..', import.meta.url));
const browserDirectory = join(root, 'dist/blog/browser');
const { site, redirects } = loadSiteConfiguration(join(root, 'configs'));

prepareDeploymentAssets(browserDirectory, redirects);
console.log('Prepared custom 404 page and Cloudflare redirects');
const sitemapCount = prepareSitemap(browserDirectory, site.url);
console.log(`Generated sitemap.xml with ${sitemapCount} URLs and robots.txt`);
const markdownCount = prepareMarkdownWorker(browserDirectory, site.url);
console.log(`Prepared Cloudflare Worker with ${markdownCount} Markdown alternatives`);
