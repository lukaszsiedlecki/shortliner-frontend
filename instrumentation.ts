import type {Instrumentation} from 'next';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const {startMetricsServer} = await import('./lib/metrics-server');
    startMetricsServer();
  }
}

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const {logger} = await import('./lib/logger');
    logger.error(
        {err: error, method: request.method, path: request.path, routePath: context.routePath},
        'Unhandled request error',
    );
  }
};
