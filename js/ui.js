import { getAllCategories, getAllSongs, getSongsByCategory, searchSongsGlobal, searchSongsByCategory } from "./queries.js";
import { fetchRemoteIndex, fetchCategoryXML, getRemoteCategoryById } from "./remote.js";
import { importCategoryFromXML } from "./importer.js";

const screens = {
  categories: document.getElementById("screen-categories"),
  songs: document.getElementById("screen-songs"),
  songView: document.getElementById("screen-song-view"),
  import: document.getElementById("screen-import")
};

const uiLock = document.getElementById("ui-lock");

function lockUI(text = "Please wait…") {
  uiLock.querySelector(".ui-lock-text").textContent = text;
  uiLock.classList.remove("hidden");
}

function unlockUI() {
  uiLock.classList.add("hidden");
}

function showScreen(name, push = true) {
  Object.values(screens).forEach(s => s.classList.add("hidden"));
  screens[name].classList.remove("hidden");

  if (push) {
    history.pushState({ screen: name }, "");
  }
}

/* ==========================
   CATEGORY SCREEN
========================== */

export async function renderCategories(onSelect, push = true) {
  showScreen("categories", push);

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

export async function renderSongList(categoryId, onSelectSong, push = true) {
  showScreen("songs", push);

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
      lockUI("Updating songs…");
      updateBtn.disabled = true;

      try {
        const remoteCat = await getRemoteCategoryById(categoryId);
        if (!remoteCat) throw new Error("Remote category not found");

        const xml = await fetchCategoryXML(remoteCat.file);

        await importCategoryFromXML(xml, percent => {
          updateBtn.textContent = `Updating… ${Math.round(percent)}%`;
          lockUI(`Updating songs… ${Math.round(percent)}%`);
        });

        updateBtn.textContent = "Updated ✓";
      } catch (err) {
        console.error(err);
        updateBtn.textContent = "Update Failed";
        alert("Failed to update songs. Please try again.");
      } finally {
        unlockUI();
        updateBtn.disabled = false;

        setTimeout(() => {
          updateBtn.textContent = "Update Songs";
        }, 1500);
      }
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

export function renderSongView(song, push = true) {
  showScreen("songView", push);

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

export async function renderImportScreen(onDone, push = true) {
  showScreen("import", push);

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
      lockUI("Importing category…");

      try {
        li.textContent = `${cat.name} (Importing… 0%)`;

        const xml = await fetchCategoryXML(cat.file);

        await importCategoryFromXML(xml, p => {
          li.textContent = `${cat.name} (Importing… ${Math.round(p)}%)`;
          lockUI(`Importing… ${Math.round(p)}%`);
        });

        li.textContent = `${cat.name} ✔`;
      } catch (e) {
        li.textContent = `${cat.name} ❌`;
      } finally {
        unlockUI();
      }
    };

    list.appendChild(li);
  });
}

export { lockUI, unlockUI };
