import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMarkdownWorker, type MarkdownRoutes } from './lib/markdown-negotiation.mts';

const root = fileURLToPath(new URL('../dist/blog/browser', import.meta.url));
const routes = JSON.parse(
  await readFile(resolve(root, '../markdown-routes.json'), 'utf8'),
) as MarkdownRoutes;
const worker = createMarkdownWorker(routes);
const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.wasm': 'application/wasm',
  '.ftl': 'text/plain; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.xml': 'application/xml; charset=utf-8',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

const assets = {
  async fetch(request: Request): Promise<Response> {
    const pathname = decodeURIComponent(new URL(request.url).pathname);
    let file = resolve(root, `.${pathname}`);
    if (file !== root && !file.startsWith(root + sep)) {
      return new Response(null, { status: 400 });
    }
    let status = 200;
    try {
      if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
      await stat(file);
    } catch {
      file = resolve(root, '404.html');
      status = 404;
    }
    const data = await readFile(file);
    return new Response(request.method === 'HEAD' ? null : data, {
      status,
      headers: {
        'Content-Type':
          status === 200 && pathname === '/feed.xml'
            ? 'application/rss+xml; charset=utf-8'
            : status === 200 && pathname === '/atom.xml'
              ? 'application/atom+xml; charset=utf-8'
              : (types[extname(file)] ?? 'application/octet-stream'),
        'Cache-Control': 'no-store',
      },
    });
  },
};

const server = createServer(async (request, response) => {
  try {
    const headers = new Headers();
    for (const [name, value] of Object.entries(request.headers)) {
      for (const entry of Array.isArray(value) ? value : value ? [value] : []) {
        headers.append(name, entry);
      }
    }
    const result = await worker.fetch(
      new Request(new URL(request.url ?? '/', 'http://localhost'), {
        method: request.method,
        headers,
      }),
      { ASSETS: assets },
    );
    response.writeHead(result.status, Object.fromEntries(result.headers));
    response.end(Buffer.from(await result.arrayBuffer()));
  } catch {
    response.writeHead(500).end('Build the site with pnpm build before starting the preview.');
  }
});
const port = Number(process.env['PORT'] ?? 4173);
server.listen(port, '127.0.0.1', () => {
  console.log(`Production preview: http://127.0.0.1:${port}`);
});
