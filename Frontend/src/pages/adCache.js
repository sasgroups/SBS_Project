const CACHE_NAME = "kiosk-ads-cache";

export async function syncAds(serverAds, API_URL) {
  const cache = await caches.open(CACHE_NAME);

  // Download / update
  for (const ad of serverAds) {
    const cached = await cache.match(ad.filename);

    if (!cached) {
      const res = await fetch(`${API_URL}/uploads/${ad.filename}`);
      await cache.put(ad.filename, res);
    }
  }

  // Delete removed ads
  const keys = await cache.keys();
  for (const req of keys) {
    const file = req.url.split("/").pop();
    if (!serverAds.find(a => a.filename === file)) {
      await cache.delete(req);
    }
  }
}

export async function getLocalMedia(filename) {
  const cache = await caches.open(CACHE_NAME);
  const res = await cache.match(filename);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
