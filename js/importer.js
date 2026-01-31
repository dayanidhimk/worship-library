import { openDB } from "./db.js";
import { parseSongDB } from "./parser.js";

function normalizeText(text) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function generateSongId(categoryId, index) {
  return `${categoryId}_${String(index).padStart(4, "0")}`;
}

export async function importCategoryFromXML(xmlText) {
  const songsParsed = parseSongDB(xmlText);
  if (songsParsed.length === 0) return;

  const categoryId = songsParsed[0].category;
  const db = await openDB();

  const tx = db.transaction(["categories", "songs"], "readwrite");
  const categoryStore = tx.objectStore("categories");
  const songStore = tx.objectStore("songs");

  // 🔥 Remove existing songs of this category (update case)
  const index = songStore.index("categoryId");
  const deleteRequest = index.openCursor(IDBKeyRange.only(categoryId));

  deleteRequest.onsuccess = (e) => {
    const cursor = e.target.result;
    if (cursor) {
      songStore.delete(cursor.primaryKey);
      cursor.continue();
    }
  };

  // Insert category
  categoryStore.put({
    id: categoryId,
    name: categoryId,
    songCount: songsParsed.length,
    lastUpdated: Date.now()
  });

  // Insert songs
  songsParsed.forEach((song, i) => {
    songStore.put({
      id: generateSongId(categoryId, i + 1),
      categoryId: categoryId,

      name: song.name,
      name2: song.name2,

      searchIndex: normalizeText(song.name + " " + song.name2),

      fonts: song.fonts,
      key: song.key,
      youtube: song.youtube,

      lyrics: song.lyrics,
      meta: song.meta
    });
  });

  return new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });
}
