import { getDb } from '@/db';
import { reservations } from '@/db/schema';
import { reservationSchema } from '@/lib/reservations';
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return Response.json({error:'Yêu cầu không hợp lệ.'},{status:403});
  if (!request.headers.get('content-type')?.includes('application/json')) return Response.json({error:'Định dạng không hợp lệ.'},{status:415});
  try {
    const text = await request.text();
    if (text.length>8000) return Response.json({error:'Nội dung quá dài.'},{status:413});
    let json: unknown;
    try { json=JSON.parse(text); } catch {return Response.json({error:'Yêu cầu không hợp lệ.'},{status:400});}
    const result=reservationSchema.safeParse(json);
    if (!result.success) return Response.json({error:result.error.issues[0]?.message || 'Vui lòng kiểm tra thông tin.'},{status:400});
    const v=result.data;
    const id=`CH-${crypto.randomUUID().replaceAll('-','').slice(0,12).toUpperCase()}`;
    await getDb().insert(reservations).values({id,kind:v.kind,name:v.name,phone:v.phone,email:v.email||null,startDate:v.startDate,endDate:v.kind==='room'?v.endDate:null,time:v.kind==='table'?v.time:null,guests:v.guests,rooms:v.kind==='room'?v.rooms:null,roomType:v.kind==='room'?v.roomType:null,notes:v.notes||null,createdAt:new Date().toISOString()});
    return Response.json({id,status:'pending'},{status:201,headers:{'Cache-Control':'no-store'}});
  } catch {
    return Response.json({error:'Chưa gửi được yêu cầu. Vui lòng thử lại hoặc gọi 0913 576 663.'},{status:503});
  }
}
