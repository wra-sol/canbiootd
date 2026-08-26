import { Asset } from 'expo-asset';
import { File, Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { Gunzip } from 'fflate';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Metro requires static requires — one per potential bundle asset.
const bundledGz = require('../assets/bios.sqlite.gz');

const MARKER_KEY = 'canbiootd.db.gzsize.v1';
const DB_FILE = 'bios.sqlite';

function dbTarget(): File {
  return new File(SQLite.defaultDatabaseDirectory ?? Paths.document, DB_FILE);
}

function removeIfExists(file: File) {
  try {
    if (file.exists) file.delete();
  } catch {
    // best effort
  }
}

/**
 * Ensures the expanded bios.sqlite exists and matches the bundled .gz.
 * Streams the gzip through fflate so memory stays flat regardless of DB size.
 */
export async function ensureDatabase(
  onProgress?: (fraction: number) => void
): Promise<void> {
  const target = dbTarget();

  const asset = Asset.fromModule(bundledGz);
  await asset.downloadAsync();
  const src = new File(asset.localUri ?? asset.uri);
  const gzSize = src.size;

  const marker = await AsyncStorage.getItem(MARKER_KEY);
  if (
    marker === String(gzSize) &&
    target.exists &&
    target.size > 0
  ) {
    onProgress?.(1);
    return;
  }

  // clean slate (also removes sqlite -wal/-shm siblings)
  removeIfExists(target);
  removeIfExists(new File(SQLite.defaultDatabaseDirectory ?? Paths.document, `${DB_FILE}-wal`));
  removeIfExists(new File(SQLite.defaultDatabaseDirectory ?? Paths.document, `${DB_FILE}-shm`));

  const reader = src.readableStream().getReader();
  const writer = target.writableStream().getWriter();

  let totalIn = 0;
  const gunzip = new Gunzip((chunk) => {
    if (!chunk) return;
    // collected synchronously by caller below
    pendingOut.push(chunk);
  });
  let pendingOut: Uint8Array[] = [];

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      totalIn += value.length;
      gunzip.push(value, false);
      while (pendingOut.length > 0) {
        const out = pendingOut.shift()!;
        await writer.write(out);
      }
      onProgress?.(Math.min(0.99, totalIn / Math.max(1, gzSize)));
    }
    gunzip.push(new Uint8Array(0), true);
    while (pendingOut.length > 0) {
      const out = pendingOut.shift()!;
      await writer.write(out);
    }
    await writer.close();
  } catch (e) {
    try {
      await writer.abort();
    } catch {
      // ignore
    }
    removeIfExists(target);
    throw e;
  }

  if (!target.exists || target.size === 0) {
    throw new Error('Database expansion produced an empty file');
  }

  await AsyncStorage.setItem(MARKER_KEY, String(gzSize));
  onProgress?.(1);
}
