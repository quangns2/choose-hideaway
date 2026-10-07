import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { getDatabase } from '@/db/database.mjs';
import { adminBody,apiFailure,authenticatedResponse,configured,hashPassword,setupAuthorized,validWrite } from '@/lib/admin';
import { json } from '@/lib/http';
export const runtime='nodejs';
const schema=z.object({email:z.string().trim().email().max(200).transform(s=>s.toLowerCase()),password:z.string().min(10).max(128),setupToken:z.string().max(256).optional()});
export async function POST(request:Request) {
  if(!validWrite(request))return json(request,{error:'Yêu cầu không hợp lệ.'},403);
  try {
    if(await configured())return json(request,{error:'Tài khoản đã được tạo. Vui lòng đăng nhập.'},409);
    const result=schema.safeParse(await adminBody(request));
    if(!result.success)return json(request,{error:'Nhập email hợp lệ và mật khẩu từ 10 đến 128 ký tự.'},400);
    if(!setupAuthorized(request,result.data.setupToken||''))return json(request,{error:'Chỉ thiết lập lần đầu trên máy local hoặc với mã thiết lập của chủ website.'},403);
    const salt=randomBytes(32).toString('hex');
    const hash=await hashPassword(result.data.password,salt);
    const inserted=await getDatabase().execute({sql:'INSERT OR IGNORE INTO admins (id,email,password_hash,salt,created_at) VALUES (1,?,?,?,?)',args:[result.data.email,hash,salt,new Date().toISOString()]});
    if(!inserted.rowsAffected)return json(request,{error:'Tài khoản đã được tạo. Vui lòng đăng nhập.'},409);
    return await authenticatedResponse(request,{id:1,email:result.data.email});
  }catch(error){return apiFailure(request,error);}
}
