import { z } from 'zod';
export const roomTypes = ['Queen nhìn ra vườn', 'Deluxe nhìn ra vườn', 'Deluxe nhìn ra hồ bơi', 'Phòng gia đình', 'Giường tập thể', 'Cần tư vấn'] as const;
export function localToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const get = (type: string) => parts.find(p => p.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s => {const d = new Date(s+'T00:00:00Z'); return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10)===s;}, 'Ngày không hợp lệ');
const common = {
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(9).max(22).regex(/^\+?[\d\s().-]+$/).refine(s=>s.replace(/\D/g,'').length>=9),
  email: z.union([z.string().email().max(200),z.literal('')]).optional(), startDate: date,
  guests: z.number().int().min(1).max(30), notes: z.string().trim().max(1000).optional(),
  consent: z.literal(true), website: z.string().max(0).optional(),
};
export const reservationSchema = z.discriminatedUnion('kind', [
  z.object({...common,kind:z.literal('room'),endDate:date,rooms:z.number().int().min(1).max(10),roomType:z.enum(roomTypes)}),
  z.object({...common,kind:z.literal('table'),time:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)}),
]).superRefine((v,ctx)=>{
  if(v.startDate<localToday()) ctx.addIssue({code:'custom',message:'Vui lòng chọn ngày từ hôm nay.',path:['startDate']});
  if(v.kind==='room' && (v.endDate<=v.startDate || (Date.parse(v.endDate)-Date.parse(v.startDate))/86400000>60)) ctx.addIssue({code:'custom',message:'Ngày trả phòng phải sau ngày nhận phòng, tối đa 60 đêm.',path:['endDate']});
  if(v.kind==='table' && Date.parse(`${v.startDate}T${v.time}:00+07:00`)<=Date.now()) ctx.addIssue({code:'custom',message:'Vui lòng chọn giờ đến trong tương lai.',path:['time']});
});
