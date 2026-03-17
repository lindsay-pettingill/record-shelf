<script>
  // Static UI mockup — no API calls
  import { fade, fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  const mockResults = [
    { artist: 'Destroyer',     album: 'Kaputt',               year: '2011', genre: 'Indie Pop',  reason: 'Direct match — you asked for this artist' },
    { artist: 'The National',  album: 'Boxer',                year: '2007', genre: 'Indie Rock',  reason: 'Dense, literary lyrics with a melancholic undercurrent' },
    { artist: 'LCD Soundsystem',album: 'Sound of Silver',     year: '2007', genre: 'Dance-Punk',  reason: 'Ironic emotional grandeur, similar downtown NYC sensibility' },
    { artist: 'Joanna Newsom', album: 'Ys',                   year: '2006', genre: 'Folk',        reason: 'Maximalist arrangements, baroque song structures' },
    { artist: 'Sunset Rubdown', album: 'Random Spirit Lover', year: '2007', genre: 'Indie Rock',  reason: 'Spencer Krug — Destroyer\'s Wolf Parade labelmate, same art-rock DNA' },
  ];

  // UI state machine
  let mode = 'normal'; // 'normal' | 'discover' | 'loading' | 'results'
  let query = '';
  let inputEl;

  function activateDiscover() {
    mode = 'discover';
    query = '';
    setTimeout(() => inputEl?.focus(), 50);
  }

  function exitDiscover() {
    mode = 'normal';
    query = '';
  }

  function submit() {
    if (!query.trim()) return;
    mode = 'loading';
    setTimeout(() => { mode = 'results'; }, 1800);
  }

  function handleKey(e) {
    if (e.key === 'Enter') submit();
    if (e.key === 'Escape') exitDiscover();
  }

  // Simulate typing the example query
  let typed = '';
  const example = 'find me something like Destroyer';
  function typeExample() {
    if (mode !== 'discover') { activateDiscover(); setTimeout(typeExample, 80); return; }
    typed = '';
    query = '';
    let i = 0;
    const interval = setInterval(() => {
      typed += example[i];
      query = typed;
      i++;
      if (i >= example.length) clearInterval(interval);
    }, 45);
  }
</script>

<div class="page">
  <a href="/preview" class="back">← back</a>

  <div class="demo-area">

    <!-- ── Mock header ── -->
    <div class="mock-header">
      <div class="wordmark"><span class="dot">◉</span> Record Shelf</div>

      <div class="search-zone">
        {#if mode === 'normal'}
          <!-- Normal search bar + discover button -->
          <div class="search-row" in:fade={{ duration: 150 }}>
            <div class="search-wrap">
              <input class="search" type="text" placeholder="Search artist, album, year…" disabled />
            </div>
            <button class="discover-btn" on:click={activateDiscover}>
              <span class="star">✦</span> Discover
            </button>
          </div>

        {:else if mode === 'discover' || mode === 'loading'}
          <!-- Discover mode search bar -->
          <div class="discover-row" in:fly={{ y: -8, duration: 200, easing: cubicOut }}>
            <span class="discover-icon">✦</span>
            <input
              class="search search-discover"
              bind:this={inputEl}
              bind:value={query}
              on:keydown={handleKey}
              placeholder="find me something like…"
              disabled={mode === 'loading'}
            />
            {#if mode === 'loading'}
              <div class="spinner"></div>
            {:else}
              <button class="send-btn" on:click={submit} disabled={!query.trim()}>→</button>
            {/if}
            <button class="exit-btn" on:click={exitDiscover}>✕</button>
          </div>
          {#if mode === 'loading'}
            <p class="loading-text" in:fade={{ duration: 200 }}>Looking through your collection…</p>
          {/if}

        {:else if mode === 'results'}
          <!-- Results bar: query + clear -->
          <div class="results-bar" in:fade={{ duration: 150 }}>
            <span class="star-sm">✦</span>
            <span class="results-query">"{query}"</span>
            <span class="results-count">{mockResults.length} matches</span>
            <button class="exit-btn" on:click={exitDiscover}>✕</button>
          </div>
        {/if}
      </div>

      <div class="right">
        <span class="muted">49 records</span>
      </div>
    </div>

    <!-- ── Results ── -->
    {#if mode === 'results'}
      <div class="results-area" in:fly={{ y: 12, duration: 280, easing: cubicOut }}>
        <p class="results-label">Matches for <em>{query}</em></p>
        <div class="results-grid">
          {#each mockResults as r, i}
            <div class="result-card" in:fly={{ y: 16, duration: 220, delay: i * 50, easing: cubicOut }}>
              <div class="result-cover">
                <span class="result-initial">{r.artist[0]}</span>
              </div>
              <div class="result-info">
                <p class="result-album">{r.album}</p>
                <p class="result-artist">{r.artist}</p>
                <p class="result-meta">{r.year} · {r.genre}</p>
                <div class="result-reason">
                  <span class="reason-star">✦</span>
                  {r.reason}
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>

    {:else if mode === 'normal'}
      <!-- Mock shelf (static, just for context) -->
      <div class="mock-shelf" in:fade={{ duration: 200 }}>
        {#each Array(28) as _, i}
          <div class="mock-spine" style="
            height: {200 + (i % 5) * 12}px;
            background: hsl({i * 23 % 360}, 28%, {18 + (i % 4) * 4}%);
            width: 34px;
          "></div>
        {/each}
      </div>
    {:else}
      <div class="mock-shelf dimmed">
        {#each Array(28) as _, i}
          <div class="mock-spine" style="
            height: {200 + (i % 5) * 12}px;
            background: hsl({i * 23 % 360}, 28%, {18 + (i % 4) * 4}%);
            width: 34px;
            opacity: 0.25;
          "></div>
        {/each}
      </div>
    {/if}

  </div>

  <!-- Controls to demo the states -->
  <div class="demo-controls">
    <p class="ctrl-label">Try it:</p>
    <button class="ctrl-btn" on:click={() => { exitDiscover(); }}>Normal state</button>
    <button class="ctrl-btn" on:click={activateDiscover}>Discover mode</button>
    <button class="ctrl-btn" on:click={typeExample}>Type example query</button>
    <button class="ctrl-btn" on:click={submit} disabled={mode !== 'discover' || !query.trim()}>Submit → show results</button>
  </div>
</div>

<style>
  :global(body) { background: #080808; margin: 0; }

  .page {
    min-height: 100vh;
    font-family: system-ui, sans-serif;
    color: #fff;
    display: flex;
    flex-direction: column;
    padding: 2rem;
    box-sizing: border-box;
    gap: 1.5rem;
  }

  .back {
    font-size: 11px; color: rgba(255,255,255,0.25);
    text-decoration: none; letter-spacing: 0.06em;
    transition: color 0.15s; align-self: flex-start;
  }
  .back:hover { color: rgba(255,255,255,0.6); }

  /* ── Mock header ── */
  .mock-header {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 1.5rem;
    padding: 1.25rem 1.5rem;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px;
  }

  .wordmark {
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; font-weight: 500;
    color: rgba(255,255,255,0.6);
    letter-spacing: 0.08em; text-transform: uppercase;
    white-space: nowrap;
  }
  .dot { color: rgba(255,255,255,0.25); }
  .right .muted { font-size: 12px; color: rgba(255,255,255,0.2); white-space: nowrap; }

  /* ── Search zone ── */
  .search-zone { position: relative; min-height: 42px; }

  .search-row {
    display: flex; align-items: center; gap: 8px;
  }

  .search-wrap { flex: 1; }

  .search {
    width: 100%;
    padding: 10px 18px;
    font-size: 14px;
    font-family: inherit;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 100px;
    color: #e8e8e8;
    outline: none;
    box-sizing: border-box;
  }
  .search::placeholder { color: rgba(255,255,255,0.22); }
  .search:focus {
    border-color: rgba(255,255,255,0.22);
    background: rgba(255,255,255,0.08);
  }

  /* ── Discover button ── */
  .discover-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 9px 16px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 100px;
    color: rgba(255,255,255,0.5);
    font-size: 12px;
    font-family: inherit;
    letter-spacing: 0.04em;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s;
    flex-shrink: 0;
  }
  .discover-btn:hover {
    background: rgba(255,255,255,0.1);
    border-color: rgba(255,255,255,0.25);
    color: #fff;
  }
  .star { color: rgba(180,160,255,0.8); font-size: 11px; }

  /* ── Discover mode row ── */
  .discover-row {
    display: flex; align-items: center; gap: 8px;
  }

  .discover-icon {
    color: rgba(180,160,255,0.9);
    font-size: 14px;
    flex-shrink: 0;
  }

  .search-discover {
    flex: 1;
    border-color: rgba(180,160,255,0.35);
    background: rgba(180,160,255,0.06);
  }
  .search-discover:focus {
    border-color: rgba(180,160,255,0.5);
    background: rgba(180,160,255,0.09);
    box-shadow: 0 0 0 3px rgba(180,160,255,0.08);
  }
  .search-discover::placeholder { color: rgba(255,255,255,0.2); }

  .send-btn {
    background: rgba(180,160,255,0.15);
    border: 1px solid rgba(180,160,255,0.3);
    color: rgba(180,160,255,0.9);
    width: 34px; height: 34px; border-radius: 50%;
    font-size: 14px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s; flex-shrink: 0;
  }
  .send-btn:hover:not(:disabled) {
    background: rgba(180,160,255,0.28);
    color: #fff;
  }
  .send-btn:disabled { opacity: 0.3; cursor: default; }

  .exit-btn {
    background: none; border: none;
    color: rgba(255,255,255,0.25);
    font-size: 11px; cursor: pointer;
    padding: 4px; transition: color 0.15s;
    flex-shrink: 0;
  }
  .exit-btn:hover { color: rgba(255,255,255,0.6); }

  .loading-text {
    font-size: 11px; color: rgba(180,160,255,0.5);
    letter-spacing: 0.04em; margin: 6px 0 0 24px;
  }

  /* Spinner */
  .spinner {
    width: 18px; height: 18px; border-radius: 50%;
    border: 2px solid rgba(180,160,255,0.15);
    border-top-color: rgba(180,160,255,0.7);
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Results bar ── */
  .results-bar {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 4px;
  }
  .star-sm { color: rgba(180,160,255,0.8); font-size: 12px; }
  .results-query {
    font-size: 13px; color: rgba(255,255,255,0.75);
    font-style: italic; flex: 1;
  }
  .results-count {
    font-size: 11px; color: rgba(180,160,255,0.6);
    letter-spacing: 0.04em;
  }

  /* ── Mock shelf ── */
  .mock-shelf {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    padding: 1.5rem 1.5rem 0;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 14px;
    height: 280px;
    overflow: hidden;
    transition: opacity 0.3s;
  }
  .mock-spine {
    border-radius: 4px 4px 0 0;
    flex-shrink: 0;
    transition: opacity 0.3s;
  }

  /* ── Results area ── */
  .results-area {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px;
    padding: 1.5rem;
  }

  .results-label {
    font-size: 11px; color: rgba(255,255,255,0.25);
    text-transform: uppercase; letter-spacing: 0.08em;
    margin: 0 0 1.25rem;
  }
  .results-label em { font-style: normal; color: rgba(255,255,255,0.5); }

  .results-grid {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .result-card {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    padding: 12px 14px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }
  .result-card:hover {
    background: rgba(255,255,255,0.07);
    border-color: rgba(255,255,255,0.13);
  }

  .result-cover {
    width: 48px; height: 48px;
    border-radius: 5px;
    background: linear-gradient(135deg, #2a2a3a, #1a1a2a);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .result-initial {
    font-size: 1.4rem; font-weight: 800;
    color: rgba(255,255,255,0.2);
  }

  .result-info { flex: 1; min-width: 0; }
  .result-album  { font-size: 13px; font-weight: 700; color: #fff; margin: 0 0 2px; }
  .result-artist { font-size: 11px; color: rgba(255,255,255,0.45); margin: 0 0 2px; }
  .result-meta   { font-size: 10px; color: rgba(255,255,255,0.22); margin: 0 0 7px; }

  .result-reason {
    display: flex; align-items: flex-start; gap: 6px;
    font-size: 11px; color: rgba(180,160,255,0.65);
    line-height: 1.4;
  }
  .reason-star { font-size: 9px; margin-top: 2px; flex-shrink: 0; color: rgba(180,160,255,0.5); }

  /* ── Demo controls ── */
  .demo-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    padding: 1rem 1.25rem;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
  }
  .ctrl-label {
    font-size: 10px; color: rgba(255,255,255,0.2);
    text-transform: uppercase; letter-spacing: 0.08em;
    margin: 0; margin-right: 4px;
  }
  .ctrl-btn {
    padding: 6px 14px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 100px;
    color: rgba(255,255,255,0.5);
    font-size: 11px; font-family: inherit;
    cursor: pointer; transition: all 0.15s;
    letter-spacing: 0.02em;
  }
  .ctrl-btn:hover:not(:disabled) {
    background: rgba(255,255,255,0.1);
    color: #fff;
  }
  .ctrl-btn:disabled { opacity: 0.25; cursor: default; }
</style>
