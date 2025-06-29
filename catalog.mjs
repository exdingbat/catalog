import data, { THEMES, refreshData } from "./data.mjs";
import { performSearch } from "./search.mjs";
import { CATALOG_DATA } from "./catalogData.mjs";
import { createCatalogCard } from "./catalogCard.mjs";
import {
  toggleOmitListDialog,
  initializeOmitListUI,
  getOmitList,
  addOmitRule,
  removeOmitRule,
} from "./omitManager.mjs";
import { toggleThemeHierarchyDialog } from "./themeHierarchy.mjs";

const INITIAL_COLLAPSED = "true";
const DIALOG = document.querySelector("dialog");
const DIALOG_BUTTON = document.querySelector("dialog button");
const MAIN = document.getElementById("main");
const SEARCH_FORM = document.getElementById("searchForm");
const SEARCH = document.getElementById("search");
const SEARCH_SUGGESTIONS = document.getElementById("searchSuggestions");
const SEARCH_RESULTS = document.getElementById("searchResults");
const RESULT_COUNT = document.getElementById("resultCount");
const INITIAL_QUERY = new URLSearchParams(window.location.search).get("q");

// Cache for DOM elements and data
const DATA_CACHE = new Map();

// --- Dynamic search suggestions for themes and subthemes ---
const STATIC_OPTIONS = [
  { value: "theme:" },
  { value: "subtheme:" },
  { value: "name:" },
  { value: "itemnumber:" },
  { value: "year:" },
  { value: "retired:" },
];

// IntersectionObserver for lazy rendering
let intersectionObserver;

let searching = false;
SEARCH_FORM.addEventListener("search", (e) => {
  e.preventDefault();
  if (!searching) {
    searching = true;
    performSearch(SEARCH.value);
    setTimeout(() => {
      searching = false;
    }, 50);
  }
});

SEARCH_FORM.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!searching) {
    searching = true;
    performSearch(SEARCH.value);
    setTimeout(() => {
      searching = false;
    }, 50);
  }
});

// Add omit list management button to search container
function addOmitListButton() {
  const searchContainer = document.querySelector(".search-container");

  // Create omit button
  const omitButton = document.createElement("button");
  omitButton.type = "button";
  omitButton.className = "omit-list-btn";
  omitButton.title = "Manage filter rules";
  omitButton.innerHTML = "⚙️";
  omitButton.addEventListener("click", () => {
    toggleOmitListDialog();
  });

  // Create theme hierarchy button
  const hierarchyButton = document.createElement("button");
  hierarchyButton.type = "button";
  hierarchyButton.className = "theme-hierarchy-btn";
  hierarchyButton.title = "View theme hierarchy";
  hierarchyButton.innerHTML = "🌳";
  hierarchyButton.addEventListener("click", () => {
    toggleThemeHierarchyDialog();
  });

  // Insert both buttons after the search form
  searchContainer.insertBefore(omitButton, searchContainer.children[1]);
  searchContainer.insertBefore(hierarchyButton, searchContainer.children[2]);
}

// Function to refresh catalog data (exposed globally)
window.refreshCatalogData = function () {
  // Clear cache
  DATA_CACHE.clear();

  // Refresh data
  // Re-render catalog
  refreshData().then(renderLists);
};

// Calculate placeholder height based on aspect ratio
function calculatePlaceholderHeight(aspectRatio) {
  // Base card width (approximate)
  const cardWidth = 235;
  // linkWrapper height (hardcoded as specified)
  const linkWrapperHeight = 70;
  // Additional padding/margins
  const additionalHeight = 10;

  if (aspectRatio) {
    // Calculate image height based on aspect ratio
    const imageHeight = cardWidth / parseFloat(aspectRatio);
    return imageHeight + linkWrapperHeight + additionalHeight;
  }

  // Default height if no aspect ratio
  return 200 + linkWrapperHeight + additionalHeight;
}

