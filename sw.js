// Service Worker for caching decompressed LEGO data
const CACHE_NAME = "lego-data-cache-v1";
const DATA_CACHE_NAME = "lego-decompressed-data-v1";

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        "/",
        "/src/client/styles.css",
        "/src/client/catalog.mjs",
        "/src/client/catalogCard.mjs",
        "/src/client/data.mjs",
        "/data/tuples.mjs",
        "/data/decompress.mjs",
      ]);
    }),
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});

// Fetch event - handle data caching
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Handle tuples.mjs data file
  if (url.pathname.includes("tuples.mjs")) {
    event.respondWith(handleDataFetch(event.request));
    return;
  }

  // Handle other requests with cache-first strategy
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response; // Return cached version
      }
      return fetch(event.request).then((response) => {
        // Cache successful responses
        if (response && response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      });
    }),
  );
});

// Handle data file fetching with decompression caching
async function handleDataFetch(request) {
  try {
    // First, try to get decompressed data from cache
    const dataCache = await caches.open(DATA_CACHE_NAME);
    const cachedResponse = await dataCache.match("decompressed-data");

    if (cachedResponse) {
      console.log("Returning cached decompressed data");
      return cachedResponse;
    }

    // If not cached, fetch and decompress
    console.log("Fetching and decompressing data...");
    const response = await fetch(request);

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status}`);
    }

    // Decompress the data
    const compressedText = await response.text();
    const decompressedData = await decompressData(compressedText);

    // Cache the decompressed data
    const decompressedResponse = new Response(
      JSON.stringify(decompressedData),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=86400", // Cache for 24 hours
        },
      },
    );

    await dataCache.put("decompressed-data", decompressedResponse.clone());
    console.log("Data decompressed and cached");

    return decompressedResponse;
  } catch (error) {
    console.error("Error handling data fetch:", error);
    // Fallback to original request
    return fetch(request);
  }
}

// Decompress data using the same logic as the client
async function decompressData(compressedText) {
  // Extract the base64 data from the MJS file
  const base64Match = compressedText.match(/const compressedData = "([^"]+)"/);
  const base64LookupsMatch = compressedText.match(
    /const compressedLookups = "([^"]+)"/,
  );

  if (!base64Match || !base64LookupsMatch) {
    throw new Error("Could not extract compressed data from MJS file");
  }

  const base64Data = base64Match[1];
  const base64Lookups = base64LookupsMatch[1];

  // Convert base64 to Uint8Array
  const uint8Data = base64ToUint8Array(base64Data);
  const uint8Lookups = base64ToUint8Array(base64Lookups);

  // Decompress using streaming
  const decompressedString = await decompress(uint8Data);
  const decompressedLookups = await decompress(uint8Lookups);

  // Parse the data
  const tupleList = JSON.parse(decompressedString);
  const lookups = JSON.parse(decompressedLookups);

  return { tupleList, lookups };
}

// Streaming decompression function
async function decompress(compressedData, encoding = "gzip") {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(compressedData);
      controller.close();
    },
  });

  const decompressedStream = stream.pipeThrough(
    new DecompressionStream(encoding),
  );
  const response = await new Response(decompressedStream);
  return response.text();
}

// Convert base64 string back to Uint8Array
function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
