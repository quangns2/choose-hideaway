const MAX_BYTES = 8192;
export function isAllowedOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const allowed = (process.env.FRONTEND_ORIGINS || 'http://127.0.0.1:5173,http://localhost:5173').split(',').map(s=>s.trim()).filter(Boolean);
  if (allowed.includes(origin)) return true;
  try {
    const source = new URL(origin);
    const target = new URL(request.url);
    // Next.js can normalize request.url to localhost in production.
    // Host retains the address the browser actually requested.
    return origin === source.origin && (
      origin === target.origin ||
      (source.host === request.headers.get('host') && source.protocol === target.protocol)
    );
  } catch {return false;}
}
export function json(request: Request, body: unknown, status = 200) {
  const headers: Record<string,string> = {'Cache-Control':'no-store', 'Vary':'Origin'};
  const origin = request.headers.get('origin');
  if (origin && isAllowedOrigin(request)) headers['Access-Control-Allow-Origin'] = origin;
  return Response.json(body, {status, headers});
}
export class BodyTooLarge extends Error {}
export async function readBody(request: Request) {
  if (Number(request.headers.get('content-length') || 0) > MAX_BYTES) throw new BodyTooLarge();
  if (!request.body) return '';
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let body = '';
  try {
    while(true) {
      const {done, value} = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BYTES) {await reader.cancel(); throw new BodyTooLarge();}
      body += decoder.decode(value, {stream:true});
    }
    return body + decoder.decode();
  } finally {reader.releaseLock();}
}
