import { getDatabase } from '@/db/database.mjs';
import { apiFailure,currentAdmin } from '@/lib/admin';
import { json } from '@/lib/http';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request) {
  try {
    if(!await currentAdmin(request))return json(request,{error:'Vui lòng đăng nhập.'},401);
    const search=new URL(request.url).searchParams;
    const kind=search.get('kind')||'all';const status=search.get('status')||'all';const q=(search.get('q')||'').trim().slice(0,100);
    const page=Math.max(1,Math.min(100000,Number(search.get('page'))||1));
    if(!['all','room','table'].includes(kind)||!['all','pending','confirmed','cancelled'].includes(status)||!Number.isInteger(page))return json(request,{error:'Bộ lọc không hợp lệ.'},400);
    const conditions:string[]=[];const params:string[]=[];
    if(kind!=='all'){conditions.push('kind=?');params.push(kind);}
    if(status!=='all'){conditions.push('status=?');params.push(status);}
    if(q){conditions.push('(id LIKE ? OR name LIKE ? OR phone LIKE ?)');const pattern='%'+q.replaceAll('\\','\\\\').replaceAll('%','\\%').replaceAll('_','\\_')+'%';conditions[conditions.length-1]="(id LIKE ? ESCAPE '\\' OR name LIKE ? ESCAPE '\\' OR phone LIKE ? ESCAPE '\\')";params.push(pattern,pattern,pattern);}
    const where=conditions.length?' WHERE '+conditions.join(' AND '):'';
    const db=getDatabase();
    const rows=(await db.execute({sql:'SELECT * FROM reservations'+where+' ORDER BY created_at DESC,id DESC LIMIT 20 OFFSET ?',args:[...params,(page-1)*20]})).rows;
    const total=Number((await db.execute({sql:'SELECT count(*) AS count FROM reservations'+where,args:params})).rows[0].count);
    const stats=(await db.execute('SELECT status,count(*) AS count FROM reservations GROUP BY status')).rows;
    return json(request,{rows,total,page,pageSize:20,stats});
  }catch(error){return apiFailure(request,error);}
}
