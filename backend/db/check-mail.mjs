import nextEnv from '@next/env';
import { createMailTransport } from '../lib/mail.mjs';
nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production');
let mailer;
try {
  mailer = createMailTransport();
  if (!mailer) throw new Error('Set SMTP_PASS (Gmail App Password) in backend/.env.local or Vercel Environment Variables.');
  await mailer.transport.verify();
  console.log('SMTP connection and authentication: OK. No email was sent.');
} catch(error) {
  console.error('SMTP check failed:', error?.code || (mailer ? 'Check SMTP settings and App Password.' : error.message));
  process.exitCode = 1;
} finally {mailer?.transport.close();}
