import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve, sep } from 'node:path';

/** WebKit worker importScripts requests do not reliably use Playwright page routing. */
export async function serveMathJaxWorker(): Promise<{
  url: string;
  requests: string[];
  close: () => Promise<void>;
}> {
  const directory = resolve('node_modules/mathjax/sre');
  const requests: string[] = [];
  const server = createServer((request, response) => {
    const pathname = new URL(request.url!, 'http://localhost').pathname;
    requests.push(pathname);
    const path = resolve(directory, `.${decodeURIComponent(pathname)}`);
    response.setHeader('Access-Control-Allow-Origin', '*');
    if (!path.startsWith(`${directory}${sep}`)) {
      response.writeHead(404).end();
      return;
    }
    void readFile(path).then(
      (body) => {
        response.setHeader(
          'Content-Type',
          path.endsWith('.json') ? 'application/json' : 'text/javascript',
        );
        response.end(body);
      },
      () => response.writeHead(404).end(),
    );
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing MathJax worker address');
  return {
    url: `http://127.0.0.1:${address.port}`,
    requests,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
        server.closeAllConnections();
      }),
  };
}
