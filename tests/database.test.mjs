import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createClient } from '@libsql/client';
import { databaseConfig } from '../backend/db/database.mjs';
import { migrateClient } from '../backend/db/migrate.mjs';

test('database configuration requires Turso credentials together and prevents Vercel SQLite fallback', () => {
  const url = 'libsql://reservations.example.turso.io';
  assert.deepEqual(databaseConfig({TURSO_DATABASE_URL:url, TURSO_AUTH_TOKEN:'test-token'}), {url,authToken:'test-token'});
  assert.throws(() => databaseConfig({TURSO_DATABASE_URL:url}), /TURSO_AUTH_TOKEN/);
  assert.throws(() => databaseConfig({TURSO_AUTH_TOKEN:'test-token'}), /TURSO_DATABASE_URL/);
  assert.throws(() => databaseConfig({VERCEL:'1'}), /Configure Turso/);
  assert.throws(() => databaseConfig({TURSO_DATABASE_URL:'http://insecure.test',TURSO_AUTH_TOKEN:'test-token'}), /libsql/);
  assert.throws(() => databaseConfig({TURSO_DATABASE_URL:'https://user:password@example.test',TURSO_AUTH_TOKEN:'test-token'}), /libsql/);
  assert(databaseConfig({DATABASE_PATH:'./temporary.sqlite'}).url.startsWith('file:'));
});

test('libSQL migrations are idempotent and failed transactions roll back reservation updates', async () => {
  const db = createClient({url:':memory:'});
  try {
    await migrateClient(db);
    await migrateClient(db);
    assert.equal((await db.execute('SELECT count(*) AS count FROM schema_migrations')).rows[0].count, 2);
    await db.execute({sql:'INSERT INTO reservations (id,kind,name,phone,start_date,guests,status,created_at) VALUES (?,?,?,?,?,?,?,?)',args:['CH-TEST','table','Database test','0900000000','2030-01-01',2,'pending',new Date().toISOString()]});
    const transaction = await db.transaction('write');
    try {
      await transaction.execute("UPDATE reservations SET status='confirmed' WHERE id='CH-TEST'");
      await assert.rejects(transaction.execute("INSERT INTO reservation_events (reservation_id,admin_id,previous_status,next_status,changed_at) VALUES ('CH-TEST',999,'pending','confirmed','2030-01-01')"), /FOREIGN KEY/);
      await transaction.rollback();
    } finally {transaction.close();}
    assert.equal((await db.execute("SELECT status FROM reservations WHERE id='CH-TEST'")).rows[0].status, 'pending');
    assert.equal((await db.execute('SELECT count(*) AS count FROM reservation_events')).rows[0].count, 0);
  } finally {db.close();}
});
