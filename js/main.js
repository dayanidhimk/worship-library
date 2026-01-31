import {
  renderCategories,
  renderSongList,
  renderSongView,
  renderImportScreen
} from "./ui.js";

let currentCategory = null;
let currentSongs = [];

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
  renderSongList(categoryId, onSongSelect);
}

function onSongSelect(song) {
  renderSongView(song);
}

// App start
renderCategories(onCategorySelect);
