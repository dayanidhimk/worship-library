import { openDB } from "./db.js";

/* ===============================
   CATEGORY QUERIES
================================ */

// Get all local categories
export async function getAllCategories() {
  const db = await openDB();

  return new Promise((resolve) => {
    const tx = db.transaction("categories", "readonly");
    const store = tx.objectStore("categories");

    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
  });
}

/* ===============================
   SONG QUERIES
================================ */

// Get all songs (ALL categories)
export async function getAllSongs() {
  const db = await openDB();

  return new Promise((resolve) => {
    const tx = db.transaction("songs", "readonly");
    const store = tx.objectStore("songs");

    const req = store.getAll();
    req.onsuccess = () => {
      const songs = req.result || [];
      songs.sort((a, b) => a.name.localeCompare(b.name));
      resolve(songs);
    };
  });
}

// Get songs of ONE category
export async function getSongsByCategory(categoryId) {
  const db = await openDB();

  return new Promise((resolve) => {
    const tx = db.transaction("songs", "readonly");
    const store = tx.objectStore("songs");
    const index = store.index("categoryId");

    const req = index.getAll(IDBKeyRange.only(categoryId));
    req.onsuccess = () => {
      const songs = req.result || [];
      songs.sort((a, b) => a.name.localeCompare(b.name));
      resolve(songs);
    };
  });
}

/* ===============================
   SEARCH
================================ */

// Global search
export async function searchSongsGlobal(query) {
  const db = await openDB();
  const q = query.toLowerCase().trim();

  return new Promise((resolve) => {
    const tx = db.transaction("songs", "readonly");
    const store = tx.objectStore("songs");

    const req = store.getAll();
    req.onsuccess = () => {
      const results = (req.result || [])
        .filter(song => song.searchIndex.includes(q))
        .sort((a, b) => a.name.localeCompare(b.name));

      resolve(results);
    };
  });
}

// Category-specific search
export async function searchSongsByCategory(categoryId, query) {
  const db = await openDB();
  const q = query.toLowerCase().trim();

  return new Promise((resolve) => {
    const tx = db.transaction("songs", "readonly");
    const store = tx.objectStore("songs");
    const index = store.index("categoryId");

    const req = index.getAll(IDBKeyRange.only(categoryId));
    req.onsuccess = () => {
      const results = (req.result || [])
        .filter(song => song.searchIndex.includes(q))
        .sort((a, b) => a.name.localeCompare(b.name));

      resolve(results);
    };
  });
}
