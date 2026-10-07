import { randomBytes, createHash, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { getDatabase } from '@/db/database.mjs';
import { isAllowedOrigin, json, readBody, BodyTooLarge } from './http';
const derive = promisify(scrypt);
const COOKIE = 'hideaway_admin';
const TTL = 8 * 60 * 60;
export type Admin = {id:number;email:string};
export type Credentials = Admin & {password_hash:string;salt:string};
export const tokenHash = (token:string) => createHash('sha256').update(token).digest('hex');
export async function hashPassword(password:string, salt:string) {
  return (await derive(password,salt,64) as Buffer).toString('hex');
}
export async function verifyPassword(password:string, salt:string, expected:string) {
  const actual = Buffer.from(await hashPassword(password,salt), 'hex');
  const hash = Buffer.from(expected,'hex');
  return actual.length === hash.length && timingSafeEqual(actual,hash);
}
export async function configured() {return (await getDatabase().execute('SELECT id FROM admins WHERE id = 1')).rows.length > 0;}
export function isLocalSetup(request:Request) {
  const host = request.headers.get('host') || new URL(request.url).host;
  return process.env.NODE_ENV === 'development' && /^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(host);
}
export function setupEnabled(request:Request) {return isLocalSetup(request) || !!process.env.ADMIN_SETUP_TOKEN;}
export function setupAuthorized(request:Request, token:string) {
  if (isLocalSetup(request)) return true;
  const expected = process.env.ADMIN_SETUP_TOKEN;
  return !!expected && timingSafeEqual(Buffer.from(tokenHash(token),'hex'),Buffer.from(tokenHash(expected),'hex'));
}
export function sessionToken(request:Request) {
  return request.headers.get('cookie')?.split(';').map(c=>c.trim()).find(c=>c.startsWith(COOKIE+'='))?.slice(COOKIE.length+1) || '';
}
export async function currentAdmin(request:Request):Promise<Admin|null> {
  const token = sessionToken(request);
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  return ((await getDatabase().execute({sql:'SELECT a.id,a.email FROM admin_sessions s JOIN admins a ON a.id=s.admin_id WHERE s.token_hash=? AND s.expires_at>?',args:[tokenHash(token),Date.now()]})).rows[0] as unknown as Admin|undefined) || null;
}
function cookie(request:Request, value:string, maxAge:number) {
  const secure = process.env.NODE_ENV === 'production' || new URL(request.url).protocol==='https:';
  return `${COOKIE}=${value}; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=${maxAge}${secure?'; Secure':''}`;
}
export async function authenticatedResponse(request:Request, admin:Admin) {
  const db = getDatabase();
  await db.execute({sql:'DELETE FROM admin_sessions WHERE expires_at<=?',args:[Date.now()]});
  const token = randomBytes(32).toString('hex');
  await db.execute({sql:'INSERT INTO admin_sessions (token_hash,admin_id,expires_at) VALUES (?,?,?)',args:[tokenHash(token),admin.id,Date.now()+TTL*1000]});
  const response = json(request,{user:{email:admin.email}});
  response.headers.set('Set-Cookie',cookie(request,token,TTL));
  return response;
}
export async function logoutResponse(request:Request) {
  await getDatabase().execute({sql:'DELETE FROM admin_sessions WHERE token_hash=?',args:[tokenHash(sessionToken(request))]});
  const response = json(request,{ok:true});
  response.headers.set('Set-Cookie',cookie(request,'',0));return response;
}
export function validWrite(request:Request) {
  return !!request.headers.get('origin') && isAllowedOrigin(request) && request.headers.get('content-type')?.includes('application/json');
}
export async function adminBody(request:Request) {
  return JSON.parse(await readBody(request)) as unknown;
}
export function apiFailure(request:Request,error:unknown) {
  if(error instanceof BodyTooLarge)return json(request,{error:'Nội dung quá dài.'},413);
  if(error instanceof SyntaxError)return json(request,{error:'Yêu cầu không hợp lệ.'},400);
  return json(request,{error:'Chưa xử lý được yêu cầu. Vui lòng thử lại.'},503);
}
type Attempt = {count:number;expires:number};
const attemptKey = Symbol.for('choose-hideaway.login-attempts');
const state = globalThis as typeof globalThis & {[attemptKey]?:Map<string,Attempt>};
const attempts = state[attemptKey] ||= new Map<string,Attempt>();
export function allowLogin(email:string) {
  const now=Date.now();
  for(const [key,item] of attempts)if(item.expires<=now)attempts.delete(key);
  const attempt=attempts.get(email);
  return (!attempt || attempt.count<5) && attempts.size<1000;
}
export function failedLogin(email:string) {
  const item=attempts.get(email) || {count:0,expires:Date.now()+15*60*1000};
  item.count++;attempts.set(email,item);
}
export function clearAttempts(email:string) {attempts.delete(email);}
