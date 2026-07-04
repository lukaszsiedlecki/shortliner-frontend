import {NextRequest, NextResponse} from 'next/server';

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
]);

export async function proxyToBackend(
    request: NextRequest,
    backendUrlEnvVar: 'SHORTLINER_BACKEND_URL' | 'ANALYTICS_BACKEND_URL',
    path: string[] | undefined,
) {
  const backendUrl = process.env[backendUrlEnvVar];
  if (!backendUrl) {
    return NextResponse.json(
        {error: `${backendUrlEnvVar} is not configured`},
        {status: 500},
    );
  }

  const targetUrl = new URL(`${backendUrl}/${(path ?? []).join('/')}`);
  targetUrl.search = request.nextUrl.search;

  const headers = new Headers(request.headers);
  HOP_BY_HOP_HEADERS.forEach((header) => headers.delete(header));

  const backendResponse = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    redirect: 'manual',
    // @ts-expect-error -- required by undici when streaming a request body
    duplex: 'half',
  });

  const responseHeaders = new Headers(backendResponse.headers);
  HOP_BY_HOP_HEADERS.forEach((header) => responseHeaders.delete(header));

  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
}
