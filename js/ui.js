import { getAllCategories, getAllSongs, getSongsByCategory, searchSongsGlobal, searchSongsByCategory } from "./queries.js";
import { fetchRemoteIndex, fetchCategoryXML, getRemoteCategoryById } from "./remote.js";
import { importCategoryFromXML } from "./importer.js";

const screens = {
  categories: document.getElementById("screen-categories"),
  songs: document.getElementById("screen-songs"),
  songView: document.getElementById("screen-song-view"),
  import: document.getElementById("screen-import")
};

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.add("hidden"));
  screens[name].classList.remove("hidden");
}

/* ==========================
   CATEGORY SCREEN
========================== */

export async function renderCategories(onSelect) {
  showScreen("categories");

  const list = document.getElementById("category-list");
  list.innerHTML = "";

  const categories = await getAllCategories();

  // All Songs option
  const allLi = document.createElement("li");
  allLi.textContent = "All Songs";
  allLi.onclick = () => onSelect(null);
  list.appendChild(allLi);

  categories.forEach(cat => {
    const li = document.createElement("li");
    li.textContent = `${cat.name} (${cat.songCount})`;
    li.onclick = () => onSelect(cat.id);
    list.appendChild(li);
  });
}

/* ==========================
   SONG LIST SCREEN
========================== */

export async function renderSongList(categoryId, onSelectSong) {
  showScreen("songs");

  const title = document.getElementById("songs-title");
  const list = document.getElementById("song-list");
  const searchBox = document.getElementById("search-box");
  const updateBtn = document.getElementById("update-category-btn");

  title.textContent = categoryId || "All Songs";
  list.innerHTML = "";
  searchBox.value = "";

  // Show update button only for specific category
  updateBtn.style.display = categoryId ? "block" : "none";

  if (categoryId) {
    updateBtn.onclick = async () => {
      updateBtn.textContent = "Updating...";
      updateBtn.disabled = true;

      try {
        const remoteCat = await getRemoteCategoryById(categoryId);
        if (!remoteCat) throw new Error("Remote category not found");

        const xml = await fetchCategoryXML(remoteCat.file);
        await importCategoryFromXML(xml);

        updateBtn.textContent = "Updated ✓";
      } catch (err) {
        console.error(err);
        updateBtn.textContent = "Update Failed";
      }

      setTimeout(() => {
        updateBtn.textContent = "Update Songs";
        updateBtn.disabled = false;
      }, 1500);
    };
  }

  let songs = categoryId
    ? await getSongsByCategory(categoryId)
    : await getAllSongs();

  function render(items) {
    list.innerHTML = "";
    items.forEach(song => {
      const li = document.createElement("li");
      li.textContent = song.name;
      li.onclick = () => onSelectSong(song);
      list.appendChild(li);
    });
  }

  render(songs);

  searchBox.oninput = async () => {
    const q = searchBox.value.trim();
    if (!q) {
      render(songs);
      return;
    }

    const results = categoryId
      ? await searchSongsByCategory(categoryId, q)
      : await searchSongsGlobal(q);

    render(results);
  };
}

/* ==========================
   SONG VIEW SCREEN
========================== */

export function renderSongView(song) {
  showScreen("songView");

  document.getElementById("song-title").textContent = song.name;

  const container = document.getElementById("lyrics-container");
  container.innerHTML = "";

  function renderLyrics(raw, font) {
    const div = document.createElement("div");
    div.style.fontFamily = font || "inherit";
    div.innerHTML = raw
      .replace(/<slide>/g, "\n\n")
      .replace(/<BR>/g, "\n");
    container.appendChild(div);
  }

  renderLyrics(song.lyrics.primaryRaw, song.fonts.primary);

  if (song.lyrics.hasDual) {
    renderLyrics(song.lyrics.secondaryRaw, song.fonts.secondary);
  }
}

/* ==========================
   IMPORT SCREEN
========================== */

export async function renderImportScreen(onDone) {
  showScreen("import");

  const list = document.getElementById("import-list");
  list.innerHTML = "Loading...";

  const remoteCategories = await fetchRemoteIndex();
  const localCategories = await getAllCategories();
  const localIds = new Set(localCategories.map(c => c.id));

  list.innerHTML = "";

  remoteCategories.forEach(cat => {
    const li = document.createElement("li");

    const status = localIds.has(cat.id)
      ? " (Update)"
      : " (Import)";

    li.textContent = cat.name + status;

    li.onclick = async () => {
      li.textContent = cat.name + " (Importing...)";

      const xml = await fetchCategoryXML(cat.file);
      await importCategoryFromXML(xml);

      li.textContent = cat.name + " ✔";
    };

    list.appendChild(li);
  });
}
