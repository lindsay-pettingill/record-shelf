<script>
  const DEMO = [
    { id:1,  artist:'Keith Jarrett',    album:'The Köln Concert',        genre:'Jazz',           color:'#c9a03a' },
    { id:2,  artist:'Stevie Wonder',    album:'Talking Book',            genre:'Soul/R&B',       color:'#d4522a' },
    { id:3,  artist:'R.E.M.',           album:'Murmur',                  genre:'Rock',           color:'#4a7fa5' },
    { id:4,  artist:'Waxahatchee',      album:'Saint Cloud',             genre:'Folk/Americana', color:'#7a9e5f' },
    { id:5,  artist:'Talking Heads',    album:'Stop Making Sense',       genre:'Rock',           color:'#c4663a' },
    { id:6,  artist:'Neil Young',       album:'Harvest',                 genre:'Folk/Americana', color:'#b8923a' },
    { id:7,  artist:'Maggie Rogers',    album:'Heard It in a Past Life', genre:'Pop',            color:'#8a62b0' },
    { id:8,  artist:'Fleetwood Mac',    album:'Greatest Hits',           genre:'Rock',           color:'#6a8ccc' },
    { id:9,  artist:'10,000 Maniacs',   album:'In My Tribe',             genre:'Folk/Americana', color:'#5a9e7a' },
    { id:10, artist:'David Bowie',      album:'Hunky Dory',              genre:'Rock',           color:'#c45070' },
    { id:11, artist:'Harry Nilsson',    album:'Duit On Mon Dei',         genre:'Pop',            color:'#e09040' },
    { id:12, artist:'James Taylor',     album:'Greatest Hits',           genre:'Folk/Americana', color:'#7ab070' },
  ];

  const GENRE_COLORS = {
    'Jazz':           '#c9a03a',
    'Rock':           '#c45070',
    'Soul/R&B':       '#d4522a',
    'Folk/Americana': '#7a9e5f',
    'Pop':            '#8a62b0',
  };

  const ALL_GENRES = [...new Set(DEMO.map(r => r.genre))];
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // ── Option B: Scatter & reform ──
  let filterB = null;
  let scatterB = false;
  let showB = true;
  async function setFilterB(g) {
    const next = filterB === g ? null : g;
    scatterB = true;
    showB = false;
    await sleep(320);
    filterB = next;
    showB = true;
    await sleep(30);
    scatterB = false;
  }

  // ── Option A+D combo ──
  let filterAD = null;
  $: washColor = filterAD ? (GENRE_COLORS[filterAD] ?? '#888') : null;
  $: visAD = r => !filterAD || r.genre === filterAD;
</script>

