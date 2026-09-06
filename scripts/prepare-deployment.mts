import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareDeploymentAssets } from './lib/deployment-assets.mts';
import { loadRedirects } from './lib/site-config.mts';

const root = fileURLToPath(new URL('..', import.meta.url));
const browserDirectory = join(root, 'dist/blog/browser');
const redirects = loadRedirects(join(root, 'configs'));

prepareDeploymentAssets(browserDirectory, redirects);
console.log('Prepared custom 404 page and Cloudflare redirects');
