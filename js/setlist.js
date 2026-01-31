import { openDB } from "./db.js";

export async function addToSetlist(songId) {
  const exists = await isSongInSetlist(songId);
  if (exists) return false;

  const db = await openDB();
  const tx = db.transaction("setlist", "readwrite");
  const store = tx.objectStore("setlist");

  const count = await store.count();

  store.put({
    id: `setlist_${Date.now()}`,
    songId,
    order: count + 1,
    addedAt: Date.now()
  });

  return true;
}


export async function getSetlist() {
  const db = await openDB();
  const tx = db.transaction("setlist", "readonly");
  const store = tx.objectStore("setlist");

  return new Promise(resolve => {
    const req = store.getAll();
    req.onsuccess = () => {
      resolve(req.result.sort((a, b) => a.order - b.order));
    };
  });
}

export async function removeFromSetlist(id) {
  const db = await openDB();
  const tx = db.transaction("setlist", "readwrite");
  tx.objectStore("setlist").delete(id);
  return tx.complete;
}

export async function clearSetlist() {
  const db = await openDB();
  const tx = db.transaction("setlist", "readwrite");
  tx.objectStore("setlist").clear();
  return tx.complete;
}

async function isSongInSetlist(songId) {
  const db = await openDB();
  const tx = db.transaction("setlist", "readonly");
  const store = tx.objectStore("setlist");

  return new Promise(resolve => {
    const req = store.getAll();
    req.onsuccess = () => {
      resolve(req.result.some(i => i.songId === songId));
    };
  });
}
