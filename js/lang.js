const LANG = {
  app_name: "Worship Library",

  categories: "Categories",
  songs: "Songs",
  setlist: "Schedule",

  key: "Key",
  youtube: "YouTube",

  all_songs: "All Songs",

  add_to_setlist: "Add to Schedule",
  already_in_setlist: "Song is already in the schedule ✓",
  added_to_setlist: "Song added to schedule ✓",
  clear_setlist: "Clear Schedule",

  update_songs: "Update Songs",
  import_category: "Import Category",
  import_categories: "Import Categories",

  back: "← Back",
  back_to_categories: "← Categories",
  back_to_songs: "← Songs",
  press_back_again: "Press back again to exit",
  
  remove_song: "Remove Song",

  import_setlist: "Import Schedule",
  export_setlist: "Export Schedule"
};

export function t(key) {
  return LANG[key] || key;
}
