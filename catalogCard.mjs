// Factory function to create catalog cards with plain HTML/DOM
// @ts-check

// Global dialog elements
import { CATALOG_DATA } from "./catalogData.mjs";

let dialogImg;
const DIALOG = document.querySelector("dialog");

export function createCatalogCard(data) {
  /** @type {HTMLDivElement & {_cardData?: typeof data}} */
  const card = document.createElement("div");
  card.className = "row";

  // Create the card HTML structure
  card.innerHTML = `
      <img class="img" loading="lazy" decoding="async" />
      <div class="price text-outline">${data.price || ""}</div>
      <span class="year text-outline">${data.year || ""}</span>
      <div class="linkWrapper">
          <div class="name">${data.name || ""}</div>
          <div>
            ${data.category || ""} ${data.itemnumber || ""}
          </div>
          <div>${data.note || ""}
          <span class="retired text-outline">retired</span> </div>
          <div class="links">
          <a class="legoLink" href="${data.links?.lego || "#"}" target="_blank">Lego</a>
          <a class="bricksetLink" href="${data.links?.brickset || "#"}" target="_blank">Brickset</a>
          <a class="bricklinkLink" href="${data.links?.bricklink || "#"}" target="_blank">Bricklink</a>
          </div>
      </div>
    `;

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
        if (img.src && dialogImg && DIALOG) {
          dialogImg.src = "";
          dialogImg.src = img.src.replace("images", "large");
          DIALOG.style.visibility = "visible";
          DIALOG.showModal();
        }
      },
      { passive: true },
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
