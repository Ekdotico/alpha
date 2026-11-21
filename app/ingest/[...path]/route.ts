import { forward } from '@/lib/analytics-proxy';

// The path the browser reports to; see lib/analytics-proxy.ts.
type Context = { params: Promise<{ path: string[] }> };

const handle = async (request: Request, { params }: Context) =>
  forward(request, (await params).path);

export { handle as GET, handle as POST, handle as OPTIONS };
