import { decompress } from "./decompress.mjs";

function buildFromTuples(keys, lookups, tupleList) {
  const list = [];
  for (const tuple of tupleList) {
    const data = {};
    for (let i = 0; i < tuple.length; i++) {
      data[keys[i]] = tuple[i];
      if (keys[i] === "ThemeGroup") {
        data.ThemeGroup = lookups[tuple[i]];
      }
      if (keys[i] === "Theme") {
        data.Theme = lookups[tuple[i]];
      }
      if (keys[i] === "Subtheme") {
        data.Subtheme = lookups[tuple[i]];
      }
    }
    list.push(data);
  }
  return list;
}
const keys = [
  "YearFrom",
  "Theme",
  "ThemeGroup",
  "Subtheme",
  "SetName",
  "ImageFilename",
  "USRetailPrice",
  "USDateAdded",
  "USDateRemoved",
  "BrickLinkSoldPriceNew",
  "BrickLinkSoldPriceUsed",
  "LaunchDate",
  "ExitDate",
  "ItemNumber",
];
// Convert base64 back to Uint8Array
function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Decompress and parse the data
async function loadData() {
  const json = import("./tuples.json");
  return json;
}

export default loadData;