// Create placeholder element
function createPlaceholder(data) {
  const placeholder = document.createElement("div");
  placeholder.className = "row placeholder";

  // Calculate height based on aspect ratio
  const height = calculatePlaceholderHeight(data["aspect-ratio"]);
  placeholder.style.height = `${height}px`;
  placeholder.style.backgroundColor = "#8d9093";
  placeholder.style.border = "solid thin white";
  placeholder.style.borderRadius = "2px";
  placeholder.style.marginBottom = "10px";

  // Store data for later rendering
  placeholder._cardData = data;

  // Register in global catalog data structure
  CATALOG_DATA.set(data.itemnumber, {
    data,
    element: null,
    placeholder,
  });

  return placeholder;
}

// Initialize IntersectionObserver
function initializeIntersectionObserver() {
  if (intersectionObserver) {
    intersectionObserver.disconnect();
  }
  intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const placeholder = entry.target;
          const data = placeholder._cardData;

          if (data) {
            const card = createCatalogCard(data);
            if (placeholder.hidden) {
              card.hidden = true;
            }
            placeholder.parentNode.replaceChild(card, placeholder);
            const catalogEntry = CATALOG_DATA.get(data.itemnumber);
            if (catalogEntry) {
              catalogEntry.element = card;
              catalogEntry.placeholder = null;
            }
            intersectionObserver.unobserve(placeholder);
          }
        }
      });
    },
    {
      rootMargin: "200px",
      threshold: 0.1,
    },
  );
}

// Optimized data processing with caching
const getListItemData = (rows) => {
  const cacheKey =
    rows.length > 0
      ? `${rows.theme}-${rows[0].itemnumber}-${rows.length}`
      : "empty";
  if (DATA_CACHE.has(cacheKey)) {
    return DATA_CACHE.get(cacheKey);
  }

  const result = rows.sort((a, b) =>
    a.year === b.year ? a.name?.localeCompare(b.name) : b.year - a.year,
  );

  DATA_CACHE.set(cacheKey, result);
  return result;
};

// Optimized list item creation with IntersectionObserver placeholders
function makeListItems(items) {
  if (!items.length) return null;

  const listData = getListItemData(items);

  const h2 = document.createElement("h2");
  const button = document.createElement("button");
  // Add click handler for collapsible functionality
  button.addEventListener("click", () => {
    const isCollapsed = h2.getAttribute("data-collapsed") === "true";
    h2.setAttribute("data-collapsed", !isCollapsed);
  });

  button.innerHTML = `${items.title} <span style="font-family:sans-serif; font-size: 12px; margin-left: 1em;">${items[0].themeGroup}</span>`;

  // Add omit control for the theme
  const themeName = items.title;
  const themeGroupName = items[0].themeGroup;
  const omitList = getOmitList();

  // Check if this theme is currently omitted
  const isOmitted = omitList.some(
    (rule) =>
      (rule[0] === themeGroupName || rule[0] === null) && rule[1] === themeName,
  );

  // Create omit control button
  const omitControl = document.createElement("button");
  omitControl.className = "h2-omit-control";
  omitControl.title = isOmitted
    ? "Remove filter for this theme"
    : "Filter out this theme";
  omitControl.textContent = "🚫";

  omitControl.addEventListener("click", (e) => {
    e.stopPropagation();
    if (isOmitted) {
      // Remove the omit rule
      const currentOmitList = getOmitList();
      const ruleIndex = currentOmitList.findIndex(
        (rule) =>
          (rule[0] === themeGroupName || rule[0] === null) &&
          rule[1] === themeName,
      );
      if (ruleIndex !== -1) {
        removeOmitRule(ruleIndex);
        // Update the button appearance
        omitControl.textContent = "🚫";
        omitControl.title = "Filter out this theme";
        // Refresh catalog data
        if (window.refreshCatalogData) {
          window.refreshCatalogData();
        }
      }
    } else {
      // Add omit rule for this theme
      addOmitRule(themeGroupName, themeName, "", "");
      // Update the button appearance
      omitControl.textContent = "✅";
      omitControl.title = "Remove filter for this theme";
      // Refresh catalog data
      if (window.refreshCatalogData) {
        window.refreshCatalogData();
      }
    }
  });

  // Add omit control first, then the button
  h2.appendChild(omitControl);
  h2.append(button);
  // Add collapsible functionality to the heading
  h2.setAttribute("data-collapsed", INITIAL_COLLAPSED);

  const listItems = [];

  // Initialize IntersectionObserver if not already done
  if (!intersectionObserver) {
    initializeIntersectionObserver();
  }

  // Create placeholders for all data (no pre-filtering)
  listData.forEach((itemData) => {
    const placeholder = createPlaceholder(itemData);

    intersectionObserver.observe(placeholder);
    listItems.push(placeholder);
  });

  return { listItems, title: h2 };
}

