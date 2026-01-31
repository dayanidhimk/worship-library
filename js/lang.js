const LANG = {
  app_name: "Worship Library",

  categories: "Categories",
  songs: "Songs",
  setlist: "Schedule",
  all_songs: "All Songs",
  add_to_setlist: "Add to Schedule",
  already_in_setlist: "This song is already in the schedule",
  added_to_setlist: "Song added to schedule ✓",
  clear_setlist: "Clear Schedule",
  update_songs: "Update Songs",
  import_category: "Import Category",
  back: "← Back",
  back_to_categories: "← Categories",
  back_to_songs: "← Songs",
  remove_song: "Remove Song",
  import_categories: "Import Categories"
};

export function t(key) {
  return LANG[key] || key;
}
