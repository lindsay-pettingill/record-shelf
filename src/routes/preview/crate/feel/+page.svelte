<script>
  import { fly, fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  const recs = [
    { color: '#c8845a', name: 'Townes Van Zandt',  album: 'Our Mother the Mountain', year: '1969' },
    { color: '#6b8cba', name: 'R.E.M.',            album: 'Murmur',                  year: '1983' },
    { color: '#9b7fd4', name: 'Keith Jarrett',     album: 'The Köln Concert',        year: '1975' },
    { color: '#d4738c', name: 'Maggie Rogers',     album: 'Heard It in a Past Life', year: '2019' },
    { color: '#6bb8a8', name: 'Stevie Wonder',     album: 'Talking Book',            year: '1972' },
    { color: '#e8a87c', name: 'Waxahatchee',       album: 'Saint Cloud',             year: '2020' },
    { color: '#7ba3cc', name: 'Neil Young',        album: 'Harvest',                 year: '1972' },
    { color: '#b09fdf', name: 'Miles Davis',       album: 'Kind of Blue',            year: '1959' },
  ];
  const N = recs.length;
  function mod(n, m) { return ((n % m) + m) % m; }

  let ci = [0, 0, 0, 0];
  let dr = [1, 1, 1, 1];
  let th = [false, false, false, false];
  // for card resistance demo: track in-flight state
  let flying = [false, false, false, false];

  function go(d, i) {
    if (th[i]) return;
    const next = ci[i] + d;
    if (next < 0 || next >= N) return;
    th[i] = true;
    dr[i] = d;
    flying[i] = true;
    ci[i] = next;
    ci = [...ci]; dr = [...dr]; flying = [...flying];
    setTimeout(() => { th[i] = false; flying[i] = false; th = [...th]; flying = [...flying]; }, 300);
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
    <span class="title">Crate feel — scroll inside each to flip</span>
  </div>

  <div class="grid">

    <!-- ══ 1. TALLER PEEKS + SPINE LABELS ════════════════════════ -->
    <div class="concept">
      <p class="label">Taller peeks + spine labels</p>
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div class="demo" on:wheel={wheel(0)}>
        <div class="ambient" style="background:{recs[ci[0]].color};"></div>
        <div class="stage">
          {#each [...peek[0]].reverse() as r, i}
            {@const pi = peek[0].length - 1 - i}
            <div class="peek peek-tall" style="
              bottom: calc(100% - {(pi+1)*58}px);
              background: {r.color};
              opacity: {0.7 - pi*0.12};
              filter: brightness({0.45 + pi*0.12});
              z-index: {pi+1};
            ">
              <span class="spine-name">{r.name}</span>
              <span class="spine-year">{r.year}</span>
            </div>
          {/each}
          {#key ci[0]}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div class="card"
              style="background:{recs[ci[0]].color};"
              in:fly={{ y: dr[0]*-90, duration:250, easing:cubicOut }}
              out:fly={{ y: dr[0]*90, duration:210, easing:cubicOut }}
            >
              <div class="card-label">{recs[ci[0]].name[0]}</div>
            </div>
          {/key}
        </div>
        <div class="nav-col">
          <button on:click={()=>go(-1,0)} disabled={ci[0]===0}>↑</button>
          <span>{ci[0]+1}/{N}</span>
          <button on:click={()=>go(1,0)} disabled={ci[0]===N-1}>↓</button>
        </div>
      </div>
      <p class="desc">Peeks are 58px tall — enough to read the artist and year, like real spines in a bin.</p>
    </div>

    <!-- ══ 2. PERSPECTIVE TILT ════════════════════════════════════ -->
    <div class="concept">
      <p class="label">Perspective tilt</p>
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div class="demo" on:wheel={wheel(1)}>
        <div class="ambient" style="background:{recs[ci[1]].color};"></div>
        <div class="stage stage-perspective">
          {#each [...peek[1]].reverse() as r, i}
            {@const pi = peek[1].length - 1 - i}
            <div class="peek peek-mid" style="
              bottom: calc(100% - {(pi+1)*26}px);
              background: {r.color};
              opacity: {0.6 - pi*0.1};
              filter: brightness({0.45 + pi*0.1});
              z-index: {pi+1};
            "></div>
          {/each}
          {#key ci[1]}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div class="card"
              style="background:{recs[ci[1]].color};"
              in:fly={{ y: dr[1]*-90, duration:250, easing:cubicOut }}
              out:fly={{ y: dr[1]*90, duration:210, easing:cubicOut }}
            >
              <div class="card-label">{recs[ci[1]].name[0]}</div>
            </div>
          {/key}
        </div>
        <div class="nav-col">
          <button on:click={()=>go(-1,1)} disabled={ci[1]===0}>↑</button>
          <span>{ci[1]+1}/{N}</span>
          <button on:click={()=>go(1,1)} disabled={ci[1]===N-1}>↓</button>
        </div>
      </div>
      <p class="desc">The stage is tilted with CSS perspective — you're looking down into the crate at ~15°.</p>
    </div>

    <!-- ══ 3. CARD RESISTANCE ════════════════════════════════════ -->
    <div class="concept">
      <p class="label">Card resistance on flip</p>
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div class="demo" on:wheel={wheel(2)}>
        <div class="ambient" style="background:{recs[ci[2]].color};"></div>
        <div class="stage">
          {#each [...peek[2]].reverse() as r, i}
            {@const pi = peek[2].length - 1 - i}
            <div class="peek peek-mid" style="
              bottom: calc(100% - {(pi+1)*26}px);
              background: {r.color};
              opacity: {0.6 - pi*0.1};
              filter: brightness({0.45 + pi*0.1});
              z-index: {pi+1};
            "></div>
          {/each}
          {#key ci[2]}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div
              class="card card-resist"
              style="background:{recs[ci[2]].color}; --tilt:{dr[2] * -8}deg;"
              in:fly={{ y: dr[2]*-90, duration:300, easing:cubicOut }}
              out:fly={{ y: dr[2]*90, duration:240, easing:cubicOut }}
            >
              <div class="card-label">{recs[ci[2]].name[0]}</div>
            </div>
          {/key}
        </div>
        <div class="nav-col">
          <button on:click={()=>go(-1,2)} disabled={ci[2]===0}>↑</button>
          <span>{ci[2]+1}/{N}</span>
          <button on:click={()=>go(1,2)} disabled={ci[2]===N-1}>↓</button>
        </div>
      </div>
      <p class="desc">Card tilts slightly on the way in/out — like a record being lifted from a bin and dropped back.</p>
    </div>

    <!-- ══ 4. CRATE WALLS ════════════════════════════════════════ -->
    <div class="concept">
      <p class="label">Crate walls</p>
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div class="demo" on:wheel={wheel(3)}>
        <div class="ambient" style="background:{recs[ci[3]].color};"></div>
        <div class="stage stage-crate">
          <!-- Crate side walls -->
          <div class="crate-wall crate-left"></div>
          <div class="crate-wall crate-right"></div>
          <div class="crate-floor"></div>

          {#each [...peek[3]].reverse() as r, i}
            {@const pi = peek[3].length - 1 - i}
            <div class="peek peek-mid" style="
              bottom: calc(100% - {(pi+1)*26}px);
              background: {r.color};
              opacity: {0.6 - pi*0.1};
              filter: brightness({0.45 + pi*0.1});
              z-index: {pi+1};
            "></div>
          {/each}
          {#key ci[3]}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div class="card"
              style="background:{recs[ci[3]].color};"
              in:fly={{ y: dr[3]*-90, duration:250, easing:cubicOut }}
              out:fly={{ y: dr[3]*90, duration:210, easing:cubicOut }}
            >
              <div class="card-label">{recs[ci[3]].name[0]}</div>
            </div>
          {/key}
        </div>
        <div class="nav-col">
          <button on:click={()=>go(-1,3)} disabled={ci[3]===0}>↑</button>
          <span>{ci[3]+1}/{N}</span>
          <button on:click={()=>go(1,3)} disabled={ci[3]===N-1}>↓</button>
        </div>
      </div>
      <p class="desc">Subtle side walls and a floor shadow imply the record is sitting inside a container.</p>
    </div>

  </div>
</div>

<style>
  :global(body) { background: #070707; margin: 0; }

  .page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    font-family: system-ui, sans-serif;
    color: #fff;
  }

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
  .title { font-size: 11px; color: rgba(255,255,255,0.18); letter-spacing: 0.04em; }

  .grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1px;
    background: rgba(255,255,255,0.05);
    padding: 2rem;
    gap: 2rem;
    background: transparent;
  }

  .concept { display: flex; flex-direction: column; gap: 0.75rem; }

  .label {
    font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.1em;
    color: rgba(255,255,255,0.3);
    margin: 0;
  }

  .desc {
    font-size: 11px; color: rgba(255,255,255,0.2);
    line-height: 1.6; margin: 0;
  }

  /* ── Demo shell ── */
  .demo {
    height: 420px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.07);
    background: #0c0c0c;
    overflow: hidden;
    position: relative;
    display: flex;
    user-select: none;
    cursor: default;
  }

  /* ── Ambient ── */
  .ambient {
    position: absolute;
    inset: -60px;
    filter: blur(60px) saturate(180%) brightness(0.4);
    opacity: 0.6;
    pointer-events: none;
    z-index: 0;
    transition: background 0.8s ease;
  }

  /* ── Stage ── */
  .stage {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
  }

  .stage-perspective {
    perspective: 500px;
    perspective-origin: 50% 30%;
    transform-style: preserve-3d;
  }
  .stage-perspective .card,
  .stage-perspective .peek {
    transform-origin: center bottom;
  }
  /* tilt entire inner content */
  .stage-perspective::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  /* Apply tilt via a wrapper — use a child div trick */
  .stage-perspective > * {
    transform: rotateX(12deg);
  }

  .stage-crate {
    padding: 0 24px;
  }

  /* ── Peek strips ── */
  .peek {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    pointer-events: none;
    border-radius: 4px 4px 0 0;
  }
  .peek-mid  { width: 200px; height: 28px; }
  .peek-tall {
    width: 200px;
    height: 62px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    padding: 6px 10px 0;
    gap: 2px;
    border-radius: 5px 5px 0 0;
    overflow: hidden;
  }

  .spine-name {
    font-size: 9px;
    font-weight: 600;
    color: rgba(255,255,255,0.75);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: 0.02em;
    text-shadow: 0 1px 3px rgba(0,0,0,0.6);
  }
  .spine-year {
    font-size: 8px;
    color: rgba(255,255,255,0.4);
    letter-spacing: 0.06em;
  }

  /* ── Card ── */
  .card {
    position: absolute;
    width: 200px;
    height: 200px;
    border-radius: 7px;
    overflow: hidden;
    z-index: 10;
    box-shadow:
      0 40px 80px rgba(0,0,0,0.85),
      0 0 0 1px rgba(255,255,255,0.07);
    cursor: zoom-in;
  }

  .card-resist {
    animation: tilt-in 0.32s cubic-bezier(0.2,0,0,1) forwards;
  }
  @keyframes tilt-in {
    0%   { transform: rotateX(var(--tilt, -8deg)) translateY(0); }
    60%  { transform: rotateX(calc(var(--tilt, -8deg) * -0.3)) translateY(0); }
    100% { transform: rotateX(0deg) translateY(0); }
  }

  .card-label {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -55%);
    font-size: 4.5rem; font-weight: 800;
    color: rgba(255,255,255,0.18);
    pointer-events: none;
  }

  /* ── Crate walls ── */
  .crate-wall {
    position: absolute;
    top: 20%;
    bottom: 0;
    width: 18px;
    z-index: 15;
    border-radius: 3px;
  }
  .crate-left {
    left: 24px;
    background: linear-gradient(to right, rgba(0,0,0,0.55), rgba(0,0,0,0.15));
    box-shadow: inset -1px 0 0 rgba(255,255,255,0.05);
  }
  .crate-right {
    right: 24px;
    background: linear-gradient(to left, rgba(0,0,0,0.55), rgba(0,0,0,0.15));
    box-shadow: inset 1px 0 0 rgba(255,255,255,0.05);
  }
  .crate-floor {
    position: absolute;
    bottom: 0;
    left: 24px; right: 24px;
    height: 28px;
    z-index: 14;
    background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
    box-shadow: 0 -2px 0 rgba(255,255,255,0.04);
  }

  /* ── Nav col ── */
  .nav-col {
    width: 52px;
    flex-shrink: 0;
    border-left: 1px solid rgba(255,255,255,0.05);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    z-index: 2;
    background: rgba(0,0,0,0.25);
    backdrop-filter: blur(12px);
  }
  .nav-col span {
    font-size: 9px; color: rgba(255,255,255,0.2);
    letter-spacing: 0.06em;
  }
  .nav-col button {
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.4);
    width: 28px; height: 28px; border-radius: 50%;
    font-size: 12px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }
  .nav-col button:hover:not(:disabled) { background: rgba(255,255,255,0.15); color: #fff; }
  .nav-col button:disabled { opacity: 0.18; cursor: default; }

  @media (max-width: 1100px) {
    .grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 600px) {
    .grid { grid-template-columns: 1fr; padding: 1.25rem; }
  }
</style>
