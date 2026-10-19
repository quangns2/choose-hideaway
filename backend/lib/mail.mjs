import nodemailer from 'nodemailer';
import { z } from 'zod';

const address = z.string().email().max(200);
const ownerDefault = 'choosehideaway@gmail.com';
export function mailSettings(env = process.env) {
  if (!env.SMTP_PASS?.trim()) return null;
  const host = env.SMTP_HOST?.trim() || 'smtp.gmail.com';
  const port = Number(env.SMTP_PORT || 465);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid SMTP_PORT');
  const user = address.parse(env.SMTP_USER?.trim() || ownerDefault);
  return {
    owner: address.parse(env.BOOKING_NOTIFICATION_EMAIL?.trim() || ownerDefault),
    from: address.parse(env.SMTP_FROM?.trim() || user),
    transport: {
      host, port, secure: port === 465,
      // Plain SMTP is supported only for a local relay/test server.
      requireTLS: port !== 465 && !['127.0.0.1', 'localhost', '::1'].includes(host),
      auth: {user, pass:host === 'smtp.gmail.com' ? env.SMTP_PASS.replace(/\s/g, '') : env.SMTP_PASS},
      connectionTimeout:8000, greetingTimeout:8000, socketTimeout:10000, dnsTimeout:5000,
      disableFileAccess:true, disableUrlAccess:true,
    },
  };
}
export function createMailTransport(env = process.env) {
  const settings = mailSettings(env);
  return settings ? {settings, transport:nodemailer.createTransport(settings.transport)} : null;
}
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[ch]));
const date = value => value ? String(value).split('-').reverse().join('/') : '—';
function adminUrl(env) {
  const value = env.SITE_URL || (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : '');
  if (!value) return null;
  try {const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? `${url.origin}/admin` : null;} catch {return null;}
}

export function reservationMessages(reservation, event, settings, env = process.env) {
  const r = reservation;
  const room = r.kind === 'room';
  const kind = room ? 'Đặt phòng / Room booking' : 'Đặt bàn / Table reservation';
  const details = [
    ['Mã yêu cầu / Reference', r.id], ['Dịch vụ / Service', kind],
    ['Khách / Guest', r.name], ['Điện thoại / Phone', r.phone],
    ...(r.email ? [['Email', r.email]] : []),
    [room ? 'Nhận phòng / Check-in' : 'Ngày dùng bữa / Dining date', date(r.start_date)],
    ...(room ? [['Trả phòng / Check-out', date(r.end_date)], ['Loại phòng / Room type', r.room_type], ['Số phòng / Rooms', r.rooms]] : [['Giờ đến / Arrival time (Vietnam)', r.time]]),
    ['Số khách / Guests', r.guests], ...(r.notes ? [['Lời nhắn / Notes', r.notes]] : []),
  ];
  const from = {name:'Choose Hideaway', address:settings.from};
  function message(audience, heading, explanation, subject) {
    const url = audience === 'owner' ? adminUrl(env) : null;
    const text = [heading, explanation, ...details.map(([label,value]) => `${label}: ${value ?? '—'}`), ...(url ? [`Quản lý đặt chỗ / Manage bookings: ${url}`] : []), 'Choose Hideaway · 147 Nguyễn Huệ, Ninh Bình', 'Hotline: 0913 576 663', settings.owner].join('\n\n');
    const html = `<!doctype html><html><body style="margin:0;background:#f7f5ef;font-family:Arial,sans-serif;color:#213c2d"><div style="max-width:620px;margin:auto;padding:28px"><p style="font-size:24px">choose hideaway.</p><h1 style="font-size:22px">${escapeHtml(heading)}</h1><p style="line-height:1.7">${escapeHtml(explanation)}</p><table style="width:100%;border-collapse:collapse;background:#fff">${details.map(([label,value]) => `<tr><th style="padding:12px;text-align:left;vertical-align:top;border-bottom:1px solid #e2e7dc;font-size:12px">${escapeHtml(label)}</th><td style="padding:12px;border-bottom:1px solid #e2e7dc;white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px">${escapeHtml(value ?? '—')}</td></tr>`).join('')}</table>${url ? `<p><a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 20px;background:#213c2d;color:#fff;text-decoration:none">Quản lý đặt chỗ / Manage bookings</a></p>` : ''}<p style="font-size:13px;line-height:1.8">Choose Hideaway · 147 Nguyễn Huệ, Ninh Bình<br>Hotline: <a href="tel:0913576663">0913 576 663</a><br>${escapeHtml(settings.owner)}</p></div></body></html>`;
    return {audience, mail:{from, to:{address:audience === 'owner' ? settings.owner : r.email}, replyTo:{address:audience === 'owner' && r.email ? r.email : settings.owner}, subject, text, html}};
  }
  if (event === 'confirmed') {
    return r.email ? [message('guest', 'Đặt chỗ đã được xác nhận / Booking confirmed', 'Choose Hideaway đã xác nhận đặt chỗ của bạn. Nếu cần thay đổi, vui lòng liên hệ hotline. / Your booking is confirmed. Please contact us if you need to make changes.', `Choose Hideaway · Đã xác nhận / Confirmed · ${r.id}`)] : [];
  }
  return [
    message('owner', 'Có yêu cầu đặt chỗ mới / New booking request', 'Khách vừa gửi yêu cầu qua website. Vui lòng kiểm tra chỗ trống, liên hệ khách và xác nhận trong trang quản trị. / Please review availability, contact the guest and confirm in the admin dashboard.', `Choose Hideaway · ${room ? 'Đặt phòng mới' : 'Đặt bàn mới'} · ${r.id}`),
    ...(r.email ? [message('guest', 'Đã nhận yêu cầu / Request received', 'Cảm ơn bạn! Yêu cầu đang CHỜ XÁC NHẬN, chưa bảo đảm còn phòng/bàn và chưa thu tiền. Choose Hideaway sẽ liên hệ để thống nhất giá và xác nhận. / Thank you! Your request is PENDING, subject to availability. No payment has been collected. We will contact you to agree on rates and confirm.', `Choose Hideaway · Đã nhận yêu cầu / Request received · ${r.id}`)] : []),
  ];
}

export async function notifyReservation(reservation, event = 'received') {
  const result = {owner:'not-requested', guest:reservation.email ? 'not-configured' : 'not-requested'};
  if (event === 'received') result.owner = 'not-configured';
  if (event === 'confirmed' && !reservation.email) return result;
  let mailer;
  try {
    mailer = createMailTransport();
    if (!mailer) {console.warn('Booking email not configured:', {id:reservation.id, event}); return result;}
    const messages = reservationMessages(reservation, event, mailer.settings);
    await Promise.all(messages.map(async ({audience,mail}) => {
      try {
        const info = await mailer.transport.sendMail(mail);
        if (!info.accepted?.length) throw Object.assign(new Error('Recipient not accepted'), {code:'EENVELOPE'});
        result[audience] = 'sent';
      } catch(error) {
        result[audience] = 'failed';
        console.error('Booking email failed:', {id:reservation.id, event, audience, code:typeof error?.code === 'string' ? error.code : 'EMAIL_ERROR'});
      }
    }));
  } catch {
    if (event === 'received') result.owner = 'failed';
    if (reservation.email) result.guest = 'failed';
    console.error('Booking email configuration failed:', {id:reservation.id, event});
  } finally {mailer?.transport.close();}
  return result;
}
