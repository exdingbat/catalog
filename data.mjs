import flatData from "./flat.json" with { type: "json" };
import { SKIP_SUBTHEMES, SKIP_THEMES, SKIP_NESTED } from "./constants.mjs";
import {
  getDate,
  getImg,
  getBricklink,
  getBrickset,
  getLego,
} from "./helpers.mjs";

const NOW = new Date();
export const THEMES = new Map();

function flatDataToCatalogCardData(x) {
  const retiredDate = getDate(x.ExitDate || x.USDateRemoved);
  const retired =
    retiredDate === null ||
    (retiredDate < NOW && retiredDate.getFullYear() !== 2025);
  const retiredString = retiredDate?.toLocaleDateString("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const id = x.Number;
  const v = x.Variant;
  return {
    theme: x.Theme,
    subtheme: x.Subtheme,
    themeGroup: x.ThemeGroup,
    note: retiredString || "",
    retired,
    ["aspect-ratio"]: x.dimensions?.aspectRatio,
    name: x.SetName || "",
    year: x.YearFrom,
    itemnumber: `${x.Number}-${x.Variant}`,
    variant: x.Variant,
    category: [x.Theme.toUpperCase(), x.Subtheme].filter(Boolean).join(" "),
    price: retired
      ? x.BrickLinkSoldPriceUsed.replace(/(?<=\d)00/, "")
      : x.USRetailPrice,
    img: x.ImageFilename ? getImg(id, v) : "",
    links: {
      lego: getLego(id, v),
      brickset: getBrickset(id, v),
      brinklink: getBricklink(id, v),
    },
  };
}
const [nestedCardData, byTheme, flatCardData] = flatData.reduce(
  (acc, x) => {
    if (!x || !x.ThemeGroup) return acc;
    else if (
      SKIP_NESTED.some(
        ([theme, subtheme]) => x.Theme === theme && x.Subtheme === subtheme,
      )
    ) {
      return acc;
    } else if (SKIP_THEMES.includes(x.Theme)) {
      return acc;
    } else if (SKIP_SUBTHEMES.includes(x.Subtheme)) {
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
    }

    nested[x.ThemeGroup][x.Theme][x.Subtheme].push(cardData);
    byTheme[x.Theme].push(cardData);
    flat.push(cardData);
    const subthemes = THEMES.get(x.Theme) || new Set();
    THEMES.set(x.Theme, subthemes);
    subthemes.add(x.Subtheme);

    return acc;
  },
  [{}, {}, []],
);

export default Object.values(byTheme);
console.log("byTheme", Object.values(byTheme));
export { nestedCardData };
export { flatCardData };
console.log({ nestedCardData, flatCardData, byTheme });
