const BASE_URL =
  "https://raw.githubusercontent.com/dayanidhimk/lyrics-database/main/";

export async function fetchRemoteIndex() {
  const res = await fetch(BASE_URL + "index.json");
  if (!res.ok) throw new Error("Failed to load index.json");
  return res.json();
}

export async function fetchCategoryXML(fileName) {
  const res = await fetch(BASE_URL + fileName);
  if (!res.ok) throw new Error("Failed to load XML");
  return res.text();
}

export async function getRemoteCategoryById(categoryId) {
  const index = await fetchRemoteIndex();
  return index.find(c => c.id === categoryId);
}
