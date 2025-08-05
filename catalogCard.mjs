// Factory function to create catalog cards with plain HTML/DOM
// @ts-check

// Global dialog elements
import { CATALOG_DATA } from "./catalogData.mjs";
const FAV_STORAGE_KEY = "lego-app-fav";
/** @type {{current: Set<string>}} */
export const favCacheRef = { current: new Set() };

function loadFavs() {
  let data = [];
  try {
    const stored = localStorage.getItem(FAV_STORAGE_KEY);
    const json = stored ? JSON.parse(stored) : [];
    if (Array.isArray(json)) {
      data = json;
    }
  } catch (error) {
    console.warn(
      "Failed to load omit list from localStorage, using default:",
      error
    );
  }
  try {
    favCacheRef.current = new Set(data);
  } catch (error) {
    console.error(error);
    favCacheRef.current = new Set();
  }
}
loadFavs();
function saveFavs() {
  try {
    localStorage.setItem(
      FAV_STORAGE_KEY,
      JSON.stringify([...(favCacheRef.current || [])])
    );
    return true;
  } catch (error) {
    console.error("Failed to save fav list to localStorage:", error);
    return false;
  }
}

// Reset omit list to default
function resetFavs() {
  favCacheRef.current?.clear();
  saveFavs();
}

// Add new omit rule
function addFav(id) {
  favCacheRef.current?.add(id);
  saveFavs();
}

function removeFav(id) {
  favCacheRef.current?.delete(id);
  saveFavs();
}

let dialogImg;
/** @type {HTMLDialogElement | null} */
const LARGE_IMAGE_DIALOG = document.querySelector(".large-image-dialog");
const LARGE_IMAGE_DIALOG_IMG = document.querySelector("#modal-img");

function handleModalImgError() {
  LARGE_IMAGE_DIALOG_IMG?.addEventListener(
    "error",
    (event) => {
      console.error(event);
      if (event.target instanceof HTMLImageElement) {
        const img = event.target;
        if (img.src !== img.dataset.fallback)
          img.src = img.dataset.fallback || "";
      }
    },
    { once: true }
  );
}

function setImage(img) {
  try {
    if (img.src && dialogImg && LARGE_IMAGE_DIALOG) {
      handleModalImgError();
      dialogImg.src = "";
      dialogImg.src = img.src.replace("images", "large").replace("_med.", ".");
      LARGE_IMAGE_DIALOG.showModal();
      return true;
    }
  } catch (error) {
    console.error(error);
  }
  return false;
}

export function createCatalogCard(data) {
  /** @type {HTMLDivElement & {_cardData?: typeof data}} */
  const card = document.createElement("div");
  card.className = "row";

  // Create the card HTML structure
  card.innerHTML = `
      <img class="img" loading="lazy" decoding="async" />
      <div class="price text-outline">${data.price || ""}</div>
      <span class="year text-outline">${
        data.year || ""
      } <button class="fav-btn">${
    favCacheRef.current?.has(data.itemnumber) ? "❤️" : "♡"
  }</button></span>
      <div class="linkWrapper">
          <div class="name">${data.name || ""}</div>
          <div>
            ${data.category || ""} ${data.itemnumber || ""}
          </div>
          <div>${data.note || ""}
          <span class="retired text-outline">retired</span> </div>
          <div class="links">
          <a class="legoLink" href="${
            data.links?.lego?.replace("-1", "") || "#"
          }" target="_blank">Lego</a>
          <a class="bricksetLink" href="${
            data.links?.brickset || "#"
          }" target="_blank">Brickset</a>
          <a class="bricklinkLink" href="${
            data.links?.bricklink || "#"
          }" target="_blank">Bricklink</a>
          </div>
      </div>
    `;
  /** @type {HTMLButtonElement|null} */
  const favBtn = card.querySelector(".fav-btn");

  favBtn?.addEventListener("click", () => {
    if (!favCacheRef.current) {
      return;
    } else if (!favCacheRef.current.has(data.itemnumber)) {
      addFav(data.itemnumber);
      favBtn.textContent = "❤️";
    } else {
      removeFav(data.itemnumber);
      favBtn.textContent = "♡";
    }
  });
  // Set image source
  /** @type {HTMLImageElement | null} */
  const img = card.querySelector(".img");

  if (data.img && img) {
    img.src = data.img;
    // Add click handler for image modal
    img.addEventListener(
      "click",
      () => {
        if (img.src && !dialogImg) {
          dialogImg = document.getElementById("modal-img");
        }
        const fallback = `https://images.brickset.com/sets/large/${data.itemnumber}.jpg`;
        dialogImg.dataset.fallback = fallback;
        if (!setImage(img)) {
          dialogImg.src = fallback;
          setImage(img);
        }
      },
      { passive: true }
    );
  }
  // Set aspect ratio if provided
  if (data["aspect-ratio"] && img) {
    img.style.aspectRatio = data["aspect-ratio"].toString().slice(0, 6);
  }

  // Set retired visibility
  /** @type {HTMLElement | null} */
  const retiredEl = card.querySelector(".retired");
  if (retiredEl) {
    retiredEl.style.display = data.retired ? "inline" : "none";
  }

  // Store data for potential updates
  card._cardData = data;

  // Register in global catalog data structure
  const existingEntry = CATALOG_DATA.get(data.itemnumber);
  if (existingEntry) {
    existingEntry.element = card;
  } else {
    CATALOG_DATA.set(data.itemnumber, {
      data,
      element: card,
      placeholder: null,
    });
  }

  return card;
}
