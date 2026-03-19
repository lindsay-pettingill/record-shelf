<script>
  import { onMount } from 'svelte';
  import AlbumCard from '$lib/components/AlbumCard.svelte';
  import DetailView from '$lib/components/DetailView.svelte';
  import CrateView from '$lib/components/CrateView.svelte';
  import ShelfView from '$lib/components/ShelfView.svelte';
  import GraphView from '$lib/components/GraphView.svelte';
  import { fetchCollection, getGenres } from '$lib/data.js';

  let records = [];
  let search = '';
  let activeGenre = 'All';
  let loading = true;
  let selectedRecord = null;
  let selectedArt = null;
  let viewMode = 'shelf'; // 'shelf' | 'crate' | 'grid' | 'graph'
  let preSearchViewMode = 'shelf'; // restore when search is cleared

  let genres = [];
  let showSuggestions = false;
  let showViewPicker = false;

  const views = [
    { id: 'shelf', label: 'Shelf' },
    { id: 'crate', label: 'Crate' },
    { id: 'grid',  label: 'Grid'  },
  ];

  function pickView(id) {
    viewMode = id;
    showViewPicker = false;
  }
  let stackResetKey = 0;

  // ── Discover ──
  let discoverReasons = {}; // id → reason string
  let discovering = false;
  $: discoverActive = Object.keys(discoverReasons).length > 0;
  $: searchWordCount = search.trim().split(/\s+/).filter(Boolean).length;
  $: showRecordHint = searchWordCount >= 3 && !discoverActive && !discovering;

  async function runDiscover() {
    if (discovering || searchWordCount < 3) return;
    discovering = true;
    showSuggestions = false;
    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: search,
          records: records.map(r => ({ id: r.id, artist: r.artist, album: r.album, year: r.year, genre: r.genre }))
        })
      });
      const { results } = await res.json();
      discoverReasons = Object.fromEntries(results.map(r => [r.id, r.reason]));
      if (viewMode !== 'grid') { preSearchViewMode = viewMode; viewMode = 'grid'; }
    } catch (e) {
      console.error('discover error', e);
    }
    discovering = false;
  }

  function pickRandom() {
    if (!records.length) return;
    const r = records[Math.floor(Math.random() * records.length)];
    import('$lib/artloader.js').then(({ requestArt }) => {
      requestArt(r.id, r.artist, r.album, url => openDetail(r, url), r.imageUrl);
    });
  }

  function clearDiscover() {
    discoverReasons = {};
    search = '';
    stackResetKey += 1;
    viewMode = preSearchViewMode;
  }

