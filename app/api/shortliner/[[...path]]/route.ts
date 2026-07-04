import {NextRequest} from 'next/server';
import {proxyToBackend} from '../../proxy';

type RouteContext = {params: Promise<{path?: string[]}>};

async function handle(request: NextRequest, context: RouteContext) {
  const {path} = await context.params;
  return proxyToBackend(request, 'SHORTLINER_BACKEND_URL', path);
}

export {
  handle as GET,
  handle as POST,
  handle as PUT,
  handle as PATCH,
  handle as DELETE,
  handle as HEAD,
  handle as OPTIONS,
};
