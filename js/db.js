const DB_NAME = "lyricsDB";
const DB_VERSION = 1;

let dbInstance = null;

export function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject("Failed to open IndexedDB");

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Categories store
      if (!db.objectStoreNames.contains("categories")) {
        db.createObjectStore("categories", { keyPath: "id" });
      }

      // Songs store
      if (!db.objectStoreNames.contains("songs")) {
        const store = db.createObjectStore("songs", { keyPath: "id" });
        store.createIndex("categoryId", "categoryId", { unique: false });
        store.createIndex("name", "name", { unique: false });
        store.createIndex("searchIndex", "searchIndex", { unique: false });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };
  });
}
