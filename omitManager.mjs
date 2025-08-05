// Omit list management functionality
import { THEME_GROUPS, THEMES, nestedCardData } from "./data.mjs";

const OMIT_STORAGE_KEY = "lego-app-omit-list";

// Default omit list (same as the original omit.mjs)
const f = [
  [null, null, null, "{Catapult}"],
  // [null, null, "Bonus/Value Pack"],
  // [null, null, "Book Parts"],
  // [null, null, "Formula 1"],
  // [null, null, "Magazine Gift"],
  // [null, null, "Product Collection"],
  // [null, null, "Promotional"],
  // [null, null, "Seasonal"],
  // [null, null, "Special"],
  [null, "Creator", ""],
  [null, "Creator", "8 in 1"],
  [null, "Creator", "Botanical Collection"],
  [null, "Creator", "Bulk Set"],
  [null, "Creator", "Inventor Set"],
  [null, "Creator", "Miscellaneous"],
  [null, "Creator", "Postcard"],
  [null, "Discovery"],
  [null, "Icons", "Adidas"],
  [null, "Icons", "Botanical Collection"],
  [null, "Icons", "Gardens of the World"],
  [null, "Icons", "Landmarks"],
  [null, "Icons", "Miscellaneous"],
  [null, "Icons", "Nike"],
  [null, "Icons", "Restaurants of the World"],
  [null, "Icons", "Space"],
  [null, "Icons", "Stadiums"],
  [null, "Icons", "Vehicles"],
  [null, "Promotional"],
  [null, "Sports"],
  [null, null, "Fantasy Era"],
  ["Basic", null, null, null],
  ["Art and crafts", null, null, null],
  ["Girls", null, null, null],
  ["Educational", null, null, null],
  ["Constraction", null, null, null],
  ["Junior", null, null, null],
  ["Licensed", null, null, null],
  ["Pre-school", null, null, null],
  ["Racing", null, null, null],
  ["Technical", null, null, null],
  ["Vintage", null, null, null],
  ["Miscellaneous", null, null, null],
];

const DEFAULT_OMIT_LIST = [
  ["Action/Adventure", "Dreamzzz", null, null],
  ["Action/Adventure", "Elves", null, null],
  ["Action/Adventure", "Exo-Force", null, null],
  ["Action/Adventure", "Monkie Kid", null, null],
  ["Action/Adventure", "NEXO KNIGHTS", null, null],
  ["Action/Adventure", "Ninjago", null, null],
  ["Art and crafts", null, null, null],
  ["Basic", null, null, null],
  ["Constraction", null, null, null],
  ["Educational", null, null, null],
  ["Girls", null, null, null],
  ["Junior", null, null, null],
  ["Licensed", null, null, null],
  ["Miscellaneous", null, null, null],
  ["Model making", "Botanicals", null, null],
  ["Model making", "Bricklink", null, null],
  ["Model making", "Creator", "6 in 1", null],
  ["Model making", "Creator", "Bucket", null],
  ["Model making", "Creator", "Mosaic", null],
  ["Modern day", "Friends", null, null],
  ["Pre-school", null, null, null],
  ["Racing", null, null, null],
  ["Technical", null, null, null],
  ["Vintage", null, null, null],
  [null, "Creator", ""],
  [null, "Creator", "8 in 1"],
  [null, "Creator", "Botanical Collection"],
  [null, "Creator", "Bulk Set"],
  [null, "Creator", "Inventor Set"],
  [null, "Creator", "Miscellaneous"],
  [null, "Creator", "Postcard"],
  [null, "Discovery"],
  [null, "Icons", "Adidas"],
  [null, "Icons", "Botanical Collection"],
  [null, "Icons", "Gardens of the World"],
  [null, "Icons", "Landmarks"],
  [null, "Icons", "Miscellaneous"],
  [null, "Icons", "Nike"],
  [null, "Icons", "Restaurants of the World"],
  [null, "Icons", "Space"],
  [null, "Icons", "Stadiums"],
  [null, "Icons", "Vehicles"],
  [null, "Promotional"],
  [null, "Sports"],
  [null, null, "Bonus/Value Pack"],
  [null, null, "Book Parts"],
  [null, null, "Fantasy Era"],
  [null, null, "Formula 1"],
  [null, null, "Magazine Gift"],
  [null, null, "Product Collection"],
  [null, null, "Promotional"],
  [null, null, "Seasonal"],
  [null, null, "Special"],
  [null, null, null, "{Catapult}"],
  [null, null, null, null],
  // [null, null, "Bonus/Value Pack"],
  // [null, null, "Book Parts"],
  // [null, null, "Formula 1"],
  // [null, null, "Magazine Gift"],
  // [null, null, "Product Collection"],
  // [null, null, "Promotional"],
  // [null, null, "Seasonal"],
  // [null, null, "Special"],
];

