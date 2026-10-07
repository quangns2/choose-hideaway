import { configured,currentAdmin,setupEnabled,apiFailure } from '@/lib/admin';
import { json } from '@/lib/http';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request) {
  try {const ready=await configured();const admin=ready?await currentAdmin(request):null;return json(request,{configured:ready,canSetup:!ready&&setupEnabled(request),user:admin?{email:admin.email}:null});}
  catch(error){return apiFailure(request,error);}
}
