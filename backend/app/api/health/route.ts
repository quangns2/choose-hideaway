import { getDatabase, databaseProvider } from '@/db/database.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    await getDatabase().execute('SELECT 1 FROM reservations LIMIT 1');
    return Response.json({status:'ok',service:'choose-hideaway-api',database:databaseProvider()}, {headers:{'Cache-Control':'no-store'}});
  } catch {
    return Response.json({status:'unavailable'}, {status:503,headers:{'Cache-Control':'no-store'}});
  }
}