// Cache for autocomplete data
let themeGroupsCache = [];
let themesCache = [];
let subthemesCache = [];

// Get available theme groups from the data
export function getAvailableThemeGroups() {
  try {
    return Array.from(THEME_GROUPS.keys()).sort();
  } catch (error) {
    console.warn("Failed to get theme groups:", error);
    return [];
  }
}

// Get available themes from the data (optionally filtered by theme group)
export function getAvailableThemes(selectedThemeGroup = null) {
  try {
    if (selectedThemeGroup && THEME_GROUPS.has(selectedThemeGroup)) {
      return Array.from(THEME_GROUPS.get(selectedThemeGroup).keys()).sort();
    }
    return Array.from(THEMES.keys()).sort();
  } catch (error) {
    console.warn("Failed to get themes:", error);
    return [];
  }
}

// Get available subthemes from the data (optionally filtered by theme)
export function getAvailableSubthemes(
  selectedTheme = null,
  selectedThemeGroup = null
) {
  try {
    if (
      selectedTheme &&
      selectedThemeGroup &&
      THEME_GROUPS.has(selectedThemeGroup)
    ) {
      const themeGroup = THEME_GROUPS.get(selectedThemeGroup);
      if (themeGroup.has(selectedTheme)) {
        return Array.from(themeGroup.get(selectedTheme)).sort();
      }
    }

    // Fallback to THEMES structure if no theme group is selected
    if (selectedTheme && THEMES.has(selectedTheme)) {
      return Array.from(THEMES.get(selectedTheme)).sort();
    }

    // Return all subthemes if no theme is selected
    const subthemes = new Set();
    for (const themeSubthemes of THEMES.values()) {
      for (const subtheme of themeSubthemes) {
        subthemes.add(subtheme); // Include all subthemes, including empty strings
      }
    }
    return Array.from(subthemes).sort();
  } catch (error) {
    console.warn("Failed to get subthemes:", error);
    return [];
  }
}

// Initialize autocomplete data
function initializeAutocompleteData() {
  if (themeGroupsCache.length === 0) {
    themeGroupsCache = getAvailableThemeGroups();
  }
  if (themesCache.length === 0) {
    themesCache = getAvailableThemes();
  }
  if (subthemesCache.length === 0) {
    subthemesCache = getAvailableSubthemes();
  }
}

// Create autocomplete suggestions
function createAutocompleteSuggestions(
  input,
  suggestions,
  maxSuggestions = 40
) {
  const value = input.value.toLowerCase();

  // If input is empty, show all suggestions (up to maxSuggestions)
  if (!value) {
    return suggestions.slice(0, maxSuggestions);
  }

  // Filter suggestions based on input value
  const filtered = suggestions
    .filter((s) => s.toLowerCase().includes(value) && s.toLowerCase() !== value)
    .slice(0, maxSuggestions);

  return filtered;
}

// Create autocomplete dropdown
function createAutocompleteDropdown(input, suggestions, onSelect) {
  // Remove existing dropdown
  const existing = document.querySelector(".autocomplete-dropdown");
  if (existing) existing.remove();

  if (suggestions.length === 0) return;

  const dropdown = document.createElement("div");
  dropdown.className = "autocomplete-dropdown";

  suggestions.forEach((suggestion) => {
    const item = document.createElement("div");
    item.className = "autocomplete-item";

    // Display appropriate text for empty strings
    let displayText = suggestion;
    if (suggestion === "") {
      // Determine the appropriate text based on the input field
      const inputId = input.id;
      if (inputId === "omit-theme-group") {
        displayText = "No Theme Group";
      } else if (inputId === "omit-theme") {
        displayText = "No Theme";
      } else if (inputId === "omit-subtheme") {
        displayText = "No Subtheme";
      } else {
        displayText = "No Value";
      }
    }

    item.textContent = displayText;
    item.addEventListener("click", () => {
      onSelect(suggestion); // Pass the original value, not the display text
      dropdown.remove();
    });
    dropdown.appendChild(item);
  });

  // Position dropdown below input
  const rect = input.getBoundingClientRect();
  dropdown.style.position = "absolute";
  dropdown.style.top = `${rect.bottom + window.scrollY}px`;
  dropdown.style.left = `${rect.left + window.scrollX}px`;
  dropdown.style.width = `${rect.width}px`;
  dropdown.style.zIndex = "1000";

  document.body.appendChild(dropdown);

  // Close dropdown when clicking outside
  const closeDropdown = (e) => {
    if (!dropdown.contains(e.target) && e.target !== input) {
      dropdown.remove();
      document.removeEventListener("click", closeDropdown);
    }
  };

  setTimeout(() => {
    document.addEventListener("click", closeDropdown);
  }, 100);
}

