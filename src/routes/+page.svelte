<script>
  import { onMount } from 'svelte';
  import AlbumCard from '$lib/components/AlbumCard.svelte';
  import DetailView from '$lib/components/DetailView.svelte';
  import StackedView from '$lib/components/StackedView.svelte';
  import GraphView from '$lib/components/GraphView.svelte';
  import { fetchCollection, getGenres } from '$lib/data.js';

  let records = [];
  let search = '';
  let activeGenre = 'All';
  let loading = true;
  let selectedRecord = null;
  let selectedArt = null;
  let viewMode = 'stacked'; // 'stacked' | 'grid'

  let genres = [];
  let showSuggestions = false;
  let scatterMap = {}; // pre-computed scatter directions per record id
  let scattering = false;
  let reforming = false;
  let stackResetKey = 0;

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  onMount(async () => {
    records = await fetchCollection();
    genres = ['All', ...getGenres(records)];
    // Golden-angle scatter directions — unique per record, evenly distributed
    records.forEach((r, i) => {
      const angle = (i * 137.508 * Math.PI) / 180;
      scatterMap[r.id] = { x: Math.cos(angle), y: Math.sin(angle) };
    });
    loading = false;
  });

  async function selectGenre(genre) {
    const next = genre === activeGenre ? 'All' : genre;
    scattering = true;
    reforming = false;
    await sleep(280);
    activeGenre = next;
    stackResetKey += 1; // pull first record of new filtered set
    scattering = false;
    reforming = true;
    await sleep(30);
    reforming = false;
  }

  // Inline activeGenre + search directly so Svelte 5 tracks them as dependencies
  $: visibilityMap = (() => {
    const q = search.toLowerCase().trim();
    const map = {};
    for (const r of records) {
      const matchesSearch = !q ||
        r.artist?.toLowerCase().includes(q) ||
        r.album?.toLowerCase().includes(q) ||
        String(r.year || '').includes(q);
      const matchesGenre = activeGenre === 'All' || r.genre === activeGenre;
      map[r.id] = matchesSearch && matchesGenre;
    }
    return map;
  })();

  $: visibleCount = Object.values(visibilityMap).filter(Boolean).length;
  $: filteredRecords = records.filter(r => visibilityMap[r.id]);

  // Reset stack position when search changes so you always start at record 1
  let prevSearch = '';
  $: if (search !== prevSearch) { prevSearch = search; stackResetKey += 1; }

  function openDetail(record, artUrl) {
    selectedRecord = record;
    selectedArt = artUrl;
  }

  function closeDetail() {
    selectedRecord = null;
    selectedArt = null;
  }

  function navigateDetail(dir) {
    const idx = records.indexOf(selectedRecord);
    const next = records[(idx + dir + records.length) % records.length];
    selectedRecord = next;
    selectedArt = null; // will resolve from cache via artloader
    // grab from cache
    import('$lib/artloader.js').then(({ requestArt }) => {
      requestArt(next.id, next.artist, next.album, url => { selectedArt = url; });
    });
  }

  $: suggestions = (() => {
    if (!showSuggestions || search.length < 2) return [];
    const q = search.toLowerCase();
    const seen = new Set();
    const results = [];
    for (const r of records) {
      if (r.artist?.toLowerCase().includes(q) && !seen.has('a:' + r.artist)) {
        seen.add('a:' + r.artist);
        results.push({ kind: 'artist', label: r.artist });
      }
    }
    for (const r of records) {
      if (r.album?.toLowerCase().includes(q) && !seen.has('b:' + r.album)) {
        seen.add('b:' + r.album);
        results.push({ kind: 'album', label: r.album, sub: r.artist });
      }
      if (results.length >= 7) break;
    }
    return results.slice(0, 7);
  })();

  function pickSuggestion(label) {
    search = label;
    showSuggestions = false;
  }

  function handleKeydown(e) {
    if (selectedRecord) return; // detail view handles its own keys
    if (e.key === 'Escape') { search = ''; activeGenre = 'All'; showSuggestions = false; stackResetKey += 1; }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="shell">
  <header>
    <div class="wordmark">
      <span class="dot">◉</span>
      <span class="name">Record Shelf</span>
    </div>
    <div class="search-wrap">
      <input
        class="search"
        type="text"
        placeholder="Search artist, album, year…"
        bind:value={search}
        spellcheck="false"
        autocomplete="off"
        on:focus={() => showSuggestions = true}
        on:blur={() => setTimeout(() => showSuggestions = false, 150)}
      />
      {#if search}
        <button class="clear" on:click={() => search = ''} aria-label="Clear search">✕</button>
      {/if}
      {#if showSuggestions && suggestions.length > 0}
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div class="suggestions">
          {#each suggestions as s}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div class="suggestion" on:click={() => pickSuggestion(s.label)}>
              <span class="s-kind">{s.kind}</span>
              <span class="s-label">{s.label}</span>
              {#if s.sub}<span class="s-sub">{s.sub}</span>{/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
    <div class="right-controls">
      <div class="view-toggle">
        <button class="vbtn" class:active={viewMode === 'stacked'} on:click={() => viewMode = 'stacked'} title="Stacked view">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="9" width="10" height="6" rx="1" opacity="0.4"/><rect x="3" y="5" width="10" height="6" rx="1" opacity="0.65"/><rect x="5" y="1" width="10" height="6" rx="1"/></svg>
        </button>
        <button class="vbtn" class:active={viewMode === 'grid'} on:click={() => viewMode = 'grid'} title="Grid view">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>
        </button>
        <button class="vbtn" class:active={viewMode === 'graph'} on:click={() => viewMode = 'graph'} title="Artist graph">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="3"  cy="13" r="2"/><circle cx="8"  cy="3"  r="2"/><circle cx="13" cy="10" r="2"/>
            <line x1="3" y1="13" x2="8"  y2="3"  stroke="currentColor" stroke-width="1.5"/>
            <line x1="8" y1="3"  x2="13" y2="10" stroke="currentColor" stroke-width="1.5"/>
            <line x1="3" y1="13" x2="13" y2="10" stroke="currentColor" stroke-width="1.5"/>
          </svg>
        </button>
      </div>
      {#if !loading}
        <span class="muted">{visibleCount} of {records.length}</span>
      {/if}
    </div>
  </header>

  {#if genres.length > 1}
    <div class="chips">
      {#each genres as genre}
        <button
          class="chip"
          class:active={activeGenre === genre}
          on:click={() => selectGenre(genre)}
        >
          {genre}
        </button>
      {/each}
    </div>
  {/if}

  {#if loading}
    <div class="loading-grid">
      {#each Array(12) as _}
        <div class="skeleton"></div>
      {/each}
    </div>
  {:else if viewMode === 'stacked'}
    {#if !selectedRecord}
      <StackedView
        records={filteredRecords}
        {scattering}
        {reforming}
        resetKey={stackResetKey}
        on:open={e => openDetail(e.detail.record, e.detail.artUrl)}
      />
    {/if}
  {:else if viewMode === 'graph'}
    <GraphView
      records={filteredRecords}
      on:filter={e => { search = e.detail.artist; viewMode = 'stacked'; }}
      on:open={e => openDetail(e.detail.record, e.detail.artUrl)}
    />
  {:else}
    <div class="grid">
      {#each records as record (record.id)}
        <AlbumCard
          {record}
          visible={visibilityMap[record.id]}
          {scattering}
          {reforming}
          scatterX={scatterMap[record.id]?.x ?? 0}
          scatterY={scatterMap[record.id]?.y ?? 0}
          on:open={e => openDetail(e.detail.record, e.detail.artUrl)}
        />
      {/each}
    </div>
  {/if}
{#if selectedRecord}
  <DetailView
    record={selectedRecord}
    artUrl={selectedArt}
    allRecords={records}
    on:close={closeDetail}
    on:next={() => navigateDetail(1)}
    on:prev={() => navigateDetail(-1)}
    on:select={e => openDetail(e.detail, null)}
  />
{/if}

</div>

<style>
  .shell {
    min-height: 100vh;
    padding-bottom: 4rem;
  }

  /* Header */
  header {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 1.5rem;
    padding: 1.5rem 2rem 1rem;
  }

  .wordmark {
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
  }

  .dot {
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.3);
    line-height: 1;
  }

  .name {
    font-size: 15px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.7);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .search-wrap {
    position: relative;
  }

  .search {
    width: 100%;
    padding: 11px 20px;
    font-size: 15px;
    font-family: inherit;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 100px;
    color: #e8e8e8;
    outline: none;
    transition:
      border-color 0.2s,
      background 0.2s,
      box-shadow 0.2s;
  }

  .search::placeholder {
    color: rgba(255, 255, 255, 0.25);
  }

  .search:focus {
    border-color: rgba(255, 255, 255, 0.25);
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.04);
  }

  .suggestions {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    background: #141414;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    overflow: hidden;
    z-index: 50;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
  }

  .suggestion {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 16px;
    cursor: pointer;
    transition: background 0.1s;
  }

  .suggestion:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  .s-kind {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(255, 255, 255, 0.25);
    width: 36px;
    flex-shrink: 0;
  }

  .s-label {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.85);
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .s-sub {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.3);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 120px;
  }

  .clear {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.3);
    font-size: 12px;
    padding: 4px;
    line-height: 1;
    transition: color 0.15s;
  }

  .clear:hover {
    color: rgba(255, 255, 255, 0.7);
  }

  .right-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: flex-end;
    white-space: nowrap;
  }

  .view-toggle {
    display: flex;
    gap: 2px;
    background: rgba(255,255,255,0.05);
    border-radius: 8px;
    padding: 3px;
  }

  .vbtn {
    background: none;
    border: none;
    color: rgba(255,255,255,0.3);
    width: 30px;
    height: 30px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s;
  }
  .vbtn:hover { color: rgba(255,255,255,0.6); }
  .vbtn.active {
    background: rgba(255,255,255,0.1);
    color: #fff;
  }

  .muted {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.25);
    letter-spacing: 0.02em;
  }

  /* Genre chips */
  .chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    padding: 0 2rem 1.25rem;
  }

  .chip {
    padding: 5px 14px;
    border-radius: 100px;
    font-size: 12px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.4);
    background: transparent;
    transition: all 0.15s;
    letter-spacing: 0.01em;
  }

  .chip:hover {
    border-color: rgba(255, 255, 255, 0.35);
    color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.05);
  }

  .chip.active {
    border-color: rgba(255, 255, 255, 0.5);
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
  }

  /* Grid */
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(155px, 1fr));
    gap: 10px;
    padding: 0 2rem;
  }

  /* Loading skeleton */
  .loading-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(155px, 1fr));
    gap: 10px;
    padding: 0 2rem;
  }

  .skeleton {
    aspect-ratio: 1;
    border-radius: 6px;
    background: linear-gradient(135deg, #1a1a1a, #222);
    animation: pulse 1.6s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }

  /* ── Mobile ── */
  @media (max-width: 640px) {
    header {
      grid-template-columns: auto 1fr;
      grid-template-rows: auto auto;
      gap: 0.75rem;
      padding: 1rem 1.25rem 0.75rem;
    }

    .right-controls { grid-column: 2; justify-content: flex-end; }
    .search-wrap    { grid-column: 1 / -1; }

    .chips { padding: 0 1.25rem 1rem; gap: 5px; }
    .chip  { font-size: 11px; padding: 4px 11px; }

    .grid {
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      padding: 0 1.25rem;
    }
  }
</style>
