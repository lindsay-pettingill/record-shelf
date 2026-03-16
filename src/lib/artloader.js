// Rate-limited MusicBrainz + Cover Art Archive loader
// MusicBrainz allows ~1 req/sec without auth

const queue = [];
let running = false;
const cache = new Map();

function initFromStorage() {
  if (typeof localStorage === 'undefined') return;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith('ra:')) {
      const v = localStorage.getItem(k);
      cache.set(k, v === '' ? null : v);
    }
  }
}

if (typeof window !== 'undefined') initFromStorage();

export function requestArt(id, artist, album, callback) {
  const key = `ra:${id}`;
  if (cache.has(key)) {
    callback(cache.get(key));
    return;
  }
  queue.push({ key, artist, album, callback });
  if (!running) drain();
}

async function drain() {
  running = true;
  while (queue.length > 0) {
    const item = queue.shift();
    const url = await resolveArt(item.artist, item.album);
    cache.set(item.key, url);
    try { localStorage.setItem(item.key, url ?? ''); } catch {}
    item.callback(url);
    if (queue.length > 0) await sleep(1100);
  }
  running = false;
}

async function resolveArt(artist, album) {
  // Try exact match first, then relaxed
  for (const q of [
    `artist:"${artist}" AND release:"${album}"`,
    `${artist} ${album}`
  ]) {
    try {
      const res = await fetch(
        `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(q)}&limit=5&fmt=json`,
        { headers: { 'User-Agent': 'RecordShelf/1.0 (github.com/record-shelf)' } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const releases = data.releases ?? [];
      if (!releases.length) continue;

      // Return URL for best match; browser img handles redirect + error
      return `https://coverartarchive.org/release/${releases[0].id}/front`;
    } catch {
      continue;
    }
  }
  return null;
}

export function clearArtCache() {
  cache.clear();
  if (typeof localStorage !== 'undefined') {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith('ra:')) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