// Update autocomplete dropdown for an input
function updateAutocompleteDropdown(input, suggestions, onSelect) {
  const value = input.value.toLowerCase();
  const filteredSuggestions = createAutocompleteSuggestions(input, suggestions);

  // Remove existing dropdown
  const existing = document.querySelector(".autocomplete-dropdown");
  if (existing) existing.remove();

  // Show dropdown if there are suggestions and input is focused
  if (filteredSuggestions.length > 0 && document.activeElement === input) {
    createAutocompleteDropdown(input, filteredSuggestions, onSelect);
  }
}

// Get omit list from localStorage or use default
export function getOmitList() {
  try {
    const stored = localStorage.getItem(OMIT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_OMIT_LIST;
  } catch (error) {
    console.warn(
      "Failed to load omit list from localStorage, using default:",
      error
    );
    return DEFAULT_OMIT_LIST;
  }
}

// Save omit list to localStorage
export function saveOmitList(omitList) {
  try {
    localStorage.setItem(OMIT_STORAGE_KEY, JSON.stringify(omitList));
    document.getElementById("searchForm")?.submit();
    return true;
  } catch (error) {
    console.error("Failed to save omit list to localStorage:", error);
    return false;
  }
}

// Reset omit list to default
export function resetOmitList() {
  saveOmitList(DEFAULT_OMIT_LIST);
  return DEFAULT_OMIT_LIST;
}

// Add new omit rule
export function addOmitRule(
  themeGroup = "",
  theme = "",
  subtheme = "",
  name = ""
) {
  const omitList = getOmitList();
  const newRule = [
    themeGroup || null,
    theme || null,
    subtheme || null,
    name || null,
  ];

  // Check if rule already exists
  const exists = omitList.some(
    (rule) => JSON.stringify(rule) === JSON.stringify(newRule)
  );

  if (!exists) {
    omitList.push(newRule);
    saveOmitList(omitList);
  }

  return omitList;
}

// Remove omit rule by index
export function removeOmitRule(index) {
  const omitList = getOmitList();
  if (index >= 0 && index < omitList.length) {
    omitList.splice(index, 1);
    saveOmitList(omitList);
  }
  return omitList;
}

// Update omit rule by index
export function updateOmitRule(
  index,
  themeGroup = "",
  theme = "",
  subtheme = "",
  name = ""
) {
  const omitList = getOmitList();
  if (index >= 0 && index < omitList.length) {
    omitList[index] = [
      themeGroup || null,
      theme || null,
      subtheme || null,
      name || null,
    ];
    saveOmitList(omitList);
  }
  return omitList;
}

// Create pill element for displaying omit rules
function createOmitPill(rule, index, onRemove) {
  const pill = document.createElement("li");
  pill.className = "omit-pill";
  pill.dataset.index = index;

  // Create pill content
  const content = document.createElement("span");
  content.className = "omit-pill-content";

  // Build pill text based on rule values
  const parts = [];
  if (rule[0]) parts.push(`Theme Group: ${rule[0]}`);
  if (rule[1]) parts.push(`Theme: ${rule[1]}`);
  if (rule[2]) parts.push(`Subtheme: ${rule[2]}`);
  if (rule[3]) parts.push(`Name: ${rule[3]}`);

  content.textContent = parts.join(" | ") || "Empty rule";

  // Create remove button
  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "omit-pill-remove";
  removeBtn.innerHTML = "❌";
  removeBtn.title = "Remove filter rule";
  removeBtn.addEventListener("click", () => onRemove(index));

  pill.appendChild(content);
  pill.appendChild(removeBtn);

  return pill;
}

// Create single input form for adding new rules - Updated to work with native HTML
function setupInputForm(onAdd) {
  const form = document.querySelector("#omit-list-dialog form");
  const themeGroupInput = document.getElementById("omit-theme-group");
  const themeInput = document.getElementById("omit-theme");
  const subthemeInput = document.getElementById("omit-subtheme");
  const nameInput = document.getElementById("omit-name");

  // Get datalist elements
  const themeGroupDatalist = document.getElementById("theme-group-options");
  const themeDatalist = document.getElementById("theme-options");
  const subthemeDatalist = document.getElementById("subtheme-options");

  // Initialize autocomplete data
  initializeAutocompleteData();

  // Populate datalists with initial data
  function populateDatalists() {
    // Theme Group datalist
    themeGroupDatalist.innerHTML = "";
    themeGroupsCache.forEach((group) => {
      const option = document.createElement("option");
      option.value = group;
      themeGroupDatalist.appendChild(option);
    });

    // Theme datalist
    themeDatalist.innerHTML = "";
    themesCache.forEach((theme) => {
      const option = document.createElement("option");
      option.value = theme;
      themeDatalist.appendChild(option);
    });

    // Subtheme datalist
    subthemeDatalist.innerHTML = "";
    subthemesCache.forEach((subtheme) => {
      const option = document.createElement("option");
      option.value = subtheme;
      subthemeDatalist.appendChild(option);
    });
  }

  // Update theme datalist based on selected theme group
  function updateThemeDatalist() {
    const selectedThemeGroup = themeGroupInput.value.trim();
    const availableThemes = getAvailableThemes(selectedThemeGroup);

    themeDatalist.innerHTML = "";
    availableThemes.forEach((theme) => {
      const option = document.createElement("option");
      option.value = theme;
      themeDatalist.appendChild(option);
    });
  }

  // Update subtheme datalist based on selected theme and theme group
  function updateSubthemeDatalist() {
    const selectedTheme = themeInput.value.trim();
    const selectedThemeGroup = themeGroupInput.value.trim();
    const availableSubthemes = getAvailableSubthemes(
      selectedTheme,
      selectedThemeGroup
    );

    subthemeDatalist.innerHTML = "";
    availableSubthemes.forEach((subtheme) => {
      const option = document.createElement("option");
      option.value = subtheme;
      subthemeDatalist.appendChild(option);
    });
  }

  // Form submission handler
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const themeGroup = themeGroupInput.value.trim();
    const theme = themeInput.value.trim();
    const subtheme = subthemeInput.value.trim();
    const name = nameInput.value.trim();

    if (themeGroup || theme || subtheme || name) {
      onAdd(themeGroup, theme, subtheme, name);
      // Clear inputs
      form.reset();
      themeGroupInput.focus();
    }
  });

  // Theme Group input change handler
  themeGroupInput.addEventListener("input", () => {
    updateThemeDatalist();
    // Clear child fields when parent changes
    themeInput.value = "";
    subthemeInput.value = "";
    updateSubthemeDatalist();
  });

  // Theme input change handler
  themeInput.addEventListener("input", () => {
    updateSubthemeDatalist();
    // Clear subtheme when theme changes
    subthemeInput.value = "";
  });

  // Initial population
  populateDatalists();
}

