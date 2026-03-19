const SHEET_ID = '1lf01a3wcRo6nTWNk3pMD3A-6h3v8DWz_cKr-rChRN4c';

export const SAMPLE_RECORDS = [
  { id: 1,  artist: 'Keith Jarrett',               album: 'The Köln Concert',                       year: 1975, genre: 'Jazz',                  tags: 'Live',       format: 'LP',          notes: '' },
  { id: 2,  artist: 'Maggie Rogers',               album: 'Heard It in a Past Life',                year: 2019, genre: 'Pop',                   tags: '',           format: 'LP',          notes: '' },
  { id: 3,  artist: 'Waxahatchee',                 album: 'Saint Cloud',                            year: 2020, genre: 'Folk/Americana',         tags: '',           format: 'LP',          notes: '' },
  { id: 4,  artist: 'Crosby, Stills, Nash & Young',album: 'Greatest Hits',                          year: 1974, genre: 'Folk/Americana',         tags: '',           format: 'Compilation', notes: '' },
  { id: 5,  artist: 'Various',                     album: 'A Motown Christmas',                     year: 1973, genre: 'Soul/R&B',               tags: 'Holiday',    format: 'Compilation', notes: '' },
  { id: 6,  artist: 'R.E.M.',                      album: 'Reckoning',                              year: 1984, genre: 'Rock',                   tags: '',           format: 'LP',          notes: '' },
  { id: 7,  artist: 'R.E.M.',                      album: 'Bang and Blame',                         year: 1994, genre: 'Rock',                   tags: '',           format: 'Single',      notes: '' },
  { id: 8,  artist: 'Neil Young',                  album: 'After the Gold Rush',                    year: 1970, genre: 'Folk/Americana',         tags: '',           format: 'LP',          notes: '' },
  { id: 9,  artist: '10,000 Maniacs',              album: 'MTV Unplugged',                          year: 1993, genre: 'Folk/Americana',         tags: 'Live',       format: 'LP',          notes: '' },
  { id: 10, artist: '10,000 Maniacs',              album: 'Our Time in Eden',                       year: 1992, genre: 'Folk/Americana',         tags: '',           format: 'LP',          notes: '' },
  { id: 11, artist: '10,000 Maniacs',              album: 'Hope Chest',                             year: 1982, genre: 'Folk/Americana',         tags: '',           format: 'Compilation', notes: '' },
  { id: 12, artist: 'R.E.M.',                      album: "Life's Rich Pageant",                    year: 1986, genre: 'Rock',                   tags: '',           format: 'LP',          notes: '' },
  { id: 13, artist: 'R.E.M.',                      album: 'Monster',                                year: 1994, genre: 'Rock',                   tags: '',           format: 'LP',          notes: '' },
  { id: 14, artist: 'R.E.M.',                      album: 'Murmur',                                 year: 1983, genre: 'Rock',                   tags: '',           format: 'LP',          notes: '' },
  { id: 15, artist: 'R.E.M.',                      album: 'Document',                               year: 1987, genre: 'Rock',                   tags: '',           format: 'LP',          notes: '' },
  { id: 16, artist: 'Men At Work',                 album: 'Business As Usual',                      year: 1982, genre: 'Rock',                   tags: '',           format: 'LP',          notes: '' },
  { id: 17, artist: 'Various',                     album: 'In Harmony: A Sesame Street Record',     year: 1980, genre: 'Folk/Americana',         tags: "Children's", format: 'Compilation', notes: '' },
  { id: 18, artist: 'Natalie Merchant',            album: 'Keep Your Courage',                      year: 2023, genre: 'Folk/Americana',         tags: '',           format: 'LP',          notes: '' },
  { id: 19, artist: '10,000 Maniacs',              album: 'The Wishing Chair',                      year: 1985, genre: 'Folk/Americana',         tags: '',           format: 'LP',          notes: '' },
  { id: 20, artist: '10,000 Maniacs',              album: 'In My Tribe',                            year: 1987, genre: 'Folk/Americana',         tags: '',           format: 'LP',          notes: '' },
  { id: 21, artist: '10,000 Maniacs',              album: "Blind Man's Zoo",                        year: 1989, genre: 'Folk/Americana',         tags: '',           format: 'LP',          notes: '' },
  { id: 22, artist: 'Stevie Wonder',               album: 'Talking Book',                           year: 1972, genre: 'Soul/R&B',               tags: '',           format: 'LP',          notes: '' },
  { id: 23, artist: 'Talking Heads',               album: 'The Name of This Band is Talking Heads', year: 1982, genre: 'Rock',                   tags: 'Live',       format: 'LP',          notes: '' },
  { id: 24, artist: 'Talking Heads',               album: 'Stop Making Sense',                      year: 1984, genre: 'Rock',                   tags: 'Live',       format: 'LP',          notes: '' },
  { id: 25, artist: 'James Taylor',                album: 'Greatest Hits',                          year: 1976, genre: 'Folk/Americana',         tags: '',           format: 'Compilation', notes: '' },
  { id: 26, artist: 'Fleetwood Mac',               album: 'Greatest Hits',                          year: 1988, genre: 'Rock',                   tags: '',           format: 'Compilation', notes: '' },
  { id: 27, artist: 'David Bowie',                 album: 'Hunky Dory',                             year: 1971, genre: 'Rock',                   tags: '',           format: 'LP',          notes: 'Remastered' },
  { id: 28, artist: 'Neil Young',                  album: 'Harvest',                                year: 1972, genre: 'Folk/Americana',         tags: '',           format: 'LP',          notes: '' },
  { id: 29, artist: 'Harry Nilsson',               album: 'Duit On Mon Dei',                        year: 1975, genre: 'Pop',                    tags: '',           format: 'LP',          notes: '' },
];

