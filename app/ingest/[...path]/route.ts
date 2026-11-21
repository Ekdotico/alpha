import { forward } from '@/lib/analytics-proxy';
import { consumeIngest } from '@/lib/rate-limit';

// The path the browser reports to; see lib/analytics-proxy.ts. POST only: the
// library sends its events as one POST to /ingest/e/.
type Context = { params: Promise<{ path: string[] }> };

export async function POST(request: Request, { params }: Context) {
  return forward(request, (await params).path, consumeIngest);
}
