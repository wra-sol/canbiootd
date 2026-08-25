import type { SQLiteDatabase } from 'expo-sqlite';
import type { Bio } from './types';
import { daysSinceEpoch } from './dates';

export async function getMeta(
  db: SQLiteDatabase,
  key: string
): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM meta WHERE key = ?',
    key
  );
  return row?.value ?? null;
}

export async function getBioCount(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) as n FROM bios'
  );
  return row?.n ?? 0;
}

export async function getBioById(
  db: SQLiteDatabase,
  id: number
): Promise<Bio | null> {
  return db.getFirstAsync<Bio>('SELECT * FROM bios WHERE id = ?', id);
}

export async function getBioForDayOffset(
  db: SQLiteDatabase,
  dayOffset: number
): Promise<{ bio: Bio; seq: number; dateOffset: number } | null> {
  const count = await getBioCount(db);
  if (count === 0) return null;
  const seq = ((dayOffset % count) + count) % count;
  const row = await db.getFirstAsync<{ bio_id: number }>(
    'SELECT bio_id FROM daily_order WHERE seq = ?',
    seq
  );
  if (!row) return null;
  const bio = await getBioById(db, row.bio_id);
  if (!bio) return null;
  return { bio, seq, dateOffset: dayOffset };
}

export async function getTodayBio(db: SQLiteDatabase) {
  const epoch = (await getMeta(db, 'epoch_date')) ?? '2026-08-25';
  const offset = daysSinceEpoch(epoch);
  return getBioForDayOffset(db, offset);
}

export async function getArchivePage(
  db: SQLiteDatabase,
  fromOffset: number,
  toOffset: number
): Promise<{ offset: number; bio: Bio }[]> {
  const results: { offset: number; bio: Bio }[] = [];
  for (let o = fromOffset; o >= toOffset; o--) {
    const item = await getBioForDayOffset(db, o);
    if (item) results.push({ offset: o, bio: item.bio });
  }
  return results;
}

export async function searchBios(
  db: SQLiteDatabase,
  query: string,
  limit = 40
): Promise<Bio[]> {
  const q = query.trim();
  if (!q) return [];
  const like = `%${q.replace(/%/g, '')}%`;
  return db.getAllAsync<Bio>(
    `SELECT * FROM bios
     WHERE name_en LIKE ? OR name_fr LIKE ?
        OR teaser_en LIKE ? OR teaser_fr LIKE ?
        OR plain_en LIKE ? OR plain_fr LIKE ?
     ORDER BY name_en
     LIMIT ?`,
    like,
    like,
    like,
    like,
    like,
    like,
    limit
  );
}

export async function ensureUserTables(db: SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS favourites (
      bio_id INTEGER PRIMARY KEY,
      saved_at TEXT NOT NULL
    );
  `);
}

export async function listFavourites(db: SQLiteDatabase): Promise<Bio[]> {
  await ensureUserTables(db);
  return db.getAllAsync<Bio>(
    `SELECT b.* FROM favourites f
     JOIN bios b ON b.id = f.bio_id
     ORDER BY f.saved_at DESC`
  );
}

export async function isFavourite(
  db: SQLiteDatabase,
  bioId: number
): Promise<boolean> {
  await ensureUserTables(db);
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT 1 as n FROM favourites WHERE bio_id = ?',
    bioId
  );
  return !!row;
}

export async function toggleFavourite(
  db: SQLiteDatabase,
  bioId: number
): Promise<boolean> {
  await ensureUserTables(db);
  const exists = await isFavourite(db, bioId);
  if (exists) {
    await db.runAsync('DELETE FROM favourites WHERE bio_id = ?', bioId);
    return false;
  }
  await db.runAsync(
    'INSERT INTO favourites (bio_id, saved_at) VALUES (?, ?)',
    bioId,
    new Date().toISOString()
  );
  return true;
}
