import { z } from 'zod';
import { getDatabase } from '@/db/database.mjs';
import { adminBody,apiFailure,authenticatedResponse,allowLogin,failedLogin,clearAttempts,validWrite,verifyPassword,type Credentials } from '@/lib/admin';
import { json } from '@/lib/http';
export const runtime='nodejs';
const schema=z.object({email:z.string().trim().email().max(200).transform(s=>s.toLowerCase()),password:z.string().min(1).max(128)});
export async function POST(request:Request) {
  if(!validWrite(request))return json(request,{error:'Yêu cầu không hợp lệ.'},403);
  try {
    const result=schema.safeParse(await adminBody(request));
    if(!result.success)return json(request,{error:'Email hoặc mật khẩu không đúng.'},400);
    const {email,password}=result.data;
    if(!allowLogin(email))return json(request,{error:'Đăng nhập sai nhiều lần. Vui lòng thử lại sau 15 phút.'},429);
    const admin=(await getDatabase().execute({sql:'SELECT id,email,password_hash,salt FROM admins WHERE email=?',args:[email]})).rows[0] as unknown as Credentials|undefined;
    const valid=await verifyPassword(password,admin?.salt||'unconfigured-hideaway-account',admin?.password_hash||'0'.repeat(128));
    if(!admin||!valid){failedLogin(email);return json(request,{error:'Email hoặc mật khẩu không đúng.'},401);}
    clearAttempts(email);return await authenticatedResponse(request,admin);
  }catch(error){return apiFailure(request,error);}
}