const CACHE_KEY = 'rc:collection';

export async function fetchCollection() {
  // Return cached data immediately if available, then refresh in background
  const cached = getCachedCollection();

  const fetchFresh = async () => {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const parsed = parseCSV(text);
      if (parsed.length === 0) throw new Error('Empty result');
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(parsed)); } catch {}
      return parsed;
    } catch (e) {
      console.warn('Sheet fetch failed:', e.message);
      return null;
    }
  };

  if (cached) {
    fetchFresh(); // refresh cache in background, don't await
    return cached;
  }

  return (await fetchFresh()) ?? SAMPLE_RECORDS;
}

function getCachedCollection() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const KNOWN_FORMATS = new Set(['lp', 'single', 'ep', 'compilation']);
const KNOWN_TAGS    = new Set(['live', 'holiday', "children's", 'bootleg']);

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = parseRow(lines[0]).map(h =>
    h.replace(/^"|"$/g, '').toLowerCase().trim()
  );
  return lines.slice(1).map((line, i) => {
    const vals = parseRow(line);
    const obj = { id: i + 1 };
    headers.forEach((h, j) => {
      obj[h] = vals[j]?.replace(/^"|"$/g, '').trim() ?? '';
    });

    // Normalize: if format column holds a tag value (e.g. "Live"), move it to tags
    if (obj.format && KNOWN_TAGS.has(obj.format.toLowerCase())) {
      const existing = obj.tags ? obj.tags + ', ' + obj.format : obj.format;
      obj.tags   = existing;
      obj.format = 'LP';
    }
    if (!obj.format || !KNOWN_FORMATS.has(obj.format.toLowerCase())) {
      obj.format = 'LP';
    } else {
      // Capitalize
      obj.format = obj.format.charAt(0).toUpperCase() + obj.format.slice(1).toLowerCase();
      if (obj.format === 'Lp') obj.format = 'LP';
      if (obj.format === 'Ep') obj.format = 'EP';
    }

    // Normalize genre: take first value if comma-separated (e.g. "Folk/Americana, Rock" → "Folk/Americana")
    if (obj.genre) {
      obj.genre = obj.genre.split(/[,·]/)[0].trim();
    }

    return obj;
  }).filter(r => r.artist && r.album);
}

function parseRow(line) {
  const cells = [];
  let cell = '', inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; }
    else if (ch === ',' && !inQ) { cells.push(cell); cell = ''; }
    else { cell += ch; }
  }
  cells.push(cell);
  return cells;
}

export function getGenres(records) {
  const genres = new Set();
  for (const r of records) {
    const g = (r.genre || '').trim();
    if (g) genres.add(g);
  }
  return [...genres].sort();
}
