import {
  renderCategories,
  renderSongList,
  renderSongView,
  renderImportScreen,
  renderSetlist
} from "./ui.js";
import { clearSetlist } from "./setlist.js";
import { getCurrentScreen, showToast, setActiveTab, getSongViewSource } from "./ui.js";
import { t } from "./lang.js";

document.getElementById("app-title").textContent = t("app_name");
document.getElementById("tab-categories").textContent = t("categories");
document.getElementById("tab-setlist").textContent = t("setlist");
document.getElementById("open-import").textContent = t("import_category");
document.getElementById("back-to-categories").textContent = t("back_to_categories");
document.getElementById("back-to-songs").textContent = t("back_to_songs");
document.getElementById("back-to-categories-from-import").textContent = t("back");
document.getElementById("import-categories").textContent = t("import_categories");
// document.getElementById("back-to-categories-from-setlist").textContent = t("back");
// document.getElementById("setlist").textContent = t("setlist");
document.getElementById("clear-setlist").textContent = t("clear_setlist");
let isHandlingPopState = false;
let currentCategory = null;
let currentSongs = [];

let lastBackPressTime = 0;

window.onpopstate = e => {
  if (isHandlingPopState) return;
  isHandlingPopState = true;

  const current = getCurrentScreen();

  if (current === "categories") {
    const now = Date.now();

    if (now - lastBackPressTime < 2000) {
      // Let Android exit the app
      if (navigator.app && navigator.app.exitApp) {
        navigator.app.exitApp();
      }
      isHandlingPopState = false;
      return;
    }

    lastBackPressTime = now;
    showToast(t("press_back_again"));

    // Cancel this back action by restoring history
    history.pushState({ screen: "categories" }, "");
    isHandlingPopState = false;
    return;
  }
  
  const state = e.state;
  if (!state || !state.screen) {
    isHandlingPopState = false;
    return;
  }

  // Restore tab FIRST
  if (state.homeTab) {
    setActiveTab(state.homeTab);
  }

  switch (state.screen) {
    case "songView":
      // Should not really happen (song object not serializable)
      // So we fallback correctly
      if (state.from === "setlist") {
        renderSetlist(false);
        setActiveTab("setlist");
      } else {
        renderCategories(onCategorySelect, false);
        setActiveTab("categories");
      }
      break;

    case "setlist":
      renderSetlist(false);
      setActiveTab("setlist");
      break;

    case "categories":
      renderCategories(onCategorySelect, false);
      setActiveTab("categories");
      break;

    case "songs":
      renderSongList(currentCategory, onSongSelect, false);
      setActiveTab("categories");
      break;

    default:
      renderCategories(onCategorySelect, false);
      setActiveTab("categories");
  }

  isHandlingPopState = false;
};

document.getElementById("tab-categories").onclick = () => {
  switchHomeTab("categories");
};

document.getElementById("tab-setlist").onclick = () => {
  switchHomeTab("setlist");
};

document.getElementById("back-to-categories").onclick = () => {
  renderCategories(onCategorySelect);
};

document.getElementById("back-to-songs").onclick = () => {
  const source = getSongViewSource();

  if (source === "setlist") {
    renderSetlist(true);
    setActiveTab("setlist");
  } else {
    renderSongList(currentCategory, onSongSelect, true);
    setActiveTab("categories");
  }
};

document.getElementById("back-to-categories-from-import").onclick = () => {
  renderCategories(onCategorySelect);
};

// document.getElementById("back-to-categories-from-setlist").onclick = () => {
//   renderCategories(onCategorySelect);
// };

document.getElementById("clear-setlist").onclick = async () => {
  await clearSetlist();
  renderSetlist();
  setActiveTab("setlist");
};

// // TEMP: long press / keyboard shortcut
// document.addEventListener("keydown", e => {
//   if (e.key === "i") {
//     renderImportScreen(() => {
//       renderCategories(onCategorySelect);
//     });
//   }
// });

document.getElementById("open-import").onclick = () => {
  renderImportScreen(() => renderCategories(onCategorySelect));
};

function switchHomeTab(tab) {
  setActiveTab(tab);

  if (tab === "categories") {
    renderCategories(onCategorySelect, true);
    history.replaceState({ screen: "categories", homeTab: "categories" }, "");
  } else {
    renderSetlist(true);
    history.replaceState({ screen: "setlist", homeTab: "setlist" }, "");
  }
}

function onCategorySelect(categoryId) {
  currentCategory = categoryId;
  renderSongList(categoryId, onSongSelect, true);
}

function onSongSelect(song) {
  renderSongView(song, true);
}

// App start
history.replaceState({ screen: "categories" }, "");
switchHomeTab("categories");
