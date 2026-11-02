import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const seedFile = fileURLToPath(new URL('./data/seed.json', import.meta.url));
const dbFile = fileURLToPath(new URL('./data/db.json', import.meta.url));

let cache: unknown = null;

export function resetDb() {
  fs.copyFileSync(seedFile, dbFile);
  cache = null;
}

export function readDb<T>(): T {
  if (cache === null) {
    if (!fs.existsSync(dbFile)) resetDb();
    cache = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
  }
  return cache as T;
}

export function writeDb<T>(db: T) {
  cache = db;
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
}
