import { getText } from "./utils.js";

export function parseSong(songEl) {
  const slide1 = getText(songEl, "slide");
  const slide2 = getText(songEl, "slide2");

  return {
    category: getText(songEl, "category"),

    name: getText(songEl, "name"),
    name2: getText(songEl, "name2"),

    fonts: {
      primary: getText(songEl, "font"),
      secondary: getText(songEl, "font2")
    },

    key: getText(songEl, "key"),
    youtube: getText(songEl, "yvideo"),

    lyrics: {
      primaryRaw: slide1,
      secondaryRaw: slide2,
      hasDual: slide2.replace(/\s+/g, "").length > 0
    },

    meta: {
      timestamp: getText(songEl, "timestamp"),
      bkgnd: getText(songEl, "bkgnd"),
      copyright: getText(songEl, "copyright"),
      notes: getText(songEl, "notes"),
      tags: getText(songEl, "tags"),
      slideseq: getText(songEl, "slideseq"),
      subcat: getText(songEl, "subcat")
    }
  };
}

export function parseSongDB(xmlText) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "text/xml");

  const songNodes = xmlDoc.getElementsByTagName("song");
  const songs = [];

  for (let i = 0; i < songNodes.length; i++) {
    songs.push(parseSong(songNodes[i]));
  }

  return songs;
}
