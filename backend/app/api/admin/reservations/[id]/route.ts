import { z } from 'zod';
import { getDatabase } from '@/db/database.mjs';
import { adminBody,apiFailure,currentAdmin,validWrite } from '@/lib/admin';
import { json } from '@/lib/http';
import { notifyReservation } from '@/lib/mail.mjs';
export const runtime='nodejs';
export const maxDuration=60;
const schema=z.object({status:z.enum(['pending','confirmed','cancelled']),expectedStatus:z.enum(['pending','confirmed','cancelled'])});
export async function PATCH(request:Request,context:{params:Promise<{id:string}>}) {
  if(!validWrite(request))return json(request,{error:'Yêu cầu không hợp lệ.'},403);
  try {
    const admin=await currentAdmin(request);if(!admin)return json(request,{error:'Vui lòng đăng nhập.'},401);
    const {id}=await context.params;
    const result=schema.safeParse(await adminBody(request));
    if(id.length>64||!result.success)return json(request,{error:'Yêu cầu không hợp lệ.'},400);
    const {status,expectedStatus}=result.data;
    const allowed:Record<string,string[]>={pending:['confirmed','cancelled'],confirmed:['cancelled'],cancelled:['pending']};
    if(!allowed[expectedStatus].includes(status))return json(request,{error:'Thay đổi trạng thái không hợp lệ.'},400);
    const transaction=await getDatabase().transaction('write');
    let confirmedReservation;
    try {
      const row=(await transaction.execute({sql:'SELECT * FROM reservations WHERE id=?',args:[id]})).rows[0];
      if(!row){await transaction.rollback();return json(request,{error:'Không tìm thấy yêu cầu.'},404);}
      if(row.status!==expectedStatus){await transaction.rollback();return json(request,{error:'Trạng thái đã thay đổi. Vui lòng làm mới danh sách.'},409);}
      await transaction.execute({sql:'UPDATE reservations SET status=? WHERE id=? AND status=?',args:[status,id,expectedStatus]});
      await transaction.execute({sql:'INSERT INTO reservation_events (reservation_id,admin_id,previous_status,next_status,changed_at) VALUES (?,?,?,?,?)',args:[id,admin.id,expectedStatus,status,new Date().toISOString()]});
      await transaction.commit();
      if(status==='confirmed')confirmedReservation=row;
    }catch(error){if(!transaction.closed)await transaction.rollback();throw error;}
    finally{transaction.close();}
    const notifications=confirmedReservation?await notifyReservation(confirmedReservation,'confirmed'):null;
    return json(request,{id,status,confirmationEmail:notifications?.guest||'not-requested'});
  }catch(error){return apiFailure(request,error);}
}
