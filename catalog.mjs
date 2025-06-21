import {
  performSearch,
  performSearchWithFlatData,
  CURRENT_SEARCH_STATE,
} from "./search.mjs";
import data, { THEMES } from "./data.mjs";
import { CATALOG_DATA } from "./catalogData.mjs";
import { createCatalogCard } from "./catalogCard.mjs";
const NOW = new Date();
const DIALOG = document.querySelector("dialog");
const DIALOG_BUTTON = document.querySelector("dialog button");
const MAIN = document.getElementById("main");
const SEARCH_FORM = document.getElementById("searchForm");
const SEARCH = document.getElementById("search");
const INITIAL_QUERY = new URLSearchParams(window.location.search).get("q");
const RESULT_COUNT = document.getElementById("resultCount");
const SEARCH_RESULTS = document.getElementById("searchResults");
// Cache for DOM elements and data
const DATA_CACHE = new Map();
// --- Dynamic search suggestions for themes and subthemes ---
const SEARCH_SUGGESTIONS = document.getElementById("searchSuggestions");
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
    }
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
    a.year === b.year ? a.name?.localeCompare(b.name) : b.year - a.year
  );

  DATA_CACHE.set(cacheKey, result);
  return result;
};

// Optimized list item creation with IntersectionObserver placeholders
function makeListItems(items) {
  if (!items.length) return null;

  const listData = getListItemData(items);
  const h2 = document.createElement("h2");
  h2.append(items.title);

  // Add collapsible functionality to the heading
  const collapsed = items.title === "Time Cruisers" ? "false" : "true";
  h2.setAttribute("data-collapsed", collapsed);

  const listItems = [];

  // Initialize IntersectionObserver if not already done
  if (!intersectionObserver) {
    initializeIntersectionObserver();
  }

  // Pre-filter data if there's an initial query
  let filteredData = listData;
  if (INITIAL_QUERY) {
    try {
      const searchResults = performSearchWithFlatData(INITIAL_QUERY);
      const resultSetNumbers = new Set(
        searchResults.map((r) => `${r.itemnumber}`)
      );
      filteredData = filteredData.filter((item) =>
        resultSetNumbers.has(item.itemnumber)
      );
    } catch (error) {
      console.error("Error pre-filtering data:", error);
      // Fallback to showing all data if search fails
      filteredData = listData;
    }
  }

  // Create placeholders only for filtered data
  filteredData.forEach((itemData) => {
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
  const colCount = Math.floor(window.innerWidth / 235);
  list.style.setProperty(`--col`, colCount);

  // Add click handler for collapsible functionality
  title.addEventListener("click", () => {
    const isCollapsed = title.getAttribute("data-collapsed") === "true";
    title.setAttribute("data-collapsed", !isCollapsed);
  });

  // Use append instead of spread for better performance
  list.append(...listItems);
  return [title, list];
}

function renderLists() {
  MAIN.innerHTML = "";
  const fragment = document.createDocumentFragment();

  // Process all lists asynchronously
  for (const listData of data) {
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
      [...THEMES.values()].map((x) => [...x]).flat()
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

if (INITIAL_QUERY) {
  const results = performSearchWithFlatData(INITIAL_QUERY);
  CURRENT_SEARCH_STATE.isActive = true;
  CURRENT_SEARCH_STATE.resultSetNumbers = new Set(
    results.map((r) => `${r.itemnumber}`)
  );

  if (INITIAL_QUERY && results.length > 0) {
    RESULT_COUNT.textContent = `Found ${results.length} result${
      results.length === 1 ? "" : "s"
    } for "${INITIAL_QUERY}"`;
    SEARCH_RESULTS.style.display = "flex";
  } else if (INITIAL_QUERY && results.length === 0) {
    RESULT_COUNT.textContent = `No results found for "${INITIAL_QUERY}"`;
    SEARCH_RESULTS.style.display = "flex";
  }
}
renderLists();
