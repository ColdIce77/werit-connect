// Die Dateizugriffe sind hier gebündelt. Ändert sich die API von expo-file-system mit einer
// neuen Expo-SDK-Version, muss nur diese Datei angepasst werden.
import * as FileSystem from 'expo-file-system/legacy';

const DOCUMENT_DIR = `${FileSystem.documentDirectory ?? ''}documents/`;

const EXTENSIONS: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'text/plain': '.txt',
  'image/png': '.png',
  'image/jpeg': '.jpg',
};

async function ensureDirectory(): Promise<void> {
  const info = await FileSystem.getInfoAsync(DOCUMENT_DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(DOCUMENT_DIR, { intermediates: true });
}

/** Lädt eine Datei in den App-Speicher. Der Dateiname enthält nur die ID, nie den Titel. */
export async function downloadToCache(params: {
  url: string;
  id: string;
  version: string | null;
  mimeType: string | null;
  headers: Record<string, string>;
}): Promise<string> {
  await ensureDirectory();
  const extension = EXTENSIONS[params.mimeType ?? ''] ?? '';
  const safeVersion = (params.version ?? '0').replace(/[^A-Za-z0-9_-]/g, '');
  const target = `${DOCUMENT_DIR}${params.id}-${safeVersion}${extension}`;

  const result = await FileSystem.downloadAsync(params.url, target, { headers: params.headers });
  if (result.status !== 200) {
    await FileSystem.deleteAsync(target, { idempotent: true });
    throw new Error(`Download fehlgeschlagen (${result.status})`);
  }
  return result.uri;
}

export async function fileExists(uri: string | null): Promise<boolean> {
  if (!uri) return false;
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists;
}

export async function deleteFile(uri: string | null): Promise<void> {
  if (!uri) return;
  await FileSystem.deleteAsync(uri, { idempotent: true });
}

export async function wipeFiles(): Promise<void> {
  await FileSystem.deleteAsync(DOCUMENT_DIR, { idempotent: true });
}
