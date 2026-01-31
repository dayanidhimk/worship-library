import {
  renderCategories,
  renderSongList,
  renderSongView,
  renderImportScreen,
  renderSetlist
} from "./ui.js";
import { clearSetlist } from "./setlist.js";
import { getCurrentScreen, showToast } from "./ui.js";
import { t } from "./lang.js";

document.getElementById("app-title").textContent = t("app_name");
document.getElementById("open-setlist").textContent = t("setlist");
document.getElementById("open-import").textContent = t("import_category");
document.getElementById("back-to-categories").textContent = t("back_to_categories");
document.getElementById("back-to-songs").textContent = t("back_to_songs");
document.getElementById("back-to-categories-from-import").textContent = t("back");
document.getElementById("import-categories").textContent = t("import_categories");
document.getElementById("back-to-categories-from-setlist").textContent = t("back");
document.getElementById("setlist").textContent = t("setlist");
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

  // Normal navigation (NOT home)
  if (!e.state || !e.state.screen) {
    isHandlingPopState = false;
    return;
  }

  const target = e.state.screen;

  if (target === "songs") {
    renderSongList(currentCategory, onSongSelect, false);
  } else if (target === "categories") {
    renderCategories(onCategorySelect, false);
  } else if (target === "import") {
    renderCategories(onCategorySelect, false);
  }

  isHandlingPopState = false;
};

document.getElementById("back-to-categories").onclick = () => {
  renderCategories(onCategorySelect);
};

document.getElementById("back-to-songs").onclick = () => {
  renderSongList(currentCategory, onSongSelect);
};

document.getElementById("back-to-categories-from-import").onclick = () => {
  renderCategories(onCategorySelect);
};

document.getElementById("open-setlist").onclick = () => {
  renderSetlist();
};

document.getElementById("back-to-categories-from-setlist").onclick = () => {
  renderCategories(onCategorySelect);
};

document.getElementById("clear-setlist").onclick = async () => {
  await clearSetlist();
  renderSetlist();
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

function onCategorySelect(categoryId) {
  currentCategory = categoryId;
  renderSongList(categoryId, onSongSelect, true);
}

function onSongSelect(song) {
  renderSongView(song, true);
}

// App start
history.replaceState({ screen: "categories" }, "");
renderCategories(onCategorySelect, false);
