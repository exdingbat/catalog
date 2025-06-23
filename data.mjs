// import flatData from "./flat.json" with { type: "json" };
import loadTuples from "./tuples.mjs";
import { getOmitList } from "./omitManager.mjs";
import {
  getDate,
  getImg,
  getBricklink,
  getBrickset,
  getLego,
} from "./helpers.mjs";

const NOW = new Date();
export const THEMES = new Map();
// Updated to be a nested structure: themeGroup -> theme -> Set of subthemes
export const THEME_GROUPS = new Map();

function flatDataToCatalogCardData(x) {
  const retiredDate = new Date(x.ExitDate || x.USDateRemoved);
  const retired =
    retiredDate === null ||
    (retiredDate < NOW && retiredDate.getFullYear() !== 2025);
  const retiredString = retiredDate?.toLocaleDateString("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const id = x.ItemNumber;
  return {
    theme: x.Theme,
    subtheme: x.Subtheme,
    themeGroup: x.ThemeGroup,
    note: retiredString || "",
    retired,
    ["aspect-ratio"]: x.dimensions?.aspectRatio,
    name: x.SetName || "",
    year: x.YearFrom,
    itemnumber: x.ItemNumber,
    category: [x.Theme.toUpperCase(), x.Subtheme].filter(Boolean).join(" "),
    price: retired
      ? x.BrickLinkSoldPriceUsed.replace(/(?<=\d)00/, "")
      : x.USRetailPrice,
    img: x.ImageFilename ? getImg(id) : "",
    links: {
      lego: getLego(id),
      brickset: getBrickset(id),
      brinklink: getBricklink(id),
    },
  };
}

// Enhanced data loading with service worker support
async function loadTuplesWithCache() {
  try {
    // Try to get cached decompressed data from service worker
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      const response = await fetch("/data/tuples.mjs");
      if (response.headers.get("content-type")?.includes("application/json")) {
        // Service worker returned cached decompressed data
        const cachedData = await response.json();
        return buildFromTuples(
          cachedData.keys || [],
          cachedData.lookups || [],
          cachedData.tupleList || [],
        );
      }
    }

    // Fallback to original loading method
    return await loadTuples();
  } catch (error) {
    console.warn(
      "Service worker cache failed, falling back to direct loading:",
      error,
    );
    return await loadTuples();
  }
}

// Function to process data with current omit list
async function processDataWithOmitList() {
  const OMIT = getOmitList();

  const tuples = await loadTuplesWithCache();
  const result = tuples.reduce(
    (acc, x) => {
      // Build nested THEME_GROUPS structure
      if (!THEME_GROUPS.has(x.ThemeGroup)) {
        THEME_GROUPS.set(x.ThemeGroup, new Map());
      }
      const themeGroup = THEME_GROUPS.get(x.ThemeGroup);

      if (!themeGroup.has(x.Theme)) {
        themeGroup.set(x.Theme, new Set());
      }
      const theme = themeGroup.get(x.Theme);
      theme.add(x.Subtheme);

      // Keep existing THEMES structure for backward compatibility
      const subthemes = THEMES.get(x.Theme) || new Set();
      THEMES.set(x.Theme, subthemes);
      subthemes.add(x.Subtheme);

      if (!x || !x.ThemeGroup) return acc;
      else if (
        OMIT.some(([themeGroup, theme, subtheme, name]) => {
          const hasValue =
            typeof themeGroup === "string" ||
            typeof theme === "string" ||
            typeof subtheme === "string" ||
            typeof name === "string";
          return (
            hasValue &&
            (typeof themeGroup === "string"
              ? x.ThemeGroup === themeGroup
              : true) &&
            (typeof theme === "string" ? x.Theme === theme : true) &&
            (typeof subtheme === "string" ? x.Subtheme === subtheme : true) &&
            (typeof name === "string" ? x.SetName === name : true)
          );
        })
      ) {
        return acc;
      }
      const cardData = flatDataToCatalogCardData(x);
      const [nested, byTheme, flat] = acc;

      if (!nested[x.ThemeGroup]) {
        nested[x.ThemeGroup] = {};
      }
      if (!nested[x.ThemeGroup][x.Theme]) {
        nested[x.ThemeGroup][x.Theme] = {};
      }
      if (!nested[x.ThemeGroup][x.Theme][x.Subtheme]) {
        nested[x.ThemeGroup][x.Theme][x.Subtheme] = [];
      }

      if (!byTheme[x.Theme]) {
        byTheme[x.Theme] = [];
        byTheme[x.Theme].title = x.Theme;
        byTheme[x.Theme].themeGroup = x.ThemeGroup; // Store theme group for sorting
      }

      nested[x.ThemeGroup][x.Theme][x.Subtheme].push(cardData);
      byTheme[x.Theme].push(cardData);
      flat.push(cardData);

      return acc;
    },
    [{}, {}, []],
  );

  // Sort themes alphabetically by theme group first, then by theme name
  const sortedThemes = Object.values(result[1]).sort((a, b) => {
    // First sort by theme group
    const themeGroupComparison = (a.themeGroup || "").localeCompare(
      b.themeGroup || "",
    );
    if (themeGroupComparison !== 0) {
      return themeGroupComparison;
    }
    // Then sort by theme name
    return (a.title || "").localeCompare(b.title || "");
  });

  return [result[0], sortedThemes, result[2]];
}

// Initial data processing
let [nestedCardData, byTheme, flatCardData] = await processDataWithOmitList();
// Function to refresh data (for when omit list changes)
export async function refreshData() {
  [nestedCardData, byTheme, flatCardData] = await processDataWithOmitList();
  return byTheme; // Return the sorted array directly
}

export default byTheme; // Export the sorted array directly
export { nestedCardData };
export { flatCardData };
