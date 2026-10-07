import { randomUUID } from 'node:crypto';
import { getDatabase } from '@/db/database.mjs';
import { reservationSchema } from '@choose-hideaway/contracts';
import { BodyTooLarge, isAllowedOrigin, json, readBody } from '@/lib/http';
export const runtime = 'nodejs';

export async function OPTIONS(request: Request) {
  if (!isAllowedOrigin(request)) return json(request, {error:'Yêu cầu không hợp lệ.'}, 403);
  const headers = new Headers({'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600','Vary':'Origin'});
  const origin = request.headers.get('origin');
  if (origin) headers.set('Access-Control-Allow-Origin', origin);
  return new Response(null, {status:204, headers});
}
export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) return json(request, {error:'Yêu cầu không hợp lệ.'}, 403);
  if (!request.headers.get('content-type')?.includes('application/json')) return json(request, {error:'Định dạng không hợp lệ.'}, 415);
  try {
    let body: unknown;
    const text = await readBody(request);
    try {body=JSON.parse(text);} catch {return json(request, {error:'Yêu cầu không hợp lệ.'}, 400);}
    const result = reservationSchema.safeParse(body);
    if (!result.success) return json(request, {error:result.error.issues[0]?.message || 'Vui lòng kiểm tra thông tin.'}, 400);
    const v = result.data;
    const id = `CH-${randomUUID().replaceAll('-','').slice(0,12).toUpperCase()}`;
    await getDatabase().execute({sql:'INSERT INTO reservations (id,kind,name,phone,email,start_date,end_date,time,guests,rooms,room_type,notes,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',args:[id,v.kind,v.name,v.phone,v.email||null,v.startDate,v.kind==='room'?v.endDate:null,v.kind==='table'?v.time:null,v.guests,v.kind==='room'?v.rooms:null,v.kind==='room'?v.roomType:null,v.notes||null,'pending',new Date().toISOString()]});
    return json(request, {id,status:'pending'}, 201);
  } catch(error) {
    if (error instanceof BodyTooLarge) return json(request, {error:'Nội dung quá dài.'}, 413);
    console.error('Unable to save reservation:', error instanceof Error ? error.message : 'Unknown storage error');
    return json(request, {error:'Chưa gửi được yêu cầu. Vui lòng thử lại hoặc gọi 0913 576 663.'}, 503);
  }
}
