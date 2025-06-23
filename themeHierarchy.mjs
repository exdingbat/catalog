// Theme hierarchy management functionality using modern HTML features
import { THEME_GROUPS } from "./data.mjs";
import { getOmitList, addOmitRule, removeOmitRule } from "./omitManager.mjs";

// Create theme hierarchy tree structure using modern HTML elements
function createThemeHierarchyTree() {
  const treeContainer = document.querySelector(".theme-hierarchy-tree");
  treeContainer.innerHTML = "";

  // Get current omit list
  const omitList = getOmitList();

  // Sort theme groups alphabetically
  const sortedThemeGroups = Array.from(THEME_GROUPS.keys()).sort();

  // Create a tree-like structure using <details> and <summary> elements
  const treeRoot = document.createElement("div");
  treeRoot.className = "theme-tree-root";
  treeRoot.setAttribute("role", "tree");
  treeRoot.setAttribute("aria-label", "Theme hierarchy");

  sortedThemeGroups.forEach((themeGroupName) => {
    const themeGroup = THEME_GROUPS.get(themeGroupName);
    const themeGroupItem = createThemeGroupItem(
      themeGroupName,
      themeGroup,
      omitList,
    );
    treeRoot.appendChild(themeGroupItem);
  });

  treeContainer.appendChild(treeRoot);
}

// Create theme group item using <details> and <summary> for native collapsible functionality
function createThemeGroupItem(themeGroupName, themeGroup, omitList) {
  const themeGroupItem = document.createElement("div");
  themeGroupItem.className = "theme-group-item";
  themeGroupItem.setAttribute("role", "treeitem");

  // Check if this theme group is omitted
  const isOmitted = omitList.some(
    (rule) => rule[0] === themeGroupName && !rule[1] && !rule[2] && !rule[3],
  );

  // Create details element for native collapsible functionality
  const details = document.createElement("details");
  details.className = "theme-group-details";
  if (isOmitted) {
    details.classList.add("omitted");
  }

  // Create summary element for the header
  const summary = document.createElement("summary");
  summary.className = "theme-group-summary";
  summary.setAttribute("role", "button");
  summary.setAttribute("tabindex", "0");

  const themeGroupText = document.createElement("span");
  themeGroupText.className = "theme-group-text";
  themeGroupText.textContent =
    themeGroupName === "" ? "No Theme Group" : themeGroupName;

  // Add omit indicator using modern emoji and semantic markup
  if (isOmitted) {
    const omitIndicator = document.createElement("span");
    omitIndicator.className = "omit-indicator";
    omitIndicator.setAttribute("aria-label", "Filtered out");
    omitIndicator.textContent = "🚫";
    omitIndicator.title = "This theme group is filtered out";
    themeGroupText.insertBefore(omitIndicator, themeGroupText.firstChild);
  }

  // Add omit control button with modern accessibility
  const omitControl = document.createElement("button");
  omitControl.className = "omit-control";
  omitControl.setAttribute("type", "button");
  omitControl.setAttribute(
    "aria-label",
    isOmitted
      ? "Remove filter for this theme group"
      : "Filter out this theme group",
  );
  omitControl.title = isOmitted
    ? "Remove filter for this theme group"
    : "Filter out this theme group";
  omitControl.textContent = isOmitted ? "👁️" : "❌";

  omitControl.addEventListener("click", (e) => {
    e.stopPropagation();
    handleOmitControlClick(
      e,
      themeGroupName,
      "",
      "",
      isOmitted,
      details,
      themeGroupText,
      omitControl,
    );
  });

  summary.appendChild(themeGroupText);
  summary.appendChild(omitControl);

  // Create theme list container
  const themeList = document.createElement("div");
  themeList.className = "theme-list";
  themeList.setAttribute("role", "group");

  // Sort themes alphabetically
  const sortedThemes = Array.from(themeGroup.keys()).sort();

  sortedThemes.forEach((themeName) => {
    const subthemes = themeGroup.get(themeName);
    const themeItem = createThemeItem(
      themeName,
      subthemes,
      omitList,
      themeGroupName,
    );
    themeList.appendChild(themeItem);
  });

  details.appendChild(summary);
  details.appendChild(themeList);
  themeGroupItem.appendChild(details);

  return themeGroupItem;
}

