import {Histogram, Registry, collectDefaultMetrics} from 'prom-client';

type Metrics = {
  registry: Registry;
  httpServerRequests: Histogram<'route' | 'method' | 'status'>;
};

// Next.js bundles instrumentation.ts and each Route Handler separately, so a plain module-level
// registry would be instantiated more than once. Keep a single instance on globalThis.
const globalForMetrics = globalThis as typeof globalThis & {__shortlinerMetrics?: Metrics};

function createMetrics(): Metrics {
  const registry = new Registry();
  collectDefaultMetrics({register: registry});

  const httpServerRequests = new Histogram({
    name: 'http_server_requests_seconds',
    help: 'Duration of API proxy requests handled by the frontend',
    labelNames: ['route', 'method', 'status'] as const,
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [registry],
  });

  return {registry, httpServerRequests};
}

export function getMetrics(): Metrics {
  globalForMetrics.__shortlinerMetrics ??= createMetrics();
  return globalForMetrics.__shortlinerMetrics;
}
