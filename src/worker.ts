type AssetBinding = {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
};

type Env = {
  ASSETS: AssetBinding;
};

function wantsHtml(request: Request): boolean {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return false;
  }

  const accept = request.headers.get('accept') ?? '';
  return accept.includes('text/html');
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404 || !wantsHtml(request)) {
      return assetResponse;
    }

    const fallbackUrl = new URL(request.url);
    fallbackUrl.pathname = '/index.html';
    fallbackUrl.search = '';

    const fallbackRequest = new Request(fallbackUrl.toString(), request);
    const fallbackResponse = await env.ASSETS.fetch(fallbackRequest);
    if (fallbackResponse.status === 404) {
      return assetResponse;
    }

    return new Response(fallbackResponse.body, {
      headers: fallbackResponse.headers,
      status: 200,
      statusText: 'OK',
    });
  },
};
