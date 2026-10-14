import { openDB, type IDBPDatabase } from 'idb';

/**
 * Almacenamiento persistente:
 * - IndexedDB: estado completo del mundo (datos pesados, entradas de diario)
 *   + imágenes binarias (fotografías del diario).
 * - localStorage: solo preferencias ligeras (se maneja en el store).
 */

const DB_NAME = 'little-world-db';
const DB_VERSION = 1;
const STORE_STATE = 'state';
const STORE_IMAGES = 'images';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_STATE)) db.createObjectStore(STORE_STATE);
        if (!db.objectStoreNames.contains(STORE_IMAGES)) db.createObjectStore(STORE_IMAGES);
      },
    });
  }
  return dbPromise;
}

export async function loadState<T = unknown>(): Promise<T | null> {
  try {
    const db = await getDB();
    const v = await db.get(STORE_STATE, 'world');
    return (v as T) ?? null;
  } catch (e) {
    console.warn('[storage] No se pudo leer IndexedDB:', e);
    return null;
  }
}

export async function saveState(state: unknown): Promise<void> {
  try {
    const db = await getDB();
    await db.put(STORE_STATE, state, 'world');
  } catch (e) {
    console.warn('[storage] No se pudo guardar en IndexedDB:', e);
  }
}

export async function saveImage(id: string, blob: Blob): Promise<void> {
  const db = await getDB();
  await db.put(STORE_IMAGES, blob, id);
}

export async function loadImage(id: string): Promise<Blob | undefined> {
  const db = await getDB();
  return db.get(STORE_IMAGES, id);
}

export async function deleteImage(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_IMAGES, id);
}

/** Exporta todo (estado + imágenes en base64) a un objeto JSON. */
export async function exportBackup(): Promise<string> {
  const db = await getDB();
  const state = await db.get(STORE_STATE, 'world');
  const imageIds = (await db.getAllKeys(STORE_IMAGES)).map(String);
  const images: Record<string, string> = {};
  for (const key of imageIds) {
    const blob = (await db.get(STORE_IMAGES, key)) as Blob | undefined;
    if (!blob) continue;
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
    images[String(key)] = dataUrl;
  }
  return JSON.stringify({ app: 'little-world', version: 1, exportedAt: new Date().toISOString(), state, images }, null, 2);
}

/** Valida la estructura mínima de un backup importado. */
export function validateBackup(raw: unknown): { ok: boolean; error?: string } {
  if (typeof raw !== 'object' || raw === null) return { ok: false, error: 'El archivo no contiene un objeto válido.' };
  const obj = raw as Record<string, unknown>;
  if (obj.app !== 'little-world') return { ok: false, error: 'Este archivo no es una copia de Little World.' };
  const st = obj.state as Record<string, unknown> | undefined;
  if (!st || typeof st.worldName !== 'string' || typeof st.xp !== 'number' || !Array.isArray(st.missions)) {
    return { ok: false, error: 'La copia está incompleta o dañada (falta estado del mundo).' };
  }
  return { ok: true };
}

/** Importa un backup sustituyendo el estado actual e incluyendo sus imágenes. */
export async function importBackup(parsed: { state: unknown; images?: Record<string, string> }): Promise<void> {
  const db = await getDB();
  await db.put(STORE_STATE, parsed.state, 'world');
  // limpiar imágenes antiguas y escribir las nuevas
  const oldKeys = await db.getAllKeys(STORE_IMAGES);
  await Promise.all(oldKeys.map((k) => db.delete(STORE_IMAGES, k)));
  if (parsed.images) {
    for (const [id, dataUrl] of Object.entries(parsed.images)) {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await db.put(STORE_IMAGES, blob, id);
    }
  }
}
