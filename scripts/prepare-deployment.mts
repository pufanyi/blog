import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load as loadYaml } from 'js-yaml';
import type { Redirect } from '../src/app/models/redirect.model';
import { prepareDeploymentAssets } from './lib/deployment-assets.mts';

const root = fileURLToPath(new URL('..', import.meta.url));
const browserDirectory = join(root, 'dist/blog/browser');
const redirectsPath = join(root, 'content/redirects.yaml');
const redirects = (loadYaml(readFileSync(redirectsPath, 'utf8')) ?? []) as Redirect[];

prepareDeploymentAssets(browserDirectory, redirects);
console.log('Prepared custom 404 page and Cloudflare redirects');
