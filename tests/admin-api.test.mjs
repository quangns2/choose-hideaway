import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { backend, next, stop } from '../scripts/processes.mjs';
import { migrateDatabase } from '../backend/db/migrate.mjs';
import { openDatabase } from '../backend/db/database.mjs';

test('admin authentication, private data, state changes and session revocation', {timeout:60000}, async () => {
  // Production build required. Every request and record uses an isolated database.
  const folder=mkdtempSync(join(tmpdir(),'hideaway-admin-test-'));
  const filename=join(folder,'test.sqlite');migrateDatabase(filename);
  const socket=createServer();await new Promise(done=>socket.listen(0,'127.0.0.1',done));
  const port=socket.address().port;await new Promise(done=>socket.close(done));
  const base=`http://127.0.0.1:${port}`;
  const secret=randomBytes(32).toString('hex');
  const credentials={email:'owner@example.test',password:randomBytes(20).toString('hex')};
  const child=spawn(process.execPath,[next,'start','--hostname','127.0.0.1','--port',String(port)],{
    cwd:backend,env:{...process.env,NODE_ENV:'production',TURSO_DATABASE_URL:'',TURSO_AUTH_TOKEN:'',DATABASE_PATH:filename,ADMIN_SETUP_TOKEN:secret},
    windowsHide:true,stdio:['ignore','pipe','pipe'],
  });
  let logs='';child.stdout.on('data',data=>{logs+=data;});child.stderr.on('data',data=>{logs+=data;});
  let cookie='';
  const request=async (path,method='GET',body,options={})=>{
    const response=await fetch(base+path,{method,headers:{origin:base,'Content-Type':'application/json',...(cookie?{cookie}:{}),...options.headers},body:body===undefined?undefined:JSON.stringify(body)});
    const data=await response.json();return {response,data};
  };
  const expect=async (path,method,body,status,options)=>{
    const result=await request(path,method,body,options);assert.equal(result.response.status,status,JSON.stringify(result.data));return result;
  };
  try {
    let ready=false;
    for(let i=0;i<100;i++){
      if(child.exitCode!==null)throw new Error('QA server exited: '+logs);
      try {ready=(await fetch(base+'/api/health')).ok;}catch{}
      if(ready)break;await delay(200);
    }
    assert(ready,'QA server did not start: '+logs);
    assert.equal((await fetch(base+'/admin')).status,200);
    const initial=await expect('/api/admin/session','GET',undefined,200);assert.equal(initial.data.configured,false);assert.equal(initial.data.canSetup,true);
    await expect('/api/admin/reservations','GET',undefined,401);
    await expect('/api/admin/reservations/CH-PRIVATE','PATCH',{status:'confirmed',expectedStatus:'pending'},401);
    await expect('/api/admin/setup','POST',{...credentials,setupToken:secret},403,{headers:{origin:'https://unrelated.test'}});
    await expect('/api/admin/setup','POST',credentials,403);
    const setup=await expect('/api/admin/setup','POST',{...credentials,setupToken:secret},200);
    assert.equal(setup.data.user.email,credentials.email);
    const setCookie=setup.response.headers.get('set-cookie');assert.match(setCookie,/HttpOnly/);assert.match(setCookie,/SameSite=Strict/);assert.match(setCookie,/Secure/);cookie=setCookie.split(';')[0];
    await expect('/api/admin/setup','POST',{...credentials,setupToken:secret},409);
    assert.equal((await expect('/api/admin/session','GET',undefined,200)).data.canSetup,false);
    const db=openDatabase(filename);
    try {
      const owner=db.prepare('SELECT * FROM admins').get();assert.notEqual(owner.password_hash,credentials.password);assert.equal(owner.password_hash.length,128);
      assert.notEqual(db.prepare('SELECT token_hash FROM admin_sessions').get().token_hash,cookie.split('=')[1]);
    }finally{db.close();}
    const future=n=>new Date(Date.now()+n*86400000).toISOString().slice(0,10);
    const table=await expect('/api/reservations','POST',{kind:'table',name:'QA Admin Table',phone:'0900000000',startDate:future(3),time:'18:30',guests:4,consent:true},201);
    const room=await expect('/api/reservations','POST',{kind:'room',name:'QA Admin Room',phone:'0900000000',startDate:future(3),endDate:future(5),rooms:1,roomType:'Cần tư vấn',guests:2,consent:true},201);
    const id=table.data.id;
    const list=await expect('/api/admin/reservations?kind=table&status=pending&q=QA','GET',undefined,200);assert.equal(list.data.total,1);assert.equal(list.data.rows[0].id,id);assert.equal(list.response.headers.get('cache-control'),'no-store');
    assert.equal((await expect('/api/admin/reservations?q=%25','GET',undefined,200)).data.total,0);
    await expect('/api/admin/reservations?kind=invalid','GET',undefined,400);
    await expect('/api/admin/reservations/'+id,'PATCH',{status:'confirmed',expectedStatus:'pending'},403,{headers:{origin:'https://unrelated.test'}});
    await expect('/api/admin/reservations/'+id,'PATCH',{status:'confirmed',expectedStatus:'pending'},200);
    await expect('/api/admin/reservations/'+id,'PATCH',{status:'cancelled',expectedStatus:'pending'},409);
    await expect('/api/admin/reservations/'+id,'PATCH',{status:'cancelled',expectedStatus:'confirmed'},200);
    await expect('/api/admin/reservations/'+id,'PATCH',{status:'pending',expectedStatus:'cancelled'},200);
    await expect('/api/admin/reservations/'+id,'PATCH',{status:'pending',expectedStatus:'pending'},400);
    const stored=openDatabase(filename);
    try {
      assert.equal(stored.prepare('SELECT count(*) AS count FROM reservation_events').get().count,3);
      assert.equal(stored.prepare('SELECT status FROM reservations WHERE id=?').get(id).status,'pending');
      assert.equal(stored.prepare('SELECT status FROM reservations WHERE id=?').get(room.data.id).status,'pending');
    }finally{stored.close();}
    await expect('/api/admin/logout','POST',{},200);
    await expect('/api/admin/reservations','GET',undefined,401); // Reusing a revoked cookie must fail.
    cookie='';
    await expect('/api/admin/login','POST',{...credentials,password:'wrong-password'},401);
    const login=await expect('/api/admin/login','POST',credentials,200);cookie=login.response.headers.get('set-cookie').split(';')[0];
    const expired=openDatabase(filename);expired.prepare('UPDATE admin_sessions SET expires_at=?').run(Date.now()-1000);expired.close();
    await expect('/api/admin/reservations','GET',undefined,401);
    for(let i=0;i<5;i++)await expect('/api/admin/login','POST',{email:'unknown@example.test',password:'wrong-password'},401);
    await expect('/api/admin/login','POST',{email:'unknown@example.test',password:'wrong-password'},429);
  } finally {
    if(child.exitCode===null){const exited=new Promise(done=>child.once('exit',done));stop(child);await exited;}
    assert.equal(dirname(resolve(folder)),resolve(tmpdir()));assert(basename(folder).startsWith('hideaway-admin-test-'));
    rmSync(folder,{recursive:true,force:true});
  }
});
