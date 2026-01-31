import { openDB } from "./db.js";
import { parseSongDB } from "./parser.js";

function normalizeText(text) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function generateSongId(categoryId, index) {
  return `${categoryId}_${String(index).padStart(4, "0")}`;
}

export async function importCategoryFromXML(xmlText, onProgress) {
  onProgress?.(5);

  const songsParsed = parseSongDB(xmlText);
  if (songsParsed.length === 0) {
    onProgress?.(100);
    return;
  }

  const categoryId = songsParsed[0].category;
  const db = await openDB();

  // DELETE OLD SONGS (WAIT FOR COMPLETION)
  await new Promise((resolve) => {
    const tx = db.transaction("songs", "readwrite");
    const store = tx.objectStore("songs");
    const index = store.index("categoryId");

    const req = index.openCursor(IDBKeyRange.only(categoryId));
    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        store.delete(cursor.primaryKey);
        cursor.continue();
      }
    };

    tx.oncomplete = () => resolve();
  });

  onProgress?.(30);

  // INSERT CATEGORY + SONGS
  const tx = db.transaction(["categories", "songs"], "readwrite");
  const categoryStore = tx.objectStore("categories");
  const songStore = tx.objectStore("songs");

  categoryStore.put({
    id: categoryId,
    name: categoryId,
    songCount: songsParsed.length,
    lastUpdated: Date.now()
  });

  const total = songsParsed.length;

  songsParsed.forEach((song, i) => {
    songStore.put({
      id: generateSongId(categoryId, i + 1),
      categoryId,

      name: song.name,
      name2: song.name2,
      searchIndex: normalizeText(song.name + " " + song.name2),

      fonts: song.fonts,
      key: song.key,
      youtube: song.youtube,

      lyrics: song.lyrics,
      meta: song.meta
    });

    const percent = 30 + ((i + 1) / total) * 70;
    onProgress?.(percent);
  });

  return new Promise((resolve) => {
    tx.oncomplete = () => {
      onProgress?.(100);
      resolve();
    };
  });
}