<div class="page">
  <a href="/" class="back">← back to shelf</a>
  <h1 class="heading">Comparing B vs A+D</h1>
  <p class="sub">Click genre chips to see each effect. Click again to clear.</p>

  <div class="two-col">

    <!-- ── B: Scatter & reform ── -->
    <div class="panel">
      <div class="panel-label">B — Scatter &amp; reform</div>
      <p class="panel-desc">
        All records scatter off-screen on selection, then only matching ones fly back in and snap into place. Dramatic, tactile — like tossing a crate and grabbing what you want.
      </p>
      <div class="chips">
        {#each ALL_GENRES as g}
          <button class="chip" class:active={filterB===g} on:click={() => setFilterB(g)}>{g}</button>
        {/each}
      </div>
      <div class="mini-grid">
        {#each DEMO as r, idx}
          {@const visible = !filterB || r.genre === filterB}
          <div
            class="mini-card"
            class:scatter-out={scatterB}
            class:reform-in={!scatterB && showB && visible}
            class:reform-hide={!scatterB && showB && !visible}
            style="background:{r.color}; --sx:{(idx % 6 - 2.5) * 1}; --sy:{(Math.floor(idx/6) - 0.5) * 1}"
          >
            <span class="mini-label">{r.artist.split(',')[0].split(' ').pop()}</span>
          </div>
        {/each}
      </div>
    </div>

    <!-- ── A+D combo ── -->
    <div class="panel combo-panel" class:washed={!!filterAD} style="--wash:{washColor ?? 'transparent'}">
      <div class="panel-label">A+D — Fade, reflow &amp; color wash</div>
      <p class="panel-desc">
        Non-matching records silently fade and shrink in place while a genre-specific color floods the background. Matching records glow against the wash. Atmospheric, immersive — the room changes color.
      </p>
      <div class="chips">
        {#each ALL_GENRES as g}
          <button
            class="chip"
            class:active={filterAD===g}
            style={filterAD===g ? `border-color:${GENRE_COLORS[g]}88; color:${GENRE_COLORS[g]}` : ''}
            on:click={() => filterAD = filterAD===g ? null : g}
          >{g}</button>
        {/each}
      </div>
      <div class="mini-grid">
        {#each DEMO as r}
          {@const active = visAD(r)}
          <div
            class="mini-card"
            class:fade-hide={!active}
            class:wash-glow={!!filterAD && active}
            style="background:{r.color}; {!active && filterAD ? 'filter:grayscale(100%) brightness(0.3)' : ''}"
          >
            <span class="mini-label">{r.artist.split(',')[0].split(' ').pop()}</span>
          </div>
        {/each}
      </div>
    </div>

  </div>
</div>

<style>
  .page {
    min-height: 100vh;
    padding: 2rem 2.5rem 4rem;
    max-width: 1100px;
    margin: 0 auto;
  }

  .back {
    font-size: 12px; color:rgba(255,255,255,0.3);
    text-decoration:none; letter-spacing:0.04em;
    display:inline-block; margin-bottom:1.5rem;
    transition:color 0.15s;
  }
  .back:hover { color:rgba(255,255,255,0.7); }

  .heading { font-size:1.6rem; font-weight:700; color:#fff; letter-spacing:-0.02em; margin-bottom:0.4rem; }
  .sub     { font-size:13px; color:rgba(255,255,255,0.35); margin-bottom:2.5rem; }

  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    align-items: start;
  }

  /* Panel */
  .panel {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px;
    padding: 1.75rem;
    overflow: hidden;
    transition: background 0.7s ease;
  }
  .combo-panel.washed {
    background: color-mix(in srgb, var(--wash) 20%, #0a0a0a);
    border-color: color-mix(in srgb, var(--wash) 30%, transparent);
  }

  .panel-label {
    font-size: 11px; font-weight:600;
    text-transform:uppercase; letter-spacing:0.1em;
    color:rgba(255,255,255,0.5); margin-bottom:0.5rem;
  }
  .panel-desc {
    font-size: 12px; color:rgba(255,255,255,0.32);
    margin-bottom: 1.1rem; line-height:1.6;
    min-height: 60px;
  }

  /* Chips */
  .chips { display:flex; gap:5px; flex-wrap:wrap; margin-bottom:1.1rem; }
  .chip {
    padding:4px 12px; border-radius:100px; font-size:11px;
    border:1px solid rgba(255,255,255,0.12);
    color:rgba(255,255,255,0.4); background:transparent;
    cursor:pointer; font-family:inherit;
    transition:all 0.15s;
  }
  .chip:hover  { border-color:rgba(255,255,255,0.3); color:rgba(255,255,255,0.8); }
  .chip.active { border-color:rgba(255,255,255,0.45); color:#fff; background:rgba(255,255,255,0.08); }

  /* Grid */
  .mini-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 6px;
  }

  .mini-card {
    aspect-ratio: 1;
    border-radius: 5px;
    display: flex;
    align-items: flex-end;
    padding: 3px 4px;
    transition: all 0.38s cubic-bezier(0.2, 0, 0, 1);
    overflow: hidden;
  }
  .mini-label {
    font-size: 7px; color:rgba(255,255,255,0.75);
    font-weight:600; white-space:nowrap;
    overflow:hidden; text-overflow:ellipsis; max-width:100%;
  }

  /* ── B: Scatter ── */
  .scatter-out {
    transform: translate(calc(var(--sx) * 160px), calc(var(--sy) * 160px)) scale(0.3) rotate(calc(var(--sx) * 15deg));
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 1, 1);
  }
  .reform-in {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
  .reform-hide {
    transform: scale(0.75);
    opacity: 0;
  }

  /* ── A+D: Fade + wash ── */
  .mini-card.fade-hide {
    opacity: 0.07;
    transform: scale(0.88);
  }
  .mini-card.wash-glow {
    transform: scale(1.06);
    box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  }
</style>
