import { FilmSchema, type Film } from "./schema";
async function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("vibeframes-films", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("drafts");
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}
export async function saveDraft(film: Film) {
  const db = await database();
  try { await new Promise<void>((resolve, reject) => { const tx = db.transaction("drafts", "readwrite"); tx.objectStore("drafts").put(film, "current"); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error); }); } finally { db.close(); }
}
export async function loadDraft(): Promise<Film | null> {
  const db = await database();
  try { return await new Promise((resolve, reject) => { const req = db.transaction("drafts").objectStore("drafts").get("current"); req.onsuccess = () => { const parsed = FilmSchema.safeParse(req.result); resolve(parsed.success ? parsed.data : null); }; req.onerror = () => reject(req.error); }); } finally { db.close(); }
}
export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
}
