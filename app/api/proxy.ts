import {randomBytes} from 'node:crypto';
import {NextRequest, NextResponse} from 'next/server';
import {logger} from '@/lib/logger';
import {getMetrics} from '@/lib/metrics';

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

type BackendUrlEnvVar = 'SHORTLINER_BACKEND_URL' | 'ANALYTICS_BACKEND_URL' | 'PAYMENT_BACKEND_URL';

// Route templates used as the metric label — never the raw path (short codes are unbounded).
const ROUTE_TEMPLATES: Record<BackendUrlEnvVar, string> = {
  SHORTLINER_BACKEND_URL: '/api/shortliner/*',
  ANALYTICS_BACKEND_URL: '/api/analytics/*',
  PAYMENT_BACKEND_URL: '/api/payment/*',
};

const TRACEPARENT_PATTERN = /^[0-9a-f]{2}-([0-9a-f]{32})-[0-9a-f]{16}-[0-9a-f]{2}$/;

// Reuses the caller's W3C trace context, or starts a new trace here so backend spans share it.
function resolveTraceparent(headers: Headers): {traceparent: string; traceId: string} {
  const incoming = headers.get('traceparent');
  const match = incoming?.match(TRACEPARENT_PATTERN);
  if (incoming && match) {
    return {traceparent: incoming, traceId: match[1]};
  }
  const traceId = randomBytes(16).toString('hex');
  return {traceparent: `00-${traceId}-${randomBytes(8).toString('hex')}-01`, traceId};
}

export async function proxyToBackend(
    request: NextRequest,
    backendUrlEnvVar: BackendUrlEnvVar,
    path: string[] | undefined,
) {
  const startedAt = performance.now();
  const route = ROUTE_TEMPLATES[backendUrlEnvVar];
  const headers = new Headers(request.headers);
  HOP_BY_HOP_HEADERS.forEach((header) => headers.delete(header));
  const {traceparent, traceId} = resolveTraceparent(headers);
  headers.set('traceparent', traceparent);

  const finish = (response: NextResponse, error?: unknown) => {
    const durationMs = performance.now() - startedAt;
    getMetrics().httpServerRequests
        .labels(route, request.method, String(response.status))
        .observe(durationMs / 1000);
    const fields = {
      method: request.method,
      path: request.nextUrl.pathname,
      route,
      status: response.status,
      durationMs: Math.round(durationMs),
      traceId,
    };
    if (error) {
      logger.error({...fields, err: error}, 'Proxy request failed');
    } else if (response.status >= 500) {
      logger.warn(fields, 'Proxy request completed with server error');
    } else {
      logger.info(fields, 'Proxy request completed');
    }
    return response;
  };

  const backendUrl = process.env[backendUrlEnvVar];
  if (!backendUrl) {
    return finish(
        NextResponse.json({error: `${backendUrlEnvVar} is not configured`}, {status: 500}),
        new Error(`${backendUrlEnvVar} is not configured`),
    );
  }

  const targetUrl = new URL(`${backendUrl}/${(path ?? []).join('/')}`);
  targetUrl.search = request.nextUrl.search;

  let backendResponse: Response;
  try {
    backendResponse = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
      redirect: 'manual',
      // @ts-expect-error -- required by undici when streaming a request body
      duplex: 'half',
    });
  } catch (error) {
    return finish(NextResponse.json({error: 'Backend unavailable'}, {status: 502}), error);
  }

  const responseHeaders = new Headers(backendResponse.headers);
  HOP_BY_HOP_HEADERS.forEach((header) => responseHeaders.delete(header));

  return finish(new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    headers: responseHeaders,
  }));
}
