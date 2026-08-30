import type { Project } from './types';

export type StorageNamespace = 'real' | 'demo';

const DB_NAME = 'audio-range-cartographer';
export const DEMO_DB_NAME = 'demo:audio-range-cartographer';
const STORE = 'projects';
const CURRENT = 'current';

function database(namespace: StorageNamespace): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(namespace === 'demo' ? DEMO_DB_NAME : DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadProject(namespace: StorageNamespace = 'real'): Promise<Project | null> {
  const db = await database(namespace);
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).get(CURRENT);
    request.onsuccess = () => { db.close(); resolve((request.result as Project | undefined) ?? null); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export async function saveProject(project: Project, namespace: StorageNamespace = 'real'): Promise<void> {
  const db = await database(namespace);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(project, CURRENT);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(transaction.error); };
  });
}

export async function saveSnapshot(project: Project, namespace: StorageNamespace = 'real'): Promise<void> {
  const db = await database(namespace);
  const key = `snapshot:${Date.now()}`;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(project, key);
    transaction.oncomplete = () => { db.close(); resolve(); }; transaction.onerror = () => { db.close(); reject(transaction.error); };
  });
}

export async function listSnapshots(namespace: StorageNamespace = 'real'): Promise<Array<{ key: string; project: Project }>> {
  const db = await database(namespace);
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).openCursor(); const output: Array<{ key: string; project: Project }> = [];
    request.onsuccess = () => { const cursor = request.result; if (!cursor) { db.close(); resolve(output.sort((a, b) => b.key.localeCompare(a.key)).slice(0, 20)); return; } if (String(cursor.key).startsWith('snapshot:')) output.push({ key: String(cursor.key), project: cursor.value as Project }); cursor.continue(); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export async function clearProjectStorage(namespace: StorageNamespace): Promise<void> {
  const name = namespace === 'demo' ? DEMO_DB_NAME : DB_NAME;
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Close other Cartographer tabs before resetting storage.'));
  });
}