let i = 0;
function makeList({ title, listItems }) {
  const list = document.createElement("div");
  list.classList.add("multicol", "list");
  i++;

  // Cache column count calculation
  const colCount = Math.max(2, Math.floor(window.innerWidth / 235));
  list.style.setProperty(`--col`, colCount);

  // Use append instead of spread for better performance
  list.append(...listItems);
  return [title, list];
}

function renderLists(catalogData = data) {
  MAIN.innerHTML = "";
  const fragment = document.createDocumentFragment();

  // Process all lists asynchronously
  for (const listData of catalogData) {
    const listItems = makeListItems(listData);
    if (listItems) {
      const [title, list] = makeList(listItems);
      fragment.appendChild(title);
      fragment.appendChild(list);
    }
  }

  // Single DOM update - append the entire fragment
  MAIN.appendChild(fragment);
}

// Cache for search suggestions
const suggestionCache = new Map();

function updateSearchSuggestions(inputValue = "") {
  const cacheKey = inputValue;
  if (suggestionCache.has(cacheKey)) {
    SEARCH_SUGGESTIONS.innerHTML = suggestionCache.get(cacheKey);
    return;
  }

  const fragment = document.createDocumentFragment();

  STATIC_OPTIONS.forEach((opt) => {
    const option = document.createElement("option");
    option.value = opt.value;
    fragment.appendChild(option);
  });

  const trimmed = inputValue.trim().toLowerCase();
  if (trimmed.startsWith("theme:")) {
    for (const theme of THEMES.keys()) {
      const opt = document.createElement("option");
      opt.value = `theme:${theme}`;
      fragment.appendChild(opt);
    }
  }
  if (trimmed.startsWith("subtheme:")) {
    for (const subtheme of new Set(
      [...THEMES.values()].map((x) => [...x]).flat(),
    )) {
      const opt = document.createElement("option");
      opt.value = `subtheme:${subtheme}`;
      fragment.appendChild(opt);
    }
  }
  if (trimmed.startsWith("retired:")) {
    ["true", "false", "yes", "no"].forEach((val) => {
      const opt = document.createElement("option");
      opt.value = `retired:${val}`;
      fragment.appendChild(opt);
    });
  }

  // Cache the result
  const tempDiv = document.createElement("div");
  tempDiv.appendChild(fragment);
  suggestionCache.set(cacheKey, tempDiv.innerHTML);

  SEARCH_SUGGESTIONS.innerHTML = tempDiv.innerHTML;
}

// Initial population
updateSearchSuggestions();

// Update suggestions as user types with debouncing
let suggestionTimeout;
SEARCH.addEventListener("input", (e) => {
  clearTimeout(suggestionTimeout);
  suggestionTimeout = setTimeout(() => {
    updateSearchSuggestions(e.target.value);
  }, 100);
});

DIALOG_BUTTON.addEventListener("click", () => {
  DIALOG.close();
  DIALOG.style.visibility = "hidden";
});

// Set initial search value if there's an initial query
if (INITIAL_QUERY) {
  SEARCH.value = INITIAL_QUERY;
}

// Initialize omit list button
addOmitListButton();

// Initialize omit list UI
initializeOmitListUI();

// Render all lists first (all placeholders will be created)
renderLists(data);

// Apply initial search after rendering all placeholders
if (INITIAL_QUERY) {
  performSearch(INITIAL_QUERY);
}
