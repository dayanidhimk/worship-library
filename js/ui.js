import { getAllCategories, getAllSongs, getSongsByCategory, searchSongsGlobal, searchSongsByCategory, getSongById } from "./queries.js";
import { fetchRemoteIndex, fetchCategoryXML, getRemoteCategoryById } from "./remote.js";
import { importCategoryFromXML } from "./importer.js";
import { getSetlist, removeFromSetlist, addToSetlist } from "./setlist.js";
import { t } from "./lang.js";

const screens = {
  categories: document.getElementById("screen-categories"),
  songs: document.getElementById("screen-songs"),
  songView: document.getElementById("screen-song-view"),
  import: document.getElementById("screen-import"),
  setlist: document.getElementById("screen-setlist")
};

let currentScreen = "categories";
let songViewSource = "categories"; // or "setlist"

const uiLock = document.getElementById("ui-lock");

function lockUI(text = "Please wait…") {
  uiLock.querySelector(".ui-lock-text").textContent = text;
  uiLock.classList.remove("hidden");
}

function unlockUI() {
  uiLock.classList.add("hidden");
}

export function getCurrentScreen() {
  return currentScreen;
}

function showScreen(name, push = true, state = {}) {
  Object.values(screens).forEach(s => s.classList.add("hidden"));
  screens[name].classList.remove("hidden");

  currentScreen = name;

  // RESET SCROLL POSITION
  const appBody = document.querySelector(".app-body");
  if (appBody) {
    appBody.scrollTop = 0;
  }

  if (push) {
    history.pushState(
      {
        screen: name,
        homeTab: state.homeTab || null,
        from: state.from || null
      },
      ""
    );
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
  allLi.textContent = t("all_songs");
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
        showToast("Failed to update songs. Please try again.");
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
      li.onclick = () => {
        songViewSource = "categories";
        onSelectSong(song);
      };
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
  showScreen("songView", push, {
    from: songViewSource,
    homeTab: songViewSource
  });

  document.getElementById("song-title").textContent = song.name;

  const container = document.getElementById("lyrics-container");
  container.innerHTML = "";

   /* ==========================
     SONG META (Key, YouTube)
  ========================== */
  const metaBar = document.createElement("div");
  metaBar.className = "song-meta";

  if (song.key) {
    const keyEl = document.createElement("span");
    keyEl.className = "song-meta-item key";
    keyEl.textContent = `🎹 ${t("key")}: ${song.key}`;
    metaBar.appendChild(keyEl);
  }

  if (song.youtube) {
    const yt = document.createElement("a");
    yt.className = "song-meta-item song-meta-link";
    yt.href = song.youtube;
    yt.target = "_blank";
    yt.rel = "noopener";
    yt.textContent = `▶︎ ${t("youtube")}`;
    metaBar.appendChild(yt);
  }

  // --- FONT SIZE CONTROLS ---
  const fontCtrl = document.createElement("div");
  fontCtrl.className = "font-controls";

  const decBtn = document.createElement("button");
  decBtn.textContent = "A−";
  decBtn.className = "font-btn";

  const incBtn = document.createElement("button");
  incBtn.textContent = "A+";
  incBtn.className = "font-btn";

  fontCtrl.appendChild(decBtn);
  fontCtrl.appendChild(incBtn);
  metaBar.appendChild(fontCtrl);

  let currentFontSize = 1; // em

  function applyFontSize() {
    container.querySelectorAll(".lyrics-text").forEach(el => {
      el.style.fontSize = `${currentFontSize}em`;
    });
  }

  incBtn.onclick = () => {
    currentFontSize = Math.min(currentFontSize + 0.1, 1.6);
    applyFontSize();
  };

  decBtn.onclick = () => {
    currentFontSize = Math.max(currentFontSize - 0.1, 0.8);
    applyFontSize();
  };


  
  if (metaBar.children.length > 0) {
    container.appendChild(metaBar);
  }
  
  /* ==========================
     ADD TO SCHEDULE BUTTON
  ========================== */
  const addBtn = document.createElement("button");
  addBtn.className = "secondary-btn";
  addBtn.textContent = t("add_to_setlist");

  addBtn.onclick = async () => {
    const added = await addToSetlist(song.id);

    if (!added) {
      showToast(t("already_in_setlist"));
      return;
    }

    showToast(t("added_to_setlist"));
    addBtn.disabled = true;
  };


  container.prepend(addBtn);
  
  function renderLyrics(raw, font) {
    if (!raw) return;

    // Normalize slides & line breaks
    let text = raw
      .replace(/<slide>/gi, "\n\n")
      .replace(/<BR>/gi, "\n");

    // Split into lines, trim each line
    const lines = text
      .split("\n")
      .map(line => line.trim());

    // Remove consecutive empty lines
    const cleanedLines = [];
    let previousEmpty = false;

    for (const line of lines) {
      if (line === "") {
        if (!previousEmpty) {
          cleanedLines.push("");
          previousEmpty = true;
        }
      } else {
        cleanedLines.push(line);
        previousEmpty = false;
      }
    }

    // Join back & trim start/end whitespace
    const finalText = cleanedLines.join("\n").trim();

    // Don’t render empty lyrics blocks
    if (!finalText) return;
    
    const div = document.createElement("div");
    div.className = "lyrics-text";
    const resolved = resolveFont(font);
    div.style.fontFamily = resolved.family;
    div.style.fontWeight = resolved.weight;
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

/* ==========================
   SETLIST SCREEN
========================== */

export async function renderSetlist(push = true) {
  showScreen("setlist", push);

  const list = document.getElementById("setlist-list");
  list.innerHTML = "";

  const items = await getSetlist();

  if (items.length === 0) {
    list.innerHTML = "<li class='muted'>No songs in " + t("setlist") + "</li>";
    return;
  }

  for (const item of items) {
    const song = await getSongById(item.songId);
    if (!song) continue;

    const li = document.createElement("li");
    li.className = "setlist-item";

    const title = document.createElement("span");
    title.textContent = song.name;
    title.onclick = () => {
      songViewSource = "setlist";
      renderSongView(song, true);
    };

    const removeBtn = document.createElement("button");
    removeBtn.textContent = t("remove_song");
    removeBtn.className = "remove-btn";
    removeBtn.onclick = async (e) => {
      e.stopPropagation();
      await removeFromSetlist(item.id);
      renderSetlist();
    };

    li.appendChild(title);
    li.appendChild(removeBtn);
    list.appendChild(li);
  }
}

function resolveFont(fontName) {
  if (!fontName) {
    return {
      family: "inherit",
      weight: "normal"
    };
  }

  const map = {
    "Baloo Thambi": {
      family: "'Baloo Thambi 2', sans-serif",
      weight: 600
    },
    "Noto Sans Kannada SemiBold": {
      family: "'Noto Sans Kannada', sans-serif",
      weight: 600
    },
    "Noto Sans Kannada": {
      family: "'Noto Sans Kannada', sans-serif",
      weight: 500
    }
  };

  return map[fontName] || {
    family: fontName,
    weight: "normal"
  };
}

export async function showToast(message, duration = 2000) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, duration);
}

export function setActiveTab(tab) {
  document
    .querySelectorAll(".home-tabs .tab")
    .forEach(el => el.classList.remove("active"));

  document
    .querySelector(`#tab-${tab}`)
    ?.classList.add("active");
}

export { lockUI, unlockUI };
