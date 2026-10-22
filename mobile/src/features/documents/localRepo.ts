import type { DocumentMeta } from '../../shared/api/types';
import { getDb } from '../../shared/offline/db';
import { deleteFile, fileExists } from '../../shared/offline/files';

/** Höchstzahl lokal gespeicherter Dokumente. Ältere werden zuerst entfernt (zuletzt gelesen bleibt). */
const MAX_CACHED_DOCUMENTS = 30;

interface CacheRow {
  id: string;
  title: string;
  mime_type: string | null;
  size_bytes: number | null;
  version: string | null;
  category: string | null;
  web_url: string | null;
  updated_at: string | null;
  local_path: string | null;
  last_read_at: number;
}

export interface CachedDocument extends DocumentMeta {
  localPath: string | null;
  lastReadAt: number;
}

function toCached(row: CacheRow): CachedDocument {
  return {
    id: row.id,
    title: row.title,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    version: row.version,
    category: row.category,
    webUrl: row.web_url ?? '',
    updatedAt: row.updated_at ?? '',
    localPath: row.local_path,
    lastReadAt: row.last_read_at,
  };
}

export async function getCachedDocument(id: string): Promise<CachedDocument | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<CacheRow>('SELECT * FROM document_cache WHERE id = ?', [id]);
  return row ? toCached(row) : null;
}

/** Zuletzt gelesene Dokumente, neueste zuerst. Nur solche, deren Datei noch vorhanden ist. */
export async function listRecentDocuments(): Promise<CachedDocument[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<CacheRow>(
    'SELECT * FROM document_cache WHERE local_path IS NOT NULL ORDER BY last_read_at DESC',
  );
  const available: CachedDocument[] = [];
  for (const row of rows) {
    if (await fileExists(row.local_path)) available.push(toCached(row));
    else await db.runAsync('UPDATE document_cache SET local_path = NULL WHERE id = ?', [row.id]);
  }
  return available;
}

export async function saveCachedDocument(doc: DocumentMeta, localPath: string): Promise<void> {
  const db = await getDb();
  const previous = await db.getFirstAsync<{ local_path: string | null }>(
    'SELECT local_path FROM document_cache WHERE id = ?',
    [doc.id],
  );

  await db.runAsync(
    `INSERT INTO document_cache
       (id, title, mime_type, size_bytes, version, category, web_url, updated_at, local_path, last_read_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET title = excluded.title, mime_type = excluded.mime_type,
       size_bytes = excluded.size_bytes, version = excluded.version, category = excluded.category,
       web_url = excluded.web_url, updated_at = excluded.updated_at,
       local_path = excluded.local_path, last_read_at = excluded.last_read_at`,
    [
      doc.id,
      doc.title,
      doc.mimeType,
      doc.sizeBytes,
      doc.version,
      doc.category,
      doc.webUrl,
      doc.updatedAt,
      localPath,
      Date.now(),
    ],
  );

  // Alte Version derselben Datei entfernen
  if (previous?.local_path && previous.local_path !== localPath) await deleteFile(previous.local_path);

  await enforceLimit();
}

export async function touchDocument(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE document_cache SET last_read_at = ? WHERE id = ?', [Date.now(), id]);
}

async function enforceLimit(): Promise<void> {
  const db = await getDb();
  const excess = await db.getAllAsync<{ id: string; local_path: string | null }>(
    'SELECT id, local_path FROM document_cache WHERE local_path IS NOT NULL ORDER BY last_read_at DESC LIMIT -1 OFFSET ?',
    [MAX_CACHED_DOCUMENTS],
  );
  for (const row of excess) {
    await deleteFile(row.local_path);
    await db.runAsync('UPDATE document_cache SET local_path = NULL WHERE id = ?', [row.id]);
  }
}