onMount(async () => {
    records = await fetchCollection();
    genres = ['All', ...getGenres(records)];
    loading = false;
  });

  function selectGenre(genre) {
    activeGenre = genre === activeGenre ? 'All' : genre;
    stackResetKey += 1;
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

  $: visibleCount = discoverActive
    ? Object.keys(discoverReasons).length
    : Object.values(visibilityMap).filter(Boolean).length;
  $: filteredRecords = discoverActive
    ? records.filter(r => discoverReasons[r.id])
    : records.filter(r => visibilityMap[r.id]);

  // Switch to grid when searching, restore when cleared
  let prevSearch = '';
  $: if (search !== prevSearch) {
    const wasEmpty = prevSearch === '';
    const isEmpty  = search === '';
    prevSearch = search;
    stackResetKey += 1;
    if (!wasEmpty && isEmpty && !discoverActive) {
      viewMode = preSearchViewMode;
    } else if (wasEmpty && !isEmpty && viewMode !== 'grid') {
      preSearchViewMode = viewMode;
      viewMode = 'grid';
    }
  }

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
      requestArt(next.id, next.artist, next.album, url => { selectedArt = url; }, next.imageUrl);
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
    if (selectedRecord) return;
    if (e.key === 'Enter' && searchWordCount >= 3 && !discoverActive) { runDiscover(); return; }
    if (e.key === 'Escape') {
      if (discoverActive) { clearDiscover(); return; }
      search = ''; activeGenre = 'All'; showSuggestions = false; stackResetKey += 1;
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="shell">
  <header>
    <div class="wordmark">
      <span class="dot">◉</span>
      <span class="name">Record Shelf</span>
    </div>
    <div class="search-wrap" class:search-wrap-vibe={showRecordHint || discovering || discoverActive}>
      <input
        class="search"
        class:search-vibe={showRecordHint || discovering || discoverActive}
        type="text"
        placeholder={discoverActive ? `"${search}"` : 'Search artist, album, year…'}
        bind:value={search}
        spellcheck="false"
        autocomplete="off"
        readonly={discoverActive}
        on:focus={() => { if (!discoverActive) showSuggestions = true; }}
        on:blur={() => setTimeout(() => showSuggestions = false, 150)}
        on:keydown={e => {
          if (e.key === 'Enter' && searchWordCount >= 3 && !discoverActive && !discovering) {
            e.preventDefault();
            runDiscover();
          }
        }}
      />

      <!-- Spinning record: hint (slow) or loading (fast) -->
      {#if showRecordHint || discovering}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
          class="record-spin"
          class:record-spin-fast={discovering}
          on:click={discovering ? null : runDiscover}
          title="Press Enter to search"
        >
          <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="15" fill="#1a1a1a" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
            <circle cx="16" cy="16" r="11" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="4"/>
            <circle cx="16" cy="16" r="7"  fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="3"/>
            <circle cx="16" cy="16" r="1.5" fill="rgba(255,255,255,0.25)"/>
            <path d="M 16 5 A 11 11 0 0 1 25 21" stroke="rgba(255,255,255,0.18)" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          </svg>
        </div>
      {/if}

      <!-- Clear: normal search or discover -->
      {#if discoverActive}
        <button class="clear" on:click={clearDiscover} aria-label="Clear discover">✕</button>
      {:else if search}
        <button class="clear" on:click={() => { search = ''; discoverReasons = {}; }} aria-label="Clear search">✕</button>
      {/if}

      {#if showSuggestions && suggestions.length > 0 && !discoverActive}
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
      <button class="vbtn random-btn" on:click={pickRandom} title="Play a random record" disabled={loading}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="16 3 21 3 21 8"/>
          <line x1="4" y1="20" x2="21" y2="3"/>
          <polyline points="21 16 21 21 16 21"/>
          <line x1="15" y1="15" x2="21" y2="21"/>
          <line x1="4" y1="4" x2="9" y2="9"/>
        </svg>
      </button>
      <div class="view-controls">
        <!-- Browse picker: shelf / crate / grid -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class="view-picker-wrap">
          <button
            class="vbtn view-picker-btn"
            class:active={viewMode !== 'graph'}
            on:click={() => showViewPicker = !showViewPicker}
            title="Browse view"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="1" width="14" height="5" rx="1"/>
              <rect x="1" y="10" width="14" height="5" rx="1" opacity="0.5"/>
              <rect x="1" y="7" width="14" height="1.5" rx="0.75" opacity="0.2"/>
            </svg>
            <span class="picker-label">{viewMode !== 'graph' ? views.find(v => v.id === viewMode)?.label : 'Browse'}</span>
          </button>

          {#if showViewPicker}
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div class="view-dropdown" on:mouseleave={() => showViewPicker = false}>
              {#each views as v}
                <button
                  class="view-option"
                  class:active={viewMode === v.id}
                  on:click={() => pickView(v.id)}
                >{v.label}</button>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Graph — standalone -->
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

  <div class="content">
    {#if loading}
      <div class="loading-grid">
        {#each Array(12) as _}
          <div class="skeleton"></div>
        {/each}
      </div>
    {:else if viewMode === 'shelf'}
      <ShelfView
        records={filteredRecords}
        reasons={discoverReasons}
        on:open={e => openDetail(e.detail.record, e.detail.artUrl)}
      />
    {:else if viewMode === 'crate'}
      <CrateView
        records={filteredRecords}
        reasons={discoverReasons}
        resetKey={stackResetKey}
        on:open={e => openDetail(e.detail.record, e.detail.artUrl)}
      />
    {:else if viewMode === 'graph'}
      <GraphView
        records={filteredRecords}
        on:filter={e => { search = e.detail.artist; viewMode = 'shelf'; }}
        on:open={e => openDetail(e.detail.record, e.detail.artUrl)}
      />
    {:else}
      <div class="grid">
        {#each filteredRecords as record (record.id)}
          <AlbumCard
            {record}
            visible={true}
            reason={discoverReasons[record.id] ?? null}
            on:open={e => openDetail(e.detail.record, e.detail.artUrl)}
          />
        {/each}
      </div>
    {/if}
  </div>
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
    height: 100dvh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .content {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  /* Scrollable views */
  .content:has(.grid),
  .content:has(.shelves) {
    overflow-y: auto;
    padding-bottom: 3rem;
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

  .search-vibe {
    border-color: rgba(180,160,255,0.3);
    background: rgba(180,160,255,0.05);
    padding-right: 52px;
  }
  .search-vibe:focus {
    border-color: rgba(180,160,255,0.45);
    background: rgba(180,160,255,0.08);
    box-shadow: 0 0 0 3px rgba(180,160,255,0.07);
  }

  .record-spin {
    position: absolute;
    right: 34px;
    width: 24px; height: 24px;
    cursor: pointer;
    animation: spin 3s linear infinite;
    opacity: 0.7;
    transition: opacity 0.2s;
  }
  .record-spin:hover { opacity: 1; }
  .record-spin-fast { animation-duration: 0.55s; opacity: 0.9; cursor: default; }
  .record-spin svg { width: 100%; height: 100%; display: block; }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
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

  .view-controls {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .view-picker-wrap {
    position: relative;
  }

  .view-picker-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 10px;
    width: auto;
  }

  .picker-label {
    font-size: 11px;
    letter-spacing: 0.04em;
  }

  .view-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    background: #161616;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 4px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    z-index: 100;
    min-width: 110px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.6);
  }

  .view-option {
    background: none;
    border: none;
    color: rgba(255,255,255,0.45);
    font-size: 12px;
    padding: 7px 12px;
    border-radius: 7px;
    text-align: left;
    cursor: pointer;
    transition: all 0.12s;
    letter-spacing: 0.02em;
  }
  .view-option:hover { background: rgba(255,255,255,0.07); color: #fff; }
  .view-option.active { color: #fff; background: rgba(255,255,255,0.1); }

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

  .random-btn {
    width: 30px;
    height: 30px;
  }
  .random-btn:disabled { opacity: 0.2; cursor: default; }

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
