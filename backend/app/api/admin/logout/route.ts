import { apiFailure,logoutResponse,validWrite } from '@/lib/admin';
import { json } from '@/lib/http';
export const runtime='nodejs';
export async function POST(request:Request) {
  if(!validWrite(request))return json(request,{error:'Yêu cầu không hợp lệ.'},403);
  try{return await logoutResponse(request);}catch(error){return apiFailure(request,error);}
}
