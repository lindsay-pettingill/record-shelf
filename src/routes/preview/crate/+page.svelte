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

  // Each demo has its own index + direction
  let ci = [0, 0, 0, 0];
  let dr = [1, 1, 1, 1];
  let th = [false, false, false, false];

  function go(demo, d) {
    if (th[demo]) return;
    const next = ci[demo] + d;
    if (next < 0 || next >= N) return;
    th[demo] = true;
    dr[demo] = d;
    ci[demo] = next;
    ci = [...ci]; dr = [...dr];
    setTimeout(() => { th[demo] = false; th = [...th]; }, 260);
  }

  function makeWheelHandler(demo) {
    return (e) => {
      e.preventDefault();
      if (e.deltaY > 8) go(demo, 1);
      else if (e.deltaY < -8) go(demo, -1);
    };
  }

  $: peek = ci.map(idx => [1,2,3,4].map(n => recs[mod(idx + n, N)]));
</script>

<div class="page">
  <div class="page-header">
    <a href="/preview" class="back">← back</a>
    <h1>Crate — immersion variants</h1>
    <p>Scroll inside each demo · pick a direction</p>
  </div>

  <div class="grid">

    <!-- ══ 1. CURRENT (baseline) ══════════════════════════════ -->
    <div class="concept">
      <div class="concept-label">Current</div>
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div class="demo demo-current" on:wheel={makeWheelHandler(0)}>
        <div class="stage">
          {#each [...peek[0]].reverse() as r, i}
            {@const pi = peek[0].length - 1 - i}
            <div class="peek-strip" style="
              bottom: calc(100% - {(pi+1)*18}px);
              background:{r.color};
              opacity:{0.5 - pi*0.1};
              filter:brightness({0.55 + pi*0.08});
              z-index:{pi+1};
            "></div>
          {/each}
          {#key ci[0]}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div class="card card-sm"
              style="background:{recs[ci[0]].color};"
              in:fly={{ y: dr[0]*-80, duration:240, easing:cubicOut }}
              out:fly={{ y: dr[0]*80, duration:200, easing:cubicOut }}
            >
              <div class="card-letter">{recs[ci[0]].name[0]}</div>
            </div>
          {/key}
        </div>
        <div class="side-panel">
          {#key ci[0]}
            <div in:fade={{duration:100}}>
              <p class="si-counter">{ci[0]+1} / {N}</p>
              <p class="si-album">{recs[ci[0]].album}</p>
              <p class="si-artist">{recs[ci[0]].name}</p>
              <p class="si-meta">{recs[ci[0]].year} · {recs[ci[0]].genre}</p>
            </div>
          {/key}
          <div class="nav-row">
            <button on:click={()=>go(0,-1)} disabled={ci[0]===0}>↑</button>
            <button on:click={()=>go(0,1)}  disabled={ci[0]===N-1}>↓</button>
          </div>
        </div>
      </div>
      <p class="desc">Card + info panel side by side.</p>
    </div>

    <!-- ══ 2. AMBIENT BG ══════════════════════════════════════ -->
    <div class="concept">
      <div class="concept-label">Ambient background</div>
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div class="demo demo-ambient" on:wheel={makeWheelHandler(1)}>
        <!-- Blurred ambient fill -->
        {#key ci[1]}
          <div class="ambient-fill"
            style="background:{recs[ci[1]].color};"
            in:fade={{duration:600}}
            out:fade={{duration:400}}
          ></div>
        {/key}

        <div class="stage stage-centered">
          {#each [...peek[1]].reverse() as r, i}
            {@const pi = peek[1].length - 1 - i}
            <div class="peek-strip" style="
              bottom: calc(100% - {(pi+1)*18}px);
              background:{r.color};
              opacity:{0.5 - pi*0.1};
              filter:brightness({0.55 + pi*0.08});
              z-index:{pi+1};
            "></div>
          {/each}
          {#key ci[1]}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div class="card card-sm"
              style="background:{recs[ci[1]].color};"
              in:fly={{ y: dr[1]*-80, duration:240, easing:cubicOut }}
              out:fly={{ y: dr[1]*80, duration:200, easing:cubicOut }}
            >
              <div class="card-letter">{recs[ci[1]].name[0]}</div>
            </div>
          {/key}
        </div>

        <div class="side-panel side-panel-glass">
          {#key ci[1]}
            <div in:fade={{duration:100}}>
              <p class="si-counter">{ci[1]+1} / {N}</p>
              <p class="si-album">{recs[ci[1]].album}</p>
              <p class="si-artist">{recs[ci[1]].name}</p>
              <p class="si-meta">{recs[ci[1]].year} · {recs[ci[1]].genre}</p>
            </div>
          {/key}
          <div class="nav-row">
            <button on:click={()=>go(1,-1)} disabled={ci[1]===0}>↑</button>
            <button on:click={()=>go(1,1)}  disabled={ci[1]===N-1}>↓</button>
          </div>
        </div>
      </div>
      <p class="desc">Album art color bleeds into the background. Changes with each flip.</p>
    </div>

    <!-- ══ 3. FULL-SCREEN OVERLAY ═════════════════════════════ -->
    <div class="concept">
      <div class="concept-label">Full-screen + text overlay</div>
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div class="demo demo-fullscreen" on:wheel={makeWheelHandler(2)}>
        <div class="stage stage-fill">
          {#each [...peek[2]].reverse() as r, i}
            {@const pi = peek[2].length - 1 - i}
            <div class="peek-strip peek-tall" style="
              bottom: calc(100% - {(pi+1)*24}px);
              background:{r.color};
              opacity:{0.55 - pi*0.1};
              filter:brightness({0.55 + pi*0.08});
              z-index:{pi+1};
            "></div>
          {/each}
          {#key ci[2]}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div class="card card-fill"
              style="background:{recs[ci[2]].color};"
              in:fly={{ y: dr[2]*-80, duration:240, easing:cubicOut }}
              out:fly={{ y: dr[2]*80, duration:200, easing:cubicOut }}
            >
              <div class="card-letter card-letter-lg">{recs[ci[2]].name[0]}</div>
              <div class="card-gradient-overlay"></div>
              <div class="card-text-overlay">
                <p class="ov-album">{recs[ci[2]].album}</p>
                <p class="ov-artist">{recs[ci[2]].name}</p>
                <p class="ov-meta">{recs[ci[2]].year} · {recs[ci[2]].genre}</p>
              </div>
            </div>
          {/key}
        </div>
        <div class="fs-nav">
          <button on:click={()=>go(2,-1)} disabled={ci[2]===0}>↑</button>
          <span class="fs-counter">{ci[2]+1}/{N}</span>
          <button on:click={()=>go(2,1)}  disabled={ci[2]===N-1}>↓</button>
        </div>
      </div>
      <p class="desc">No side panel. Record fills the frame, info overlaid at bottom.</p>
    </div>

    <!-- ══ 4. ALL COMBINED ════════════════════════════════════ -->
    <div class="concept">
      <div class="concept-label">All combined</div>
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div class="demo demo-all" on:wheel={makeWheelHandler(3)}>
        {#key ci[3]}
          <div class="ambient-fill ambient-rich"
            style="background:{recs[ci[3]].color};"
            in:fade={{duration:700}}
            out:fade={{duration:500}}
          ></div>
        {/key}

        <div class="stage stage-fill">
          {#each [...peek[3]].reverse() as r, i}
            {@const pi = peek[3].length - 1 - i}
            <div class="peek-strip peek-tall" style="
              bottom: calc(100% - {(pi+1)*26}px);
              background:{r.color};
              opacity:{0.6 - pi*0.1};
              filter:brightness({0.6 + pi*0.08});
              z-index:{pi+1};
              box-shadow: 0 -4px 12px rgba(0,0,0,0.4);
            "></div>
          {/each}
          {#key ci[3]}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div class="card card-fill"
              style="background:{recs[ci[3]].color};"
              in:fly={{ y: dr[3]*-80, duration:260, easing:cubicOut }}
              out:fly={{ y: dr[3]*80, duration:220, easing:cubicOut }}
            >
              <div class="card-letter card-letter-lg">{recs[ci[3]].name[0]}</div>
              <div class="card-gradient-overlay card-gradient-deep"></div>
              <div class="card-text-overlay">
                <p class="ov-album">{recs[ci[3]].album}</p>
                <p class="ov-artist">{recs[ci[3]].name}</p>
                <p class="ov-meta">{recs[ci[3]].year} · {recs[ci[3]].genre}</p>
              </div>
            </div>
          {/key}
        </div>
        <div class="fs-nav">
          <button on:click={()=>go(3,-1)} disabled={ci[3]===0}>↑</button>
          <span class="fs-counter">{ci[3]+1}/{N}</span>
          <button on:click={()=>go(3,1)}  disabled={ci[3]===N-1}>↓</button>
        </div>
      </div>
      <p class="desc">Ambient color + full-screen card + text overlay + taller peeks.</p>
    </div>

  </div>
</div>

<style>
  :global(body) { background: #080808; margin: 0; }

  .page {
    min-height: 100vh;
    padding: 3rem 3rem 5rem;
    font-family: system-ui, sans-serif;
    color: #fff;
    box-sizing: border-box;
  }

  .page-header { margin-bottom: 3rem; }

  .back {
    display: inline-block;
    font-size: 11px;
    color: rgba(255,255,255,0.25);
    text-decoration: none;
    letter-spacing: 0.06em;
    margin-bottom: 0.75rem;
  }
  .back:hover { color: rgba(255,255,255,0.6); }

  h1 {
    font-size: 1rem; font-weight: 600;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: rgba(255,255,255,0.45); margin: 0 0 0.3rem;
  }
  .page-header p { font-size: 11px; color: rgba(255,255,255,0.2); margin: 0; letter-spacing: 0.04em; }

  .grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 2rem;
  }

  .concept { display: flex; flex-direction: column; gap: 0.75rem; }

  .concept-label {
    font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.1em;
    color: rgba(255,255,255,0.35);
  }

  .desc {
    font-size: 11px; color: rgba(255,255,255,0.22);
    line-height: 1.6; letter-spacing: 0.02em; margin: 0;
  }

  /* ── Demo shell ── */
  .demo {
    height: 420px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.03);
    overflow: hidden;
    position: relative;
    cursor: default;
    user-select: none;
    display: flex;
  }

  /* ── Ambient fill ── */
  .ambient-fill {
    position: absolute;
    inset: -40px;
    filter: blur(50px) saturate(220%);
    opacity: 0.28;
    pointer-events: none;
    z-index: 0;
  }
  .ambient-rich { opacity: 0.38; }

  /* ── Stage ── */
  .stage {
    position: relative;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
  }
  .stage-centered { flex: 1; }
  .stage-fill { flex: 1; padding: 0; }

  /* ── Peek strips ── */
  .peek-strip {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 190px;
    height: 26px;
    border-radius: 5px 5px 0 0;
    pointer-events: none;
  }
  .peek-tall {
    width: 220px;
    height: 34px;
  }

  /* ── Cards ── */
  .card {
    position: absolute;
    border-radius: 8px;
    overflow: hidden;
    z-index: 10;
    box-shadow: 0 40px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.06);
    cursor: zoom-in;
  }
  .card-sm { width: 190px; height: 190px; }

  .card-fill {
    /* fills the stage minus some breathing room */
    position: absolute;
    left: 24px; right: 24px;
    top: 32px; bottom: 0;
    width: auto; height: auto;
    border-radius: 8px 8px 0 0;
  }

  .card-letter {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -55%);
    font-size: 4rem; font-weight: 800;
    color: rgba(255,255,255,0.18);
    pointer-events: none;
  }
  .card-letter-lg { font-size: 6rem; }

  .card-gradient-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 55%);
    pointer-events: none;
  }
  .card-gradient-deep {
    background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%);
  }

  .card-text-overlay {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    padding: 20px 16px 14px;
  }
  .ov-album  { font-size: 13px; font-weight: 700; color: #fff; margin: 0 0 2px; }
  .ov-artist { font-size: 11px; color: rgba(255,255,255,0.55); margin: 0 0 2px; }
  .ov-meta   { font-size: 9px; color: rgba(255,255,255,0.3); margin: 0; letter-spacing: 0.04em; text-transform: uppercase; }

  /* ── Side panel ── */
  .side-panel {
    width: 110px;
    flex-shrink: 0;
    border-left: 1px solid rgba(255,255,255,0.06);
    padding: 1rem 0.85rem;
    display: flex;
    flex-direction: column;
    z-index: 1;
  }
  .side-panel-glass {
    background: rgba(0,0,0,0.25);
    backdrop-filter: blur(12px);
    border-left-color: rgba(255,255,255,0.08);
  }

  .si-counter { font-size: 9px; color: rgba(255,255,255,0.2); letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 0.75rem; }
  .si-album   { font-size: 10px; font-weight: 700; color: #fff; margin: 0 0 3px; line-height: 1.3; }
  .si-artist  { font-size: 9px; color: rgba(255,255,255,0.45); margin: 0 0 3px; }
  .si-meta    { font-size: 9px; color: rgba(255,255,255,0.22); margin: 0; }

  /* ── Full-screen nav ── */
  .fs-nav {
    position: absolute;
    bottom: 16px;
    right: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    z-index: 20;
  }
  .fs-counter {
    font-size: 9px;
    color: rgba(255,255,255,0.25);
    letter-spacing: 0.06em;
  }

  /* ── Nav buttons ── */
  .nav-row {
    display: flex; gap: 6px; margin-top: auto;
  }
  .nav-row button, .fs-nav button {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    color: rgba(255,255,255,0.5);
    width: 28px; height: 28px; border-radius: 50%;
    font-size: 12px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }
  .nav-row button:hover:not(:disabled),
  .fs-nav button:hover:not(:disabled) { background: rgba(255,255,255,0.16); color: #fff; }
  .nav-row button:disabled,
  .fs-nav button:disabled { opacity: 0.2; cursor: default; }

  /* ── Responsive ── */
  @media (max-width: 1100px) {
    .grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 600px) {
    .grid { grid-template-columns: 1fr; }
    .page { padding: 2rem 1.25rem 4rem; }
  }
</style>
