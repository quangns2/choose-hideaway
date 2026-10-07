import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join, dirname, basename } from 'node:path';
import { reservationSchema, localToday } from '../shared/reservations.ts';
import { BodyTooLarge, isAllowedOrigin, readBody } from '../backend/lib/http.ts';
import { openDatabase } from '../backend/db/database.mjs';
import { migrateDatabase } from '../backend/db/migrate.mjs';
import { importLegacy } from '../backend/db/import-legacy.mjs';

const future = (n:number) => {const date=new Date(localToday()+'T00:00:00Z');date.setUTCDate(date.getUTCDate()+n);return date.toISOString().slice(0,10);};
const room = {kind:'room',name:'Khách kiểm thử',phone:'0900000000',startDate:future(2),endDate:future(4),guests:2,rooms:1,roomType:'Cần tư vấn',consent:true};
test('room/table validation keeps booking dates and consent consistent', () => {
  assert(reservationSchema.safeParse(room).success);
  assert(reservationSchema.safeParse({...room,kind:'table',time:'18:30'}).success);
  for (const invalid of [
    {...room,endDate:room.startDate}, {...room,startDate:'2026-02-30'},
    {...room,consent:false}, {...room,phone:'abc'}, {...room,rooms:0},
    {...room,website:'spam'}, {...room,kind:'table',time:'26:60'},
  ]) assert.equal(reservationSchema.safeParse(invalid).success,false);
  assert.equal(localToday(new Date('2026-10-06T18:00:00Z')),'2026-10-07');
});
test('API accepts configured frontend origins and bounds streamed request bodies', async () => {
  assert(isAllowedOrigin(new Request('http://127.0.0.1:3001/api/reservations',{headers:{origin:'http://127.0.0.1:5173'}})));
  assert(!isAllowedOrigin(new Request('http://127.0.0.1:3001/api/reservations',{headers:{origin:'https://unrelated.test'}})));
  assert(isAllowedOrigin(new Request('http://localhost:3002/api/reservations',{headers:{host:'127.0.0.1:3002',origin:'http://127.0.0.1:3002'}})));
  assert(!isAllowedOrigin(new Request('http://localhost:3002/api/reservations',{headers:{host:'127.0.0.1:3002',origin:'http://127.0.0.1:3003'}})));
  assert(!isAllowedOrigin(new Request('http://localhost:3002/api/reservations',{headers:{origin:'null'}})));
  const request=new Request('http://127.0.0.1:3001/api/reservations',{method:'POST',body:'{"name":"Tiếng Việt"}'});
  assert.equal(await readBody(request),'{"name":"Tiếng Việt"}');
  await assert.rejects(()=>readBody(new Request('http://127.0.0.1:3001/api/reservations',{method:'POST',body:'x'.repeat(8193)})),BodyTooLarge);
});
test('SQLite survives reopening; migrations and legacy import are idempotent', () => {
  const folder=mkdtempSync(join(tmpdir(),'choose-hideaway-test-'));
  const sourceDir=join(folder,'legacy');mkdirSync(sourceDir);
  const sourcePath=join(sourceDir,'legacy.sqlite');const destination=join(folder,'new.sqlite');
  try {
    migrateDatabase(sourcePath);migrateDatabase(sourcePath);
    const db=openDatabase(sourcePath);
    db.prepare('INSERT INTO reservations (id,kind,name,phone,start_date,guests,status,created_at) VALUES (?,?,?,?,?,?,?,?)').run('CH-PRESERVED','table','Kiểm thử','0900000000',future(1),2,'pending',new Date().toISOString());db.close();
    assert.equal(importLegacy(sourceDir,destination),1);
    assert.equal(importLegacy(sourceDir,destination),0);
    const stored=openDatabase(destination);
    assert.equal(stored.prepare('SELECT status FROM reservations WHERE id = ?').get('CH-PRESERVED')?.status,'pending');
    assert.equal(stored.prepare('SELECT count(*) AS count FROM schema_migrations').get()?.count,2);stored.close();
  } finally {
    assert.equal(dirname(resolve(folder)),resolve(tmpdir()));
    assert(basename(folder).startsWith('choose-hideaway-test-'));
    rmSync(folder,{recursive:true,force:true});
  }
});
