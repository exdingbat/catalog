import { replaceState } from "./replaceState.mjs";
import { CATALOG_DATA } from "./catalogData.mjs";
import { flatCardData } from "./data.mjs";

// DOM elements
const SEARCH = document.getElementById("search");
const SEARCH_RESULTS = document.getElementById("searchResults");
const RESULT_COUNT = document.getElementById("resultCount");

// State
let searchTimeout;
let CURRENT_SEARCH_STATE = {
  isActive: false,
  resultSetNumbers: new Set(),
};

// Query parsing utilities
function tokenize(query) {
  const tokens = [];
  const regex = /\(|\)|\bAND\b|\bOR\b/gi;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(query)) !== null) {
    if (match.index > lastIndex) {
      const text = query.slice(lastIndex, match.index).trim();
      if (text) tokens.push(text);
    }
    tokens.push(match[0].toUpperCase());
    lastIndex = regex.lastIndex;
  }

  const rest = query.slice(lastIndex).trim();
  if (rest) tokens.push(rest);
  return tokens;
}

function parseTokens(tokens) {
  let pos = 0;

  function parseExpression() {
    let node = parseTerm();
    while (pos < tokens.length && /^or$/i.test(tokens[pos])) {
      pos++;
      node = { type: "or", left: node, right: parseTerm() };
    }
    return node;
  }

  function parseTerm() {
    let node = parseFactor();
    while (pos < tokens.length && /^and$/i.test(tokens[pos])) {
      pos++;
      node = { type: "and", left: node, right: parseFactor() };
    }
    return node;
  }

  function parseFactor() {
    if (tokens[pos] === "(") {
      pos++;
      const node = parseExpression();
      if (tokens[pos] !== ")") throw new Error("Mismatched parentheses");
      pos++;
      return node;
    }
    const token = tokens[pos++];
    return { type: "term", value: token };
  }

  return parseExpression();
}

function evaluateAST(node, catalogEntry) {
  if (!node) return true;
  switch (node.type) {
    case "or":
      return (
        evaluateAST(node.left, catalogEntry) ||
        evaluateAST(node.right, catalogEntry)
      );
    case "and":
      return (
        evaluateAST(node.left, catalogEntry) &&
        evaluateAST(node.right, catalogEntry)
      );
    case "term":
      const match = /^([^:]+):(.+)$/.exec(node.value);
      if (match) {
        const field = match[1]?.toLowerCase();
        let value = match[2]?.toLowerCase();
        if (field === "retired") {
          value = value
            .replace(/^(yes|1)$/i, "true")
            .replace(/^(no|0)$/i, "false");
          const cardValue = catalogEntry.retired ? "true" : "false";
          return cardValue === value;
        }
        const cardValue = catalogEntry[field];
        return (
          cardValue && cardValue.toString().toLowerCase().includes(value.trim())
        );
      } else {
        const value = node.value?.toLowerCase().trim();
        const searchableText = [
          catalogEntry.name,
          catalogEntry.theme,
          catalogEntry.subtheme,
          catalogEntry.itemnumber,
          catalogEntry.category,
          catalogEntry.retired ? "true" : "false",
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return searchableText.includes(value);
      }
    default:
      return true;
  }
}

export function performSearchWithFlatData(query) {
  if (!flatCardData.length) return [];

  let ast = null;
  try {
    const tokens = tokenize(query);
    ast = parseTokens(tokens);
  } catch (e) {
    console.error("Parse error:", e);
    ast = { type: "term", value: query };
  }

  const results = flatCardData.filter((item) => evaluateAST(ast, item));
  return results;
}

export function performSearch(query) {
  try {
    SEARCH.classList.add("search-loading");

    // Handle empty query - reset search state and show all items
    if (!query || query.trim() === "") {
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.delete("q");
      replaceState(searchParams);

      // Reset search state
      CURRENT_SEARCH_STATE.isActive = false;
      CURRENT_SEARCH_STATE.resultSetNumbers = new Set();

      // Show all items
      let visibleCount = 0;
      CATALOG_DATA.forEach((catalogEntry, itemNumber) => {
        if (catalogEntry.element) {
          catalogEntry.element.hidden = false;
          visibleCount++;
        }
        if (catalogEntry.placeholder) {
          catalogEntry.placeholder.hidden = false;
          visibleCount++;
        }
      });

      updateSearchResultsDisplay("", 0);
      return;
    }

    const results = performSearchWithFlatData(query);
    const searchParams = new URLSearchParams(window.location.search);
    query ? searchParams.set("q", query) : searchParams.delete("q");
    replaceState(searchParams);

    applySearchResults(results);
    updateSearchResultsDisplay(query, results.length);
  } catch (error) {
    console.error("Search failed:", error);
  } finally {
    SEARCH.classList.remove("search-loading");
  }
}

function applySearchResults(currentSearchResults) {
  const resultSetNumbers = new Set(
    // currentSearchResults.map((r) => `${r.Number}-${r.Variant}`),
    currentSearchResults.map((r) => `${r.itemnumber}`),
  );

  CURRENT_SEARCH_STATE.isActive = true;
  CURRENT_SEARCH_STATE.resultSetNumbers = resultSetNumbers;

  let visibleCount = 0;
  let hiddenCount = 0;

  CATALOG_DATA.forEach((catalogEntry, itemNumber) => {
    const shouldShow = resultSetNumbers.has(itemNumber);

    if (catalogEntry.element) {
      catalogEntry.element.hidden = !shouldShow;
      if (shouldShow) visibleCount++;
      else hiddenCount++;
    }
    if (catalogEntry.placeholder) {
      catalogEntry.placeholder.hidden = !shouldShow;
      if (shouldShow) visibleCount++;
      else hiddenCount++;
    }
  });
}

function updateSearchResultsDisplay(query, total) {
  if (query && total > 0) {
    RESULT_COUNT.textContent = `Found ${total} result${total === 1 ? "" : "s"} for "${query}"`;
    SEARCH_RESULTS.style.display = "flex";
  } else if (query && total === 0) {
    RESULT_COUNT.textContent = `No results found for "${query}"`;
    SEARCH_RESULTS.style.display = "flex";
  } else {
    SEARCH_RESULTS.style.display = "none";
  }
}

export { CURRENT_SEARCH_STATE };
