<script>
  import { fade, fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  const mockResults = [
    { artist: 'The National',   album: 'Boxer',                year: '2007', genre: 'Indie Rock',  reason: 'Dense, literary lyrics with a melancholic undercurrent' },
    { artist: 'LCD Soundsystem', album: 'Sound of Silver',     year: '2007', genre: 'Dance-Punk',  reason: 'Ironic emotional grandeur, similar downtown NYC sensibility' },
    { artist: 'Joanna Newsom',  album: 'Ys',                   year: '2006', genre: 'Folk',        reason: 'Maximalist arrangements, baroque song structures' },
    { artist: 'Sunset Rubdown', album: 'Random Spirit Lover',  year: '2007', genre: 'Indie Rock',  reason: 'Spencer Krug — Wolf Parade labelmate, same art-rock DNA' },
    { artist: 'Destroyer',      album: 'Kaputt',               year: '2011', genre: 'Indie Pop',   reason: 'Direct match — this is in your collection' },
  ];

  let query = '';
  let mode = 'idle'; // idle | hint | loading | results

  // Show spinning record hint when query looks natural-language (3+ words)
  $: wordCount = query.trim().split(/\s+/).filter(Boolean).length;
  $: if (mode !== 'loading' && mode !== 'results') {
    mode = wordCount >= 3 ? 'hint' : 'idle';
  }

  function handleKey(e) {
    if (e.key === 'Enter' && query.trim()) {
      if (wordCount >= 3) submit();
    }
    if (e.key === 'Escape') reset();
  }

  function submit() {
    mode = 'loading';
    setTimeout(() => { mode = 'results'; }, 1900);
  }

  function reset() {
    query = '';
    mode = 'idle';
  }

  // Demo helper — type a query automatically
  let typed = '';
  const example = 'find me something like Destroyer';
  function typeExample() {
    reset();
    let i = 0;
    const iv = setInterval(() => {
      query = example.slice(0, i + 1);
      i++;
      if (i >= example.length) clearInterval(iv);
    }, 42);
  }
</script>

<div class="page">
  <a href="/preview/discover" class="back">← back</a>

  <div class="demo-area">

    <!-- ── Mock header ── -->
    <div class="mock-header">
      <div class="wordmark"><span class="dot">◉</span> Record Shelf</div>

      <!-- Single unified search bar -->
      <div class="search-wrap">
        <input
          class="search"
          class:search-vibe={mode === 'hint' || mode === 'loading'}
          type="text"
          bind:value={query}
          on:keydown={handleKey}
          placeholder="Search artist, album, year…"
          disabled={mode === 'loading'}
          spellcheck="false"
        />

        <!-- Clear button -->
        {#if query && mode !== 'loading'}
          <button class="clear-btn" on:click={reset} transition:fade={{ duration: 100 }}>✕</button>
        {/if}

        <!-- Spinning record — idle hint (slow spin) -->
        {#if mode === 'hint'}
          <button
            class="record-btn record-hint"
            on:click={submit}
            title="Press Enter to search with Claude"
            transition:fade={{ duration: 150 }}
          >
            <svg class="record-svg spin-slow" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="15" fill="#1a1a1a" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
              <circle cx="16" cy="16" r="11" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="4"/>
              <circle cx="16" cy="16" r="7"  fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="3"/>
              <circle cx="16" cy="16" r="3"  fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1.5"/>
              <circle cx="16" cy="16" r="1.5" fill="rgba(255,255,255,0.3)"/>
              <!-- Groove highlight -->
              <path d="M 16 5 A 11 11 0 0 1 25 21" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" fill="none" stroke-linecap="round"/>
            </svg>
          </button>
        {/if}

        <!-- Spinning record — loading (fast spin) -->
        {#if mode === 'loading'}
          <div class="record-btn record-loading" transition:fade={{ duration: 150 }}>
            <svg class="record-svg spin-fast" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="15" fill="#1a1a1a" stroke="rgba(180,160,255,0.3)" stroke-width="1"/>
              <circle cx="16" cy="16" r="11" fill="none" stroke="rgba(180,160,255,0.08)" stroke-width="4"/>
              <circle cx="16" cy="16" r="7"  fill="none" stroke="rgba(180,160,255,0.06)" stroke-width="3"/>
              <circle cx="16" cy="16" r="3"  fill="none" stroke="rgba(180,160,255,0.1)"  stroke-width="1.5"/>
              <circle cx="16" cy="16" r="1.5" fill="rgba(180,160,255,0.6)"/>
              <path d="M 16 5 A 11 11 0 0 1 25 21" stroke="rgba(180,160,255,0.35)" stroke-width="1.5" fill="none" stroke-linecap="round"/>
            </svg>
          </div>
        {/if}

      </div>

      <div class="right">
        <span class="muted">49 records</span>
      </div>
    </div>

    <!-- ── Hint label ── -->
    {#if mode === 'hint'}
      <p class="enter-hint" in:fade={{ duration: 120 }} out:fade={{ duration: 80 }}>
        Hit ↵ to search across your collection
      </p>
    {:else if mode === 'loading'}
      <p class="enter-hint loading-msg" in:fade={{ duration: 120 }}>
        Searching your collection…
      </p>
    {/if}

    <!-- ── Results ── -->
    {#if mode === 'results'}
      <div class="results-area" in:fly={{ y: 10, duration: 260, easing: cubicOut }}>
        <div class="results-header">
          <span class="results-label">"{query}"</span>
          <span class="results-count">{mockResults.length} matches</span>
          <button class="results-clear" on:click={reset}>Clear</button>
        </div>
        <div class="results-list">
          {#each mockResults as r, i}
            <div class="result-card" in:fly={{ y: 12, duration: 200, delay: i * 45, easing: cubicOut }}>
              <div class="result-cover">
                <span>{r.artist[0]}</span>
              </div>
              <div class="result-body">
                <p class="r-album">{r.album}</p>
                <p class="r-artist">{r.artist} · {r.year}</p>
                <p class="r-reason">
                  <svg class="r-record" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5.5" fill="#1a1a1a" stroke="rgba(180,160,255,0.4)" stroke-width="0.8"/><circle cx="6" cy="6" r="1" fill="rgba(180,160,255,0.6)"/></svg>
                  {r.reason}
                </p>
              </div>
            </div>
          {/each}
        </div>
      </div>

    {:else}
      <!-- Mock shelf -->
      <div class="mock-shelf" class:dimmed={mode === 'loading'}>
        {#each Array(32) as _, i}
          <div class="mock-spine" style="
            height: {195 + (i % 6) * 11}px;
            background: hsl({i * 22 % 360}, {mode === 'idle' ? 26 : 10}%, {18 + (i % 4)*4}%);
            opacity: {mode === 'loading' ? 0.2 : 1};
          "></div>
        {/each}
      </div>
    {/if}

  </div>

  <!-- Demo controls -->
  <div class="controls">
    <span class="ctrl-label">Try it</span>
    <button class="ctrl-btn" on:click={reset}>Reset</button>
    <button class="ctrl-btn" on:click={typeExample}>Type example</button>
    <button class="ctrl-btn" on:click={submit} disabled={wordCount < 3 || mode === 'loading' || mode === 'results'}>Submit</button>
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
    gap: 1rem;
    box-sizing: border-box;
  }

  .back {
    font-size: 11px; color: rgba(255,255,255,0.25);
    text-decoration: none; letter-spacing: 0.06em;
    align-self: flex-start; transition: color 0.15s;
  }
  .back:hover { color: rgba(255,255,255,0.6); }

  /* ── Header ── */
  .mock-header {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 1.5rem;
    padding: 1.1rem 1.5rem;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px;
  }

  .wordmark {
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; font-weight: 500;
    color: rgba(255,255,255,0.55);
    letter-spacing: 0.08em; text-transform: uppercase;
    white-space: nowrap;
  }
  .dot { color: rgba(255,255,255,0.22); }
  .muted { font-size: 12px; color: rgba(255,255,255,0.18); white-space: nowrap; }

  /* ── Search ── */
  .search-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search {
    width: 100%;
    padding: 10px 44px 10px 18px;
    font-size: 14px;
    font-family: inherit;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 100px;
    color: #e8e8e8;
    outline: none;
    transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
    box-sizing: border-box;
  }
  .search::placeholder { color: rgba(255,255,255,0.2); }
  .search:focus {
    border-color: rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.08);
  }
  .search-vibe {
    border-color: rgba(180,160,255,0.35);
    background: rgba(180,160,255,0.05);
    padding-right: 52px;
  }
  .search-vibe:focus {
    border-color: rgba(180,160,255,0.5);
    background: rgba(180,160,255,0.08);
    box-shadow: 0 0 0 3px rgba(180,160,255,0.07);
  }

  .clear-btn {
    position: absolute;
    right: 44px;
    background: none; border: none;
    color: rgba(255,255,255,0.25);
    font-size: 10px; cursor: pointer;
    padding: 4px; line-height: 1;
    transition: color 0.15s;
  }
  .clear-btn:hover { color: rgba(255,255,255,0.6); }

  /* ── Record button ── */
  .record-btn {
    position: absolute;
    right: 8px;
    width: 28px; height: 28px;
    display: flex; align-items: center; justify-content: center;
    background: none; border: none; padding: 0; cursor: pointer;
  }
  .record-hint { cursor: pointer; }
  .record-loading { cursor: default; }

  .record-svg {
    width: 26px; height: 26px;
  }

  /* Spin animations */
  .spin-slow {
    animation: spin 3s linear infinite;
  }
  .spin-fast {
    animation: spin 0.6s linear infinite;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  /* ── Hint text ── */
  .enter-hint {
    font-size: 11px;
    color: rgba(255,255,255,0.2);
    letter-spacing: 0.04em;
    margin: 0 0 0 4px;
  }
  .loading-msg { color: rgba(180,160,255,0.45); }

  /* ── Mock shelf ── */
  .mock-shelf {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    padding: 2rem 1.5rem 0;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 14px;
    height: 300px;
    overflow: hidden;
    flex: 1;
    transition: opacity 0.4s;
  }
  .mock-spine {
    border-radius: 4px 4px 0 0;
    flex-shrink: 0;
    transition: background 0.4s, opacity 0.4s;
  }

  /* ── Results ── */
  .results-area {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px;
    padding: 1.25rem 1.5rem;
    flex: 1;
  }

  .results-header {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 1rem;
  }
  .results-label {
    font-size: 13px; font-style: italic;
    color: rgba(255,255,255,0.55); flex: 1;
  }
  .results-count {
    font-size: 10px; color: rgba(180,160,255,0.5);
    text-transform: uppercase; letter-spacing: 0.08em;
  }
  .results-clear {
    font-size: 11px; color: rgba(255,255,255,0.25);
    background: none; border: none; cursor: pointer;
    padding: 2px 8px; transition: color 0.15s;
    letter-spacing: 0.04em;
  }
  .results-clear:hover { color: rgba(255,255,255,0.6); }

  .results-list { display: flex; flex-direction: column; gap: 8px; }

  .result-card {
    display: flex; gap: 12px; align-items: center;
    padding: 10px 12px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.12s;
  }
  .result-card:hover { background: rgba(255,255,255,0.07); }

  .result-cover {
    width: 44px; height: 44px; border-radius: 5px;
    background: linear-gradient(135deg, #252530, #151520);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; font-size: 1.3rem; font-weight: 800;
    color: rgba(255,255,255,0.18);
  }

  .result-body { flex: 1; min-width: 0; }
  .r-album  { font-size: 12px; font-weight: 700; color: #fff; margin: 0 0 2px; }
  .r-artist { font-size: 10px; color: rgba(255,255,255,0.35); margin: 0 0 5px; }
  .r-reason {
    display: flex; align-items: center; gap: 5px;
    font-size: 11px; color: rgba(180,160,255,0.6);
    line-height: 1.4;
  }
  .r-record { width: 12px; height: 12px; flex-shrink: 0; }

  /* ── Controls ── */
  .controls {
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
    padding: 0.85rem 1.25rem;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
  }
  .ctrl-label {
    font-size: 10px; color: rgba(255,255,255,0.18);
    text-transform: uppercase; letter-spacing: 0.08em; margin-right: 4px;
  }
  .ctrl-btn {
    padding: 6px 14px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 100px;
    color: rgba(255,255,255,0.45);
    font-size: 11px; font-family: inherit;
    cursor: pointer; transition: all 0.15s;
  }
  .ctrl-btn:hover:not(:disabled) { background: rgba(255,255,255,0.1); color: #fff; }
  .ctrl-btn:disabled { opacity: 0.2; cursor: default; }
</style>
