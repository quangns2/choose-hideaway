import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import nextEnv from '@next/env';
import { createClient } from '@libsql/client';
import { pathToFileURL } from 'node:url';

nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production');

export function databasePath() {
  return resolve(process.env.DATABASE_PATH || './data/reservations.sqlite');
}
export function openDatabase(filename = databasePath(), {create = false} = {}) {
  if (!create && !existsSync(filename)) throw new Error('Run npm run db:migrate before starting the API.');
  if (create) mkdirSync(dirname(filename), {recursive: true});
  const db = new DatabaseSync(filename);
  db.exec('PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  return db;
}
export function databaseConfig(env = process.env) {
  const url = env.TURSO_DATABASE_URL?.trim();
  const authToken = env.TURSO_AUTH_TOKEN?.trim();
  if (url) {
    if (!authToken) throw new Error('Set TURSO_AUTH_TOKEN in backend/.env.local or the hosting environment.');
    const parsed = new URL(url);
    if (!['libsql:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
      throw new Error('TURSO_DATABASE_URL must use libsql:// or https://.');
    }
    return {url, authToken};
  }
  if (authToken) throw new Error('TURSO_AUTH_TOKEN requires TURSO_DATABASE_URL.');
  if (env.VERCEL) throw new Error('Configure Turso before deploying to Vercel. Local SQLite is not persistent there.');
  return {url: pathToFileURL(resolve(env.DATABASE_PATH || './data/reservations.sqlite')).href};
}
export function databaseProvider() {return process.env.TURSO_DATABASE_URL?.trim() ? 'turso' : 'sqlite';}
const cacheKey = Symbol.for('choose-hideaway.libsql');
export function getDatabase() {
  const config = databaseConfig();
  if (!config.authToken && !existsSync(databasePath())) throw new Error('Run npm run db:migrate before starting the API.');
  const cache = globalThis[cacheKey] ||= new Map();
  const key = JSON.stringify(config);
  if (!cache.has(key) || cache.get(key).closed) cache.set(key, createClient(config));
  return cache.get(key);
}
