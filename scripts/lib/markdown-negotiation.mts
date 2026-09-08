export interface AssetBinding {
  fetch(request: Request): Promise<Response>;
}

export type MarkdownRoutes = Readonly<Record<string, string>>;

async function fetchAsset(request: Request, assets: AssetBinding): Promise<Response> {
  const response = await assets.fetch(request);
  // Cloudflare applies URL-based _headers rules even to its HTML 404 fallback.
  if (
    response.status !== 404 ||
    !response.headers.get('Content-Type')?.startsWith('text/markdown')
  ) {
    return response;
  }
  const headers = new Headers(response.headers);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  return new Response(response.body, { status: response.status, headers });
}

// An explicit Markdown preference opts in; a browser's */* does not.
export function prefersMarkdown(accept: string | null): boolean {
  let markdown = 0;
  let html = 0;
  let htmlSpecificity = -1;
  for (const entry of (accept ?? '').split(',')) {
    const [mediaType, ...parameters] = entry.trim().toLowerCase().split(';');
    const type = mediaType.trim();
    let quality = 1;
    for (const parameter of parameters) {
      const [name, value] = parameter.trim().split('=');
      if (name.trim() === 'q') {
        quality = /^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/.test(value?.trim() ?? '')
          ? Number(value.trim())
          : 0;
      }
    }
    if (type === 'text/markdown') markdown = Math.max(markdown, quality);
    const specificity = type === 'text/html' ? 2 : type === 'text/*' ? 1 : type === '*/*' ? 0 : -1;
    if (specificity > htmlSpecificity) {
      html = quality;
      htmlSpecificity = specificity;
    } else if (specificity >= 0 && specificity === htmlSpecificity) {
      html = Math.max(html, quality);
    }
  }
  return markdown > 0 && markdown >= html;
}

export function createMarkdownWorker(routes: MarkdownRoutes) {
  return {
    async fetch(request: Request, env: { ASSETS: AssetBinding }): Promise<Response> {
      const url = new URL(request.url);
      const path = url.pathname === '/' ? '/' : url.pathname.replace(/\/$/, '');
      const markdownUrl = Object.hasOwn(routes, path) ? routes[path] : undefined;
      if (!markdownUrl || !['GET', 'HEAD'].includes(request.method)) {
        return fetchAsset(request, env.ASSETS);
      }

      const markdown = prefersMarkdown(request.headers.get('Accept'));
      const assetUrl = new URL(request.url);
      if (markdown) assetUrl.pathname = new URL(markdownUrl).pathname;
      const assetRequest = new Request(assetUrl, request);
      // Both representations can share a build timestamp. Use their distinct ETags.
      assetRequest.headers.delete('If-Modified-Since');
      const asset = await fetchAsset(assetRequest, env.ASSETS);
      const headers = new Headers(asset.headers);
      const vary = (headers.get('Vary') ?? '').split(',').map((value) => value.trim());
      if (!vary.some((value) => ['*', 'accept'].includes(value.toLowerCase()))) {
        headers.set('Vary', [...vary.filter(Boolean), 'Accept'].join(', '));
      }
      // ASSETS caches the two files separately. Do not cache negotiated URLs in a
      // shared CDN cache, whose cache key may ignore Vary: Accept.
      headers.set('Cache-Control', 'private, no-cache');
      headers.set('CDN-Cache-Control', 'no-store');
      headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
      if (asset.ok || (asset.status >= 300 && asset.status < 400)) {
        headers.append('Link', `<${markdownUrl}>; rel="alternate"; type="text/markdown"`);
        const guide = new URL('/llms.txt', markdownUrl).href;
        headers.append('Link', `<${guide}>; rel="describedby"; type="text/plain"`);
        if (markdown && (asset.ok || asset.status === 304)) {
          headers.set('Content-Type', 'text/markdown; charset=utf-8');
          headers.set('Content-Location', markdownUrl);
        }
      }
      return new Response(request.method === 'HEAD' ? null : asset.body, {
        status: asset.status,
        statusText: asset.statusText,
        headers,
      });
    },
  };
}
