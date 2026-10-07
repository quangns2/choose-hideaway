import { getDatabase, databaseProvider } from './database.mjs';

let db;
try {
  db = getDatabase();
  const result = await db.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  const tables = result.rows.map(row => row.name);
  const required = ['schema_migrations', 'reservations', 'admins', 'admin_sessions', 'reservation_events'];
  const missing = required.filter(name => !tables.includes(name));
  if (missing.length) throw new Error(`Missing tables: ${missing.join(', ')}. Run npm run db:migrate.`);
  console.log(JSON.stringify({status:'ok', database:databaseProvider(), tables}, null, 2));
} catch(error) {
  console.error('Database check failed:', error instanceof Error ? error.message : 'Unknown database error');
  process.exitCode = 1;
} finally {db?.close();}