// Create theme item using nested <details> elements
function createThemeItem(themeName, subthemes, omitList, themeGroupName) {
  const themeItem = document.createElement("div");
  themeItem.className = "theme-item";
  themeItem.setAttribute("role", "treeitem");

  // Check if this theme is omitted
  const isOmitted = omitList.some(
    (rule) =>
      (rule[0] === themeGroupName || rule[0] === null) &&
      rule[1] === themeName &&
      !rule[2] &&
      !rule[3],
  );

  // Create details element for theme
  const details = document.createElement("details");
  details.className = "theme-details";
  if (isOmitted) {
    details.classList.add("omitted");
  }

  // Create summary element for theme header
  const summary = document.createElement("summary");
  summary.className = "theme-summary";
  summary.setAttribute("role", "button");
  summary.setAttribute("tabindex", "0");

  const themeText = document.createElement("span");
  themeText.className = "theme-text";
  themeText.textContent = themeName === "" ? "No Theme" : themeName;

  // Add omit indicator if omitted
  if (isOmitted) {
    const omitIndicator = document.createElement("span");
    omitIndicator.className = "omit-indicator";
    omitIndicator.setAttribute("aria-label", "Filtered out");
    omitIndicator.textContent = "🚫";
    omitIndicator.title = "This theme is filtered out";
    themeText.insertBefore(omitIndicator, themeText.firstChild);
  }

  // Add omit control button
  const omitControl = document.createElement("button");
  omitControl.className = "omit-control";
  omitControl.setAttribute("type", "button");
  omitControl.setAttribute(
    "aria-label",
    isOmitted ? "Remove filter for this theme" : "Filter out this theme",
  );
  omitControl.title = isOmitted
    ? "Remove filter for this theme"
    : "Filter out this theme";
  omitControl.textContent = isOmitted ? "👁️" : "❌";

  omitControl.addEventListener("click", (e) => {
    e.stopPropagation();
    handleOmitControlClick(
      e,
      themeGroupName,
      themeName,
      "",
      isOmitted,
      details,
      themeText,
      omitControl,
    );
  });

  summary.appendChild(themeText);
  summary.appendChild(omitControl);

  // Create subtheme list container
  const subthemeList = document.createElement("div");
  subthemeList.className = "subtheme-list";
  subthemeList.setAttribute("role", "group");

  // Sort subthemes alphabetically
  const sortedSubthemes = Array.from(subthemes).sort();

  sortedSubthemes.forEach((subthemeName) => {
    const subthemeItem = createSubthemeItem(
      subthemeName,
      omitList,
      themeGroupName,
      themeName,
    );
    subthemeList.appendChild(subthemeItem);
  });

  details.appendChild(summary);
  details.appendChild(subthemeList);
  themeItem.appendChild(details);

  return themeItem;
}

// Create subtheme item using modern semantic markup
function createSubthemeItem(subthemeName, omitList, themeGroupName, themeName) {
  const subthemeItem = document.createElement("div");
  subthemeItem.className = "subtheme-item";
  subthemeItem.setAttribute("role", "treeitem");

  // Check if this subtheme is omitted
  const isOmitted = omitList.some(
    (rule) =>
      (rule[0] === themeGroupName || rule[0] === null) &&
      (rule[1] === themeName || rule[1] === null) &&
      rule[2] === subthemeName,
  );

  const subthemeContainer = document.createElement("div");
  subthemeContainer.className = "subtheme-container";
  if (isOmitted) {
    subthemeContainer.classList.add("omitted");
  }

  const subthemeText = document.createElement("span");
  subthemeText.className = "subtheme-text";
  subthemeText.textContent = subthemeName === "" ? "No Subtheme" : subthemeName;

  // Add omit indicator if omitted
  if (isOmitted) {
    const omitIndicator = document.createElement("span");
    omitIndicator.className = "omit-indicator";
    omitIndicator.setAttribute("aria-label", "Filtered out");
    omitIndicator.textContent = "🚫";
    omitIndicator.title = "This subtheme is filtered out";
    subthemeText.insertBefore(omitIndicator, subthemeText.firstChild);
  }

  // Add omit control button
  const omitControl = document.createElement("button");
  omitControl.className = "omit-control";
  omitControl.setAttribute("type", "button");
  omitControl.setAttribute(
    "aria-label",
    isOmitted ? "Remove filter for this subtheme" : "Filter out this subtheme",
  );
  omitControl.title = isOmitted
    ? "Remove filter for this subtheme"
    : "Filter out this subtheme";
  omitControl.textContent = isOmitted ? "👁️" : "❌";

  omitControl.addEventListener("click", (e) => {
    e.stopPropagation();
    handleOmitControlClick(
      e,
      themeGroupName,
      themeName,
      subthemeName,
      isOmitted,
      subthemeContainer,
      subthemeText,
      omitControl,
    );
  });

  subthemeContainer.appendChild(subthemeText);
  subthemeContainer.appendChild(omitControl);
  subthemeItem.appendChild(subthemeContainer);

  return subthemeItem;
}

