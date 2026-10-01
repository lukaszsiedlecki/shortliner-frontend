import {createServer} from 'node:http';
import {logger} from './logger';
import {getMetrics} from './metrics';

const globalForServer = globalThis as typeof globalThis & {__shortlinerMetricsServerStarted?: boolean};

// Served on its own port so /metrics is never reachable through the public Ingress on port 3000.
export function startMetricsServer() {
  if (globalForServer.__shortlinerMetricsServerStarted) {
    return;
  }
  globalForServer.__shortlinerMetricsServerStarted = true;

  const port = Number(process.env.METRICS_PORT ?? 9091);
  const {registry} = getMetrics();

  const server = createServer(async (req, res) => {
    if (req.method !== 'GET' || req.url !== '/metrics') {
      res.writeHead(404).end();
      return;
    }
    try {
      const body = await registry.metrics();
      res.writeHead(200, {'Content-Type': registry.contentType}).end(body);
    } catch (error) {
      logger.error({err: error}, 'Failed to collect metrics');
      res.writeHead(500).end();
    }
  });

  server.on('error', (error) => logger.error({err: error, port}, 'Metrics server error'));
  server.listen(port, () => logger.info({port}, 'Metrics server listening'));
}
