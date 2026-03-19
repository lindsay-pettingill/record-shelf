// Rate-limited MusicBrainz + Cover Art Archive loader
// MusicBrainz allows ~1 req/sec without auth

const queue = [];
let running = false;
const cache      = new Map(); // ra:{id} → art URL
const mbIdCache  = new Map(); // ri:{id} → MusicBrainz release MBID
const detailCache = new Map(); // rd:{id} → detail object

function initFromStorage() {
  if (typeof localStorage === 'undefined') return;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith('ra:')) {
      const v = localStorage.getItem(k);
      cache.set(k, v === '' ? null : v);
    } else if (k?.startsWith('ri:')) {
      mbIdCache.set(k, localStorage.getItem(k) || null);
    } else if (k?.startsWith('rd:')) {
      const v = localStorage.getItem(k);
      try { detailCache.set(k, v ? JSON.parse(v) : null); } catch {}
    }
  }
}

if (typeof window !== 'undefined') initFromStorage();

export function requestArt(id, artist, album, callback, overrideUrl) {
  if (overrideUrl) {
    const key = `ra:${id}`;
    cache.set(key, overrideUrl);
    try { localStorage.setItem(key, overrideUrl); } catch {}
    callback(overrideUrl);
    return;
  }
  const key = `ra:${id}`;
  if (cache.has(key)) { callback(cache.get(key)); return; }
  queue.push({ type: 'art', key, id, artist, album, callback });
  if (!running) drain();
}

// Priority: detail requests jump to the front of the queue
export function requestDetails(id, artist, album, callback) {
  const key = `rd:${id}`;
  if (detailCache.has(key)) { callback(detailCache.get(key)); return; }
  queue.unshift({ type: 'details', key, id, artist, album, callback });
  if (!running) drain();
}

async function drain() {
  running = true;
  while (queue.length > 0) {
    const item = queue.shift();
    if (item.type === 'art') {
      const { url, mbid } = await resolveArt(item.artist, item.album);
      cache.set(item.key, url);
      try { localStorage.setItem(item.key, url ?? ''); } catch {}
      if (mbid) {
        mbIdCache.set(`ri:${item.id}`, mbid);
        try { localStorage.setItem(`ri:${item.id}`, mbid); } catch {}
      }
      if (url && typeof window !== 'undefined') {
        const img = new Image();
        img.src = url;
      }
      item.callback(url);
    } else if (item.type === 'details') {
      const details = await resolveDetails(item.id, item.artist, item.album);
      detailCache.set(item.key, details);
      try { localStorage.setItem(item.key, details ? JSON.stringify(details) : ''); } catch {}
      item.callback(details);
    }
    if (queue.length > 0) await sleep(1100);
  }
  running = false;
}

async function resolveArt(artist, album) {
  for (const q of [
    `artist:"${artist}" AND release:"${album}"`,
    `${artist} ${album}`
  ]) {
    try {
      const res = await fetch(
        `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(q)}&limit=5&fmt=json`,
        { headers: { 'User-Agent': 'RecordShelf/1.0 (github.com/lindsay-pettingill/record-shelf)' } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const releases = data.releases ?? [];
      if (!releases.length) continue;
      const mbid = releases[0].id;
      return { url: `https://coverartarchive.org/release/${mbid}/front-500`, mbid };
    } catch { continue; }
  }
  return { url: null, mbid: null };
}

async function resolveDetails(id, artist, album) {
  try {
    let mbid = mbIdCache.get(`ri:${id}`);

    // If we don't have a cached MBID yet, search first
    if (!mbid) {
      const q = `artist:"${artist}" AND release:"${album}"`;
      const res = await fetch(
        `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(q)}&limit=1&fmt=json`,
        { headers: { 'User-Agent': 'RecordShelf/1.0 (github.com/lindsay-pettingill/record-shelf)' } }
      );
      if (!res.ok) return null;
      const data = await res.json();
      const releases = data.releases ?? [];
      if (!releases.length) return null;
      mbid = releases[0].id;
      mbIdCache.set(`ri:${id}`, mbid);
      try { localStorage.setItem(`ri:${id}`, mbid); } catch {}
      // Rate limit between search and detail lookup
      await sleep(1100);
    }

    const res = await fetch(
      `https://musicbrainz.org/ws/2/release/${mbid}?inc=recordings+labels&fmt=json`,
      { headers: { 'User-Agent': 'RecordShelf/1.0 (github.com/lindsay-pettingill/record-shelf)' } }
    );
    if (!res.ok) return null;
    const data = await res.json();

    const tracklist = (data.media?.[0]?.tracks ?? []).map(t => ({
      position: t.position,
      title: t.title,
      length: t.length ?? null, // milliseconds
    }));

    const labelInfo = data['label-info']?.[0];
    const label   = labelInfo?.label?.name ?? null;
    const catalog = labelInfo?.['catalog-number'] ?? null;
    const country = data.country ?? null;

    return { tracklist, label, catalog, country };
  } catch {
    return null;
  }
}

export function clearArtCache() {
  cache.clear();
  mbIdCache.clear();
  detailCache.clear();
  if (typeof localStorage !== 'undefined') {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith('ra:') || k?.startsWith('ri:') || k?.startsWith('rd:')) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
