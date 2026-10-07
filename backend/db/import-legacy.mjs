import { DatabaseSync } from 'node:sqlite';
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { databasePath, openDatabase, databaseProvider } from './database.mjs';
import { migrateDatabase } from './migrate.mjs';
export function importLegacy(sourceDir, destination = databasePath()) {
  migrateDatabase(destination);
  if (!existsSync(sourceDir)) return 0;
  const target = openDatabase(destination);
  let count = 0;
  try {
    target.exec('BEGIN IMMEDIATE');
    for (const file of readdirSync(sourceDir).filter(f=>f.endsWith('.sqlite'))) {
      const source = new DatabaseSync(resolve(sourceDir, file), {readOnly:true});
      try {
        if (!source.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'reservations'").get()) continue;
        for (const row of source.prepare('SELECT * FROM reservations').all()) {
          const result = target.prepare('INSERT OR IGNORE INTO reservations (id,kind,name,phone,email,start_date,end_date,time,guests,rooms,room_type,notes,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(row.id,row.kind,row.name,row.phone,row.email,row.start_date,row.end_date,row.time,row.guests,row.rooms,row.room_type,row.notes,row.status,row.created_at);
          count += Number(result.changes);
        }
      } finally {source.close();}
    }
    target.exec('COMMIT');
  } catch(error) {target.exec('ROLLBACK'); throw error;}
  finally {target.close();}
  return count;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (databaseProvider() === 'turso') throw new Error('Legacy import only targets local SQLite. Import the SQLite snapshot through Turso instead.');
  const source = resolve(process.cwd(), '../.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
  console.log(`Imported ${importLegacy(source)} local legacy reservation(s). Existing IDs are preserved.`);
}
