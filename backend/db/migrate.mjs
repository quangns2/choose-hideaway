import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { databasePath, openDatabase, getDatabase, databaseProvider, databaseConfig } from './database.mjs';

export async function migrateClient(db) {
  const transaction = await db.transaction('write');
  try {
    await transaction.execute('CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
    for (const id of ['0001-reservations', '0002-admin']) {
      const result = await transaction.execute({sql:'SELECT id FROM schema_migrations WHERE id = ?', args:[id]});
      if (result.rows.length) continue;
      await transaction.executeMultiple(readFileSync(new URL(`./migrations/${id}.sql`, import.meta.url), 'utf8'));
      await transaction.execute({sql:'INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)', args:[id,new Date().toISOString()]});
    }
    await transaction.commit();
  } catch(error) {
    if (!transaction.closed) await transaction.rollback();
    throw error;
  } finally {transaction.close();}
}

export function migrateDatabase(filename = databasePath()) {
  const db = openDatabase(filename, {create: true});
  try {
    db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
    for (const id of ['0001-reservations', '0002-admin']) {
      if (db.prepare('SELECT id FROM schema_migrations WHERE id = ?').get(id)) continue;
      const sql = readFileSync(new URL(`./migrations/${id}.sql`, import.meta.url), 'utf8');
      db.exec('BEGIN IMMEDIATE');
      try {
        db.exec(sql);
        db.prepare('INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)').run(id, new Date().toISOString());
        db.exec('COMMIT');
      } catch(error) {db.exec('ROLLBACK'); throw error;}
    }
  } finally {db.close();}
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // Validate configuration before choosing a database; never silently fall back.
  databaseConfig();
  if (databaseProvider() === 'turso') {
    const db = getDatabase();
    try {await migrateClient(db);} finally {db.close();}
  } else {migrateDatabase();}
  console.log(`${databaseProvider() === 'turso' ? 'Turso' : 'SQLite'} migrations are up to date.`);
}
