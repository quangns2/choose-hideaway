import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mailSettings, reservationMessages } from '../backend/lib/mail.mjs';

const settings = mailSettings({SMTP_PASS:'abcd efgh ijkl mnop'});
const room = {id:'CH-MAIL-TEST',kind:'room',name:'Guest <script>alert(1)</script>',phone:'0900000000',email:'guest@example.test',start_date:'2030-01-20',end_date:'2030-01-22',guests:2,rooms:1,room_type:'Queen nhìn ra vườn',notes:'<img src=x onerror=alert(1)>'};

test('SMTP uses Gmail app passwords with TLS and rejects invalid mail configuration', () => {
  assert.equal(mailSettings({}), null);
  assert.equal(settings.owner, 'choosehideaway@gmail.com');
  assert.equal(settings.transport.secure, true);
  assert.equal(settings.transport.auth.pass, 'abcdefghijklmnop');
  assert.equal(mailSettings({SMTP_PASS:'test',SMTP_PORT:'587'}).transport.requireTLS, true);
  assert.throws(() => mailSettings({SMTP_PASS:'test',SMTP_PORT:'invalid'}));
  assert.throws(() => mailSettings({SMTP_PASS:'test',BOOKING_NOTIFICATION_EMAIL:'invalid'}));
});

test('room emails separate owner and guest, escape content and keep receipt pending', () => {
  const messages = reservationMessages(room, 'received', settings, {SITE_URL:'https://hideaway.example.test'});
  assert.equal(messages.length, 2);
  const owner = messages.find(item => item.audience === 'owner').mail;
  const guest = messages.find(item => item.audience === 'guest').mail;
  assert.equal(owner.to.address, 'choosehideaway@gmail.com');
  assert.equal(owner.replyTo.address, room.email);
  assert.equal(guest.to.address, room.email);
  assert.equal(guest.replyTo.address, 'choosehideaway@gmail.com');
  assert.equal(guest.cc, undefined);assert.equal(guest.bcc, undefined);
  assert.match(owner.html, /https:\/\/hideaway.example.test\/admin/);
  assert(!guest.html.includes('/admin'));
  assert.match(guest.text, /PENDING/);
  assert.match(guest.text, /20\/01\/2030/);
  assert.match(guest.text, /22\/01\/2030/);
  for (const {mail} of messages) {
    assert(!mail.html.includes('<script>'));
    assert(!mail.html.includes('<img src=x'));
    assert.match(mail.html, /&lt;script&gt;/);
    assert.match(mail.html, /&lt;img/);
  }
});

test('table email has arrival time; guest confirmation is sent only with an email address', () => {
  const table = {...room,kind:'table',email:null,time:'18:30',end_date:null,rooms:null,room_type:null};
  const messages = reservationMessages(table,'received',settings,{});
  assert.equal(messages.length, 1);
  assert.equal(messages[0].audience, 'owner');
  assert.match(messages[0].mail.text, /18:30/);
  assert(!messages[0].mail.text.includes('Check-out'));
  assert.equal(reservationMessages(table,'confirmed',settings,{}).length, 0);
  const confirmed = reservationMessages(room,'confirmed',settings,{});
  assert.equal(confirmed.length, 1);
  assert.equal(confirmed[0].audience, 'guest');
  assert.match(confirmed[0].mail.subject, /Confirmed/);
  assert(!confirmed[0].mail.text.includes('PENDING'));
});