// Initialize omit list management UI - Updated to work with native HTML
export function initializeOmitListUI() {
  const dialog = document.getElementById("omit-list-dialog");
  const form = dialog.querySelector("form");
  const resetBtn = dialog.querySelector(".omit-reset-btn");
  const closeBtn = dialog.querySelector(".omit-close-btn");
  const pillsContainer = dialog.querySelector(".omit-pills-container");
  const emptyMessage = dialog.querySelector(".omit-list-empty");

  // Render omit pills
  function renderOmitPills() {
    const omitList = getOmitList();

    if (omitList.length === 0) {
      emptyMessage.style.display = "block";
      pillsContainer.style.display = "none";
    } else {
      emptyMessage.style.display = "none";
      pillsContainer.style.display = "flex";

      pillsContainer.innerHTML = "";

      omitList.forEach((rule, index) => {
        const pill = createOmitPill(rule, index, (index) => {
          removeOmitRule(index);
          renderOmitPills();
          if (window.refreshCatalogData) {
            window.refreshCatalogData();
          }
        });
        pillsContainer.appendChild(pill);
      });
    }
  }

  // Setup input form
  setupInputForm((themeGroup, theme, subtheme, name) => {
    addOmitRule(themeGroup, theme, subtheme, name);
    renderOmitPills();
    if (window.refreshCatalogData) {
      window.refreshCatalogData();
    }
  });

  // Reset to default
  resetBtn.addEventListener("click", () => {
    if (confirm("Reset all filter rules to default? This cannot be undone.")) {
      resetOmitList();
      renderOmitPills();
      if (window.refreshCatalogData) {
        window.refreshCatalogData();
      }
    }
  });

  // Close dialog
  closeBtn.addEventListener("click", () => {
    dialog.close();
  });

  // Handle dialog close
  dialog.addEventListener("close", () => {
    // Reset form when dialog closes
    form.reset();
  });

  // Initial render
  renderOmitPills();
}

// Show/hide omit list dialog - Updated to work with native HTML
export function toggleOmitListDialog() {
  const dialog = document.getElementById("omit-list-dialog");
  const firstInput = dialog.querySelector("#omit-theme-group");

  if (dialog.open) {
    // Closing the modal
    dialog.close();
  } else {
    // Opening the modal
    dialog.showModal();

    // Focus management
    setTimeout(() => {
      firstInput.focus();
    }, 100);
  }
}