// Centralized omit control click handler
function handleOmitControlClick(
  e,
  themeGroupName,
  themeName,
  subthemeName,
  isOmitted,
  container,
  textElement,
  controlButton,
) {
  if (isOmitted) {
    // Remove the omit rule
    const currentOmitList = getOmitList();
    const ruleIndex = currentOmitList.findIndex(
      (rule) =>
        (rule[0] === themeGroupName || rule[0] === null) &&
        (rule[1] === themeName || rule[1] === null) &&
        (rule[2] === subthemeName || rule[2] === null),
    );
    if (ruleIndex !== -1) {
      removeOmitRule(ruleIndex);
      // Update the current item's appearance
      container.classList.remove("omitted");
      const omitIndicator = textElement.querySelector(".omit-indicator");
      if (omitIndicator) {
        omitIndicator.remove();
      }
      controlButton.textContent = "❌";
      controlButton.title = `Filter out this ${getItemType(themeGroupName, themeName, subthemeName)}`;
      controlButton.setAttribute(
        "aria-label",
        `Filter out this ${getItemType(themeGroupName, themeName, subthemeName)}`,
      );
      // Refresh catalog data
      if (window.refreshCatalogData) {
        window.refreshCatalogData();
      }
    }
  } else {
    // Add omit rule
    addOmitRule(themeGroupName, themeName, subthemeName, "");
    // Update the current item's appearance
    container.classList.add("omitted");
    const omitIndicator = document.createElement("span");
    omitIndicator.className = "omit-indicator";
    omitIndicator.setAttribute("aria-label", "Filtered out");
    omitIndicator.textContent = "🚫";
    omitIndicator.title = `This ${getItemType(themeGroupName, themeName, subthemeName)} is filtered out`;
    textElement.insertBefore(omitIndicator, textElement.firstChild);
    controlButton.textContent = "👁️";
    controlButton.title = `Remove filter for this ${getItemType(themeGroupName, themeName, subthemeName)}`;
    controlButton.setAttribute(
      "aria-label",
      `Remove filter for this ${getItemType(themeGroupName, themeName, subthemeName)}`,
    );
    // Refresh catalog data
    if (window.refreshCatalogData) {
      window.refreshCatalogData();
    }
  }
}

// Helper function to get item type for accessibility
function getItemType(themeGroupName, themeName, subthemeName) {
  if (subthemeName) return "subtheme";
  if (themeName) return "theme";
  return "theme group";
}

// Show/hide theme hierarchy dialog using modern dialog element
export function toggleThemeHierarchyDialog() {
  const dialog = document.querySelector(".theme-hierarchy-dialog");

  if (!dialog.hasAttribute("open")) {
    // Opening the modal
    dialog.showModal();
    dialog.setAttribute("data-open", "true");

    // Build the tree structure
    createThemeHierarchyTree();

    // Focus management
    const closeBtn = dialog.querySelector(".theme-hierarchy-close-btn");
    setTimeout(() => {
      closeBtn.focus();
    }, 100);

    // Handle close events
    const handleClose = () => {
      dialog.removeAttribute("data-open");
      // Return focus to the button that opened the modal
      const hierarchyButton = document.querySelector(".theme-hierarchy-btn");
      if (hierarchyButton) {
        hierarchyButton.focus();
      }
    };

    // Close button handler
    const closeBtnHandler = () => {
      dialog.close();
      handleClose();
    };

    // Store handlers for cleanup
    dialog._closeBtnHandler = closeBtnHandler;
    closeBtn.addEventListener("click", closeBtnHandler);

    // Handle dialog close event
    const dialogCloseHandler = () => {
      handleClose();
      // Clean up event listeners
      if (dialog._closeBtnHandler) {
        closeBtn.removeEventListener("click", dialog._closeBtnHandler);
        delete dialog._closeBtnHandler;
      }
    };

    dialog._dialogCloseHandler = dialogCloseHandler;
    dialog.addEventListener("close", dialogCloseHandler);
  } else {
    // Closing the modal
    dialog.close();
  }
}
