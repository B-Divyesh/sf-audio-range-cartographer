import type { Project } from './types';

const DB_NAME = 'audio-range-cartographer';
const STORE = 'projects';
const CURRENT = 'current';

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadProject(): Promise<Project | null> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).get(CURRENT);
    request.onsuccess = () => resolve((request.result as Project | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveProject(project: Project): Promise<void> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(project, CURRENT);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function saveSnapshot(project: Project): Promise<void> {
  const db = await database();
  const key = `snapshot:${Date.now()}`;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(project, key);
    transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error);
  });
}

export async function listSnapshots(): Promise<Array<{ key: string; project: Project }>> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).openCursor(); const output: Array<{ key: string; project: Project }> = [];
    request.onsuccess = () => { const cursor = request.result; if (!cursor) { resolve(output.sort((a, b) => b.key.localeCompare(a.key)).slice(0, 20)); return; } if (String(cursor.key).startsWith('snapshot:')) output.push({ key: String(cursor.key), project: cursor.value as Project }); cursor.continue(); };
    request.onerror = () => reject(request.error);
  });
}
