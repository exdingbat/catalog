const FAV_STORAGE_KEY = "lego-app-fav";
/** @type {{current: null|Set<string>}} */
export const favCacheRef = { current: null };

function loadFavs() {
  let data = [];
  try {
    const stored = localStorage.getItem(FAV_STORAGE_KEY);
    data = stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn(
      "Failed to load omit list from localStorage, using default:",
      error
    );
    favCacheRef.current = new Set(data);
  }
}

export function saveFavs() {
  try {
    localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(favCacheRef.current));
    return true;
  } catch (error) {
    console.error("Failed to save fav list to localStorage:", error);
    return false;
  }
}

// Reset omit list to default
export function resetFavs() {
  favCacheRef.current.clear();
  saveFavs();
}

// Add new omit rule
export function addFav(id) {
  favCacheRef.current.add(id);
  saveFavs();
}

export function removeFav(id) {
  favCacheRef.current.delete(id);
  saveFavs();
}
