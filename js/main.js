import {
  renderCategories,
  renderSongList,
  renderSongView,
  renderImportScreen
} from "./ui.js";

let isHandlingPopState = false;
let currentCategory = null;
let currentSongs = [];

window.onpopstate = e => {
  if (!e.state || !e.state.screen) return;

  isHandlingPopState = true;

  const screen = e.state.screen;

  if (screen === "categories") {
    renderCategories(onCategorySelect, false);
  }

  if (screen === "songs") {
    renderSongList(currentCategory, onSongSelect, false);
  }

  if (screen === "import") {
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
