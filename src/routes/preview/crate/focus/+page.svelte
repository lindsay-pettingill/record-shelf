<script>
  import { fly, fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  const recs = [
    { color: '#c8845a', colorB: '#8b3a1a', name: 'Townes Van Zandt',  album: 'Our Mother the Mountain', year: '1969', genre: 'Folk' },
    { color: '#6b8cba', colorB: '#1a3860', name: 'R.E.M.',            album: 'Murmur',                  year: '1983', genre: 'Alt Rock' },
    { color: '#9b7fd4', colorB: '#3d1a7a', name: 'Keith Jarrett',     album: 'The Köln Concert',        year: '1975', genre: 'Jazz' },
    { color: '#d4738c', colorB: '#7a1a35', name: 'Maggie Rogers',     album: 'Heard It in a Past Life', year: '2019', genre: 'Indie Pop' },
    { color: '#6bb8a8', colorB: '#1a5a4a', name: 'Stevie Wonder',     album: 'Talking Book',            year: '1972', genre: 'Soul' },
    { color: '#e8a87c', colorB: '#7a3a10', name: 'Waxahatchee',       album: 'Saint Cloud',             year: '2020', genre: 'Indie Folk' },
    { color: '#7ba3cc', colorB: '#1a3a6a', name: 'Neil Young',        album: 'Harvest',                 year: '1972', genre: 'Folk Rock' },
    { color: '#b09fdf', colorB: '#3d2a7a', name: 'Miles Davis',       album: 'Kind of Blue',            year: '1959', genre: 'Jazz' },
  ];
  const N = recs.length;
  function mod(n, m) { return ((n % m) + m) % m; }

  let ci = [0, 0];
  let dr = [1, 1];
  let th = [false, false];

  function go(d, i) {
    if (th[i]) return;
    const next = ci[i] + d;
    if (next < 0 || next >= N) return;
    th[i] = true;
    dr[i] = d;
    ci[i] = next;
    ci = [...ci]; dr = [...dr];
    setTimeout(() => { th[i] = false; th = [...th]; }, 260);
  }

  function wheel(i) {
    return (e) => {
      e.preventDefault();
      if (e.deltaY > 8) go(1, i);
      else if (e.deltaY < -8) go(-1, i);
    };
  }

  $: peek = ci.map(idx => [1,2,3,4].map(n => recs[mod(idx+n, N)]));
</script>

<div class="page">
  <div class="topbar">
    <a href="/preview/crate" class="back">← back</a>
    <span class="title">Scroll inside each to flip · click to open</span>
  </div>

  <div class="split">

    <!-- ══ AMBIENT ══════════════════════════════════════════════════════ -->
    <div class="panel">
      <p class="panel-label">Ambient background</p>

      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div class="demo" on:wheel={wheel(0)}>

        <!-- Ambient color wash — slow crossfade -->
        {#key ci[0]}
          <div class="ambient"
            style="background: radial-gradient(ellipse at 50% 60%, {recs[ci[0]].color} 0%, {recs[ci[0]].colorB} 55%, #060606 100%);"
            in:fade={{ duration: 800 }}
            out:fade={{ duration: 600 }}
          ></div>
        {/key}

        <div class="stage">
          <!-- Peeks -->
          {#each [...peek[0]].reverse() as r, i}
            {@const pi = peek[0].length - 1 - i}
            <div class="peek" style="
              bottom: calc(100% - {(pi+1)*20}px);
              background: {r.color};
              opacity: {0.55 - pi*0.1};
              filter: brightness({0.5 + pi*0.1});
              z-index: {pi+1};
            "></div>
          {/each}

          <!-- Card -->
          {#key ci[0]}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div class="card"
              style="background: {recs[ci[0]].color};"
              in:fly={{ y: dr[0]*-110, duration: 260, easing: cubicOut }}
              out:fly={{ y: dr[0]*110, duration: 220, easing: cubicOut }}
            >
              <div class="card-initial">{recs[ci[0]].name[0]}</div>
            </div>
          {/key}
        </div>

        <!-- Glass side panel -->
        <div class="info-panel info-glass">
          {#key ci[0]}
            <div class="info-body" in:fade={{ duration: 120 }}>
              <p class="counter">{ci[0]+1} / {N}</p>
              <p class="album">{recs[ci[0]].album}</p>
              <p class="artist">{recs[ci[0]].name}</p>
              <p class="meta">{recs[ci[0]].year} · {recs[ci[0]].genre}</p>
            </div>
          {/key}
          <div class="nav">
            <button on:click={() => go(-1, 0)} disabled={ci[0]===0}>↑</button>
            <button on:click={() => go(1,  0)} disabled={ci[0]===N-1}>↓</button>
          </div>
          <p class="hint">scroll or arrows</p>
        </div>

      </div>

      <div class="notes">
        <p>The album's color palette floods the background with a slow crossfade on each flip. Panel uses glass blur so it doesn't fight the color wash.</p>
      </div>
    </div>

    <!-- ══ FULL-SCREEN OVERLAY ════════════════════════════════════════ -->
    <div class="panel">
      <p class="panel-label">Full-screen + text overlay</p>

      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div class="demo" on:wheel={wheel(1)}>

        <div class="stage stage-fill">
          <!-- Taller peeks -->
          {#each [...peek[1]].reverse() as r, i}
            {@const pi = peek[1].length - 1 - i}
            <div class="peek peek-tall" style="
              bottom: calc(100% - {(pi+1)*28}px);
              background: {r.color};
              opacity: {0.6 - pi*0.1};
              filter: brightness({0.5 + pi*0.1});
              z-index: {pi+1};
              box-shadow: 0 -6px 18px rgba(0,0,0,0.5);
            "></div>
          {/each}

          <!-- Full-bleed card -->
          {#key ci[1]}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div class="card card-fill"
              style="background: {recs[ci[1]].color};"
              in:fly={{ y: dr[1]*-110, duration: 260, easing: cubicOut }}
              out:fly={{ y: dr[1]*110, duration: 220, easing: cubicOut }}
            >
              <div class="card-initial card-initial-lg">{recs[ci[1]].name[0]}</div>
              <!-- Deep gradient so text reads clearly -->
              <div class="card-scrim"></div>
              <!-- Text overlay -->
              <div class="card-overlay">
                {#key ci[1]}
                  <div in:fade={{ duration: 180, delay: 80 }}>
                    <p class="ov-album">{recs[ci[1]].album}</p>
                    <p class="ov-artist">{recs[ci[1]].name}</p>
                    <p class="ov-meta">{recs[ci[1]].year} · {recs[ci[1]].genre}</p>
                  </div>
                {/key}
              </div>
            </div>
          {/key}
        </div>

        <!-- Minimal corner nav -->
        <div class="corner-nav">
          <button on:click={() => go(-1, 1)} disabled={ci[1]===0}>↑</button>
          <span class="corner-counter">{ci[1]+1}/{N}</span>
          <button on:click={() => go(1,  1)} disabled={ci[1]===N-1}>↓</button>
        </div>

      </div>

      <div class="notes">
        <p>No panel — the record fills the entire frame. Album title, artist, and year fade in over a gradient scrim at the bottom. Nav tucks into the corner.</p>
      </div>
    </div>

  </div>
</div>

<style>
  :global(body) { background: #060606; margin: 0; }

  .page {
    height: 100dvh;
    display: flex;
    flex-direction: column;
    font-family: system-ui, sans-serif;
    color: #fff;
    overflow: hidden;
  }

  /* ── Top bar ── */
  .topbar {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 1rem 2rem;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    flex-shrink: 0;
  }
  .back {
    font-size: 11px; color: rgba(255,255,255,0.3);
    text-decoration: none; letter-spacing: 0.06em;
    transition: color 0.15s;
  }
  .back:hover { color: rgba(255,255,255,0.7); }
  .title {
    font-size: 11px; color: rgba(255,255,255,0.18);
    letter-spacing: 0.04em;
  }

  /* ── Split ── */
  .split {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    background: rgba(255,255,255,0.06);
    min-height: 0;
  }

  .panel {
    background: #060606;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .panel-label {
    font-size: 10px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.12em;
    color: rgba(255,255,255,0.25);
    margin: 0;
    padding: 0.85rem 1.5rem;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    flex-shrink: 0;
  }

  .notes {
    padding: 0.85rem 1.5rem;
    border-top: 1px solid rgba(255,255,255,0.05);
    flex-shrink: 0;
  }
  .notes p {
    font-size: 11px; color: rgba(255,255,255,0.22);
    line-height: 1.6; margin: 0; letter-spacing: 0.02em;
  }

  /* ── Demo ── */
  .demo {
    flex: 1;
    position: relative;
    overflow: hidden;
    display: flex;
    cursor: default;
    user-select: none;
    min-height: 0;
  }

  /* ── Ambient ── */
  .ambient {
    position: absolute;
    inset: -60px;
    filter: blur(60px) saturate(180%);
    opacity: 0.35;
    pointer-events: none;
    z-index: 0;
  }

  /* ── Stage ── */
  .stage {
    position: relative;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
  }
  .stage-fill {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* ── Peeks ── */
  .peek {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 280px;
    height: 28px;
    border-radius: 6px 6px 0 0;
    pointer-events: none;
  }
  .peek-tall { width: 100%; left: 0; transform: none; height: 36px; border-radius: 0; }

  /* ── Cards ── */
  .card {
    position: absolute;
    width: 280px;
    height: 280px;
    border-radius: 10px;
    overflow: hidden;
    z-index: 10;
    box-shadow:
      0 50px 100px rgba(0,0,0,0.9),
      0 0 0 1px rgba(255,255,255,0.07);
    cursor: zoom-in;
  }

  .card-fill {
    left: 0; right: 0; top: 36px; bottom: 0;
    width: auto; height: auto;
    border-radius: 0;
    box-shadow: 0 -20px 60px rgba(0,0,0,0.5);
  }

  .card-initial {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -55%);
    font-size: 5.5rem; font-weight: 800;
    color: rgba(255,255,255,0.15);
    pointer-events: none;
  }
  .card-initial-lg { font-size: 9rem; }

  /* ── Overlay elements ── */
  .card-scrim {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.1) 45%, transparent 65%);
    pointer-events: none;
  }

  .card-overlay {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    padding: 28px 24px 22px;
    z-index: 2;
  }

  .ov-album  { font-size: 18px; font-weight: 700; color: #fff; margin: 0 0 5px; line-height: 1.2; letter-spacing: -0.02em; }
  .ov-artist { font-size: 13px; color: rgba(255,255,255,0.55); margin: 0 0 5px; }
  .ov-meta   { font-size: 10px; color: rgba(255,255,255,0.28); margin: 0; text-transform: uppercase; letter-spacing: 0.08em; }

  /* ── Glass info panel ── */
  .info-panel {
    width: 160px;
    flex-shrink: 0;
    border-left: 1px solid rgba(255,255,255,0.07);
    padding: 1.25rem 1rem;
    display: flex;
    flex-direction: column;
    z-index: 1;
  }
  .info-glass {
    background: rgba(0,0,0,0.3);
    backdrop-filter: blur(16px);
  }

  .info-body { flex: 1; overflow: hidden; }

  .counter { font-size: 9px; color: rgba(255,255,255,0.2); letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 1rem; }
  .album   { font-size: 12px; font-weight: 700; color: #fff; margin: 0 0 4px; line-height: 1.3; }
  .artist  { font-size: 11px; color: rgba(255,255,255,0.45); margin: 0 0 4px; }
  .meta    { font-size: 10px; color: rgba(255,255,255,0.22); margin: 0; }
  .hint    { font-size: 9px; color: rgba(255,255,255,0.1); text-transform: uppercase; letter-spacing: 0.06em; margin: 0.5rem 0 0; flex-shrink: 0; }

  .nav {
    display: flex; gap: 6px; margin-top: auto; flex-shrink: 0;
  }
  .nav button {
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.45);
    width: 30px; height: 30px; border-radius: 50%;
    font-size: 12px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }
  .nav button:hover:not(:disabled) { background: rgba(255,255,255,0.15); color: #fff; }
  .nav button:disabled { opacity: 0.2; cursor: default; }

  /* ── Corner nav (full-screen variant) ── */
  .corner-nav {
    position: absolute;
    bottom: 20px; right: 18px;
    display: flex; flex-direction: column;
    align-items: center; gap: 6px;
    z-index: 20;
  }
  .corner-counter {
    font-size: 9px; color: rgba(255,255,255,0.3);
    letter-spacing: 0.06em;
  }
  .corner-nav button {
    background: rgba(0,0,0,0.4);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.15);
    color: rgba(255,255,255,0.55);
    width: 30px; height: 30px; border-radius: 50%;
    font-size: 12px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }
  .corner-nav button:hover:not(:disabled) { background: rgba(0,0,0,0.7); color: #fff; }
  .corner-nav button:disabled { opacity: 0.2; cursor: default; }

  @media (max-width: 700px) {
    .split { grid-template-columns: 1fr; grid-template-rows: 1fr 1fr; }
  }
</style>
