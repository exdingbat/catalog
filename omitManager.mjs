// Omit list management functionality
const OMIT_STORAGE_KEY = "lego-app-omit-list";

// Default omit list (same as the original omit.mjs)
const DEFAULT_OMIT_LIST = [
  [, , , "{Catapult}"],
  [, , "Bonus/Value Pack"],
  [, , "Book Parts"],
  [, , "Formula 1"],
  [, , "Magazine Gift"],
  [, , "Product Collection"],
  [, , "Promotional"],
  [, , "Seasonal"],
  [, , "Special"],
  [, "Creator", ""],
  [, "Creator", "8 in 1"],
  [, "Creator", "Botanical Collection"],
  [, "Creator", "Bulk Set"],
  [, "Creator", "Inventor Set"],
  [, "Creator", "Miscellaneous"],
  [, "Creator", "Postcard"],
  [, "Discovery"],
  [, "Icons", "Adidas"],
  [, "Icons", "Botanical Collection"],
  [, "Icons", "Gardens of the World"],
  [, "Icons", "Landmarks"],
  [, "Icons", "Miscellaneous"],
  [, "Icons", "Nike"],
  [, "Icons", "Restaurants of the World"],
  [, "Icons", "Space"],
  [, "Icons", "Stadiums"],
  [, "Icons", "Vehicles"],
  [, "Promotional"],
  [, "Sports"],
  [, , "Fantasy Era"],
];

// Get available theme groups from the data
export async function getAvailableThemeGroups() {
  try {
    // Import the data module dynamically to avoid circular dependencies
    const { nestedCardData } = await import("./data.mjs");
    return Object.keys(nestedCardData).sort();
  } catch (error) {
    console.warn("Failed to get theme groups:", error);
    return [];
  }
}

// Get omit list from localStorage or use default
export function getOmitList() {
  try {
    const stored = localStorage.getItem(OMIT_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migrate old 3-field rules to new 4-field structure
      const migrated = parsed.map((rule) => {
        if (rule.length === 3) {
          // Old format: [theme, subtheme, name] -> New format: [themeGroup, theme, subtheme, name]
          return [null, rule[0], rule[1], rule[2]];
        }
        return rule;
      });
      return migrated;
    }
    return DEFAULT_OMIT_LIST;
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

// Create omit list management UI
export async function createOmitListUI() {
  const container = document.createElement("div");
  container.className = "omit-list-container";
  container.innerHTML = `
    <div class="omit-list-header">
      <h3>Filter Rules</h3>
      <button type="button" class="omit-add-btn" title="Add new filter rule">+</button>
    </div>
    <div class="omit-list-content">
      <div class="omit-list-empty" style="display: none;">
        <p>No filter rules defined. All sets will be shown.</p>
      </div>
      <div class="omit-list-items"></div>
    </div>
    <div class="omit-list-footer">
      <button type="button" class="omit-reset-btn">Reset to Default</button>
      <button type="button" class="omit-close-btn">Close</button>
    </div>
  `;

  const addBtn = container.querySelector(".omit-add-btn");
  const resetBtn = container.querySelector(".omit-reset-btn");
  const closeBtn = container.querySelector(".omit-close-btn");
  const itemsContainer = container.querySelector(".omit-list-items");
  const emptyMessage = container.querySelector(".omit-list-empty");

  // Get available theme groups
  const themeGroups = await getAvailableThemeGroups();

  // Render omit list
  function renderOmitList() {
    const omitList = getOmitList();

    if (omitList.length === 0) {
      emptyMessage.style.display = "block";
      itemsContainer.style.display = "none";
    } else {
      emptyMessage.style.display = "none";
      itemsContainer.style.display = "block";

      itemsContainer.innerHTML = omitList
        .map(
          (rule, index) => `
        <div class="omit-rule" data-index="${index}">
          <div class="omit-rule-fields">
            <select class="omit-theme-group" title="Theme Group (optional)">
              <option value="">Theme Group (optional)</option>
              ${themeGroups
                .map(
                  (group) =>
                    `<option value="${group}" ${
                      rule[0] === group ? "selected" : ""
                    }>${group}</option>`
                )
                .join("")}
            </select>
            <input type="text" class="omit-theme" placeholder="Theme (optional)" value="${
              rule[1] || ""
            }" />
            <input type="text" class="omit-subtheme" placeholder="Subtheme (optional)" value="${
              rule[2] || ""
            }" />
            <input type="text" class="omit-name" placeholder="Set name (optional)" value="${
              rule[3] || ""
            }" />
          </div>
          <button type="button" class="omit-remove-btn" title="Remove rule">×</button>
        </div>
      `
        )
        .join("");

      // Add event listeners to remove buttons
      itemsContainer.querySelectorAll(".omit-remove-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const ruleElement = e.target.closest(".omit-rule");
          const index = parseInt(ruleElement.dataset.index);
          removeOmitRule(index);
          renderOmitList();
          // Trigger data refresh
          if (window.refreshCatalogData) {
            window.refreshCatalogData();
          }
        });
      });

      // Add event listeners to input fields and select
      itemsContainer
        .querySelectorAll(".omit-rule-fields input, .omit-rule-fields select")
        .forEach((input) => {
          input.addEventListener("change", (e) => {
            const ruleElement = e.target.closest(".omit-rule");
            const index = parseInt(ruleElement.dataset.index);
            const themeGroup =
              ruleElement.querySelector(".omit-theme-group").value;
            const theme = ruleElement.querySelector(".omit-theme").value;
            const subtheme = ruleElement.querySelector(".omit-subtheme").value;
            const name = ruleElement.querySelector(".omit-name").value;
            updateOmitRule(index, themeGroup, theme, subtheme, name);
            // Trigger data refresh
            if (window.refreshCatalogData) {
              window.refreshCatalogData();
            }
          });
        });
    }
  }

  // Add new rule
  addBtn.addEventListener("click", () => {
    addOmitRule();
    renderOmitList();
    // Trigger data refresh
    if (window.refreshCatalogData) {
      window.refreshCatalogData();
    }
  });

  // Reset to default
  resetBtn.addEventListener("click", () => {
    if (confirm("Reset all filter rules to default? This cannot be undone.")) {
      resetOmitList();
      renderOmitList();
      // Trigger data refresh
      if (window.refreshCatalogData) {
        window.refreshCatalogData();
      }
    }
  });

  // Close dialog
  closeBtn.addEventListener("click", () => {
    const dialog = container.closest(".omit-list-dialog");
    if (dialog) {
      dialog.style.display = "none";
    }
  });

  // Initial render
  renderOmitList();

  return container;
}

// Show/hide omit list dialog
export async function toggleOmitListDialog() {
  let dialog = document.querySelector(".omit-list-dialog");

  if (!dialog) {
    dialog = document.createElement("div");
    dialog.className = "omit-list-dialog";
    const ui = await createOmitListUI();
    dialog.appendChild(ui);

    // Add click outside to close functionality
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) {
        dialog.style.display = "none";
      }
    });

    document.body.appendChild(dialog);
  }

  if (dialog.style.display === "none" || !dialog.style.display) {
    dialog.style.display = "flex";
  } else {
    dialog.style.display = "none";
  }
}
