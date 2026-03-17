<script>
  import { fly, fade, crossfade } from 'svelte/transition';
  import { cubicOut, cubicInOut } from 'svelte/easing';

  const recs = [
    { color: '#c8845a', label: 'A', name: 'Townes Van Zandt',  album: 'Our Mother the Mountain' },
    { color: '#6b8cba', label: 'B', name: 'R.E.M.',            album: 'Murmur' },
    { color: '#9b7fd4', label: 'C', name: 'Keith Jarrett',     album: 'The Köln Concert' },
    { color: '#d4738c', label: 'D', name: 'Maggie Rogers',     album: 'Heard It in a Past Life' },
    { color: '#6bb8a8', label: 'E', name: 'Stevie Wonder',     album: 'Talking Book' },
    { color: '#e8a87c', label: 'F', name: 'Waxahatchee',       album: 'Saint Cloud' },
    { color: '#7ba3cc', label: 'G', name: 'Neil Young',        album: 'Harvest' },
    { color: '#b09fdf', label: 'H', name: 'Miles Davis',       album: 'Kind of Blue' },
  ];
  const N = recs.length;
  function mod(n, m) { return ((n % m) + m) % m; }

  // ── Crate ──────────────────────────────────────────────────────────
  let ci = 0;
  let crateDir = 1;
  function crateNext(d) { crateDir = d; ci = mod(ci + d, N); }
  function crateWheel(e) {
    e.preventDefault();
    if (e.deltaY > 8)       crateNext(1);
    else if (e.deltaY < -8) crateNext(-1);
  }
  // peek records behind the current
  $: peek = [mod(ci+1,N), mod(ci+2,N), mod(ci+3,N)];

  // ── Cover Flow ─────────────────────────────────────────────────────
  let fi = 2;
  function flowNext(d) { fi = mod(fi + d, N); }
  function flowWheel(e) {
    e.preventDefault();
    if (e.deltaY > 8)       flowNext(1);
    else if (e.deltaY < -8) flowNext(-1);
  }
  // visible window: prev, active, next (+ 2 outer for depth)
  function flowRec(offset) { return recs[mod(fi + offset, N)]; }

  // ── Immersive ──────────────────────────────────────────────────────
  let ii = 0;
  function immerNext(d) { ii = mod(ii + d, N); }
  function immerWheel(e) {
    e.preventDefault();
    if (e.deltaY > 8)       immerNext(1);
    else if (e.deltaY < -8) immerNext(-1);
  }

  // ── Spine ──────────────────────────────────────────────────────────
  let spineActive = null;
  function spineWheel(e) { /* native horizontal scroll */ }
</script>

<div class="page">
  <div class="page-header">
    <h1>Browsing concepts</h1>
    <p>Scroll inside each demo to navigate · Click any to interact</p>
  </div>

  <div class="concepts">

    <!-- ═══ CRATE ═══════════════════════════════════════════════════════ -->
    <div class="concept">
      <div class="concept-label">Record Store Crate</div>

      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div class="demo crate-demo" on:wheel={crateWheel}>
        <div class="crate-bin">
          <!-- Peek strips: records behind, showing tops -->
          {#each [...peek].reverse() as idx, i}
            <div
              class="crate-peek"
              style="
                background: {recs[idx].color};
                bottom: calc(100% - {(peek.length - i) * 18}px);
                opacity: {0.5 - i * 0.1};
                filter: brightness({0.6 + i * 0.1});
              "
            ></div>
          {/each}

          <!-- Active record -->
          {#key ci}
            <div
              class="crate-card"
              style="background: {recs[ci].color};"
              in:fly={{ y: crateDir * -80, duration: 280, easing: cubicOut }}
              out:fly={{ y: crateDir * 80,  duration: 280, easing: cubicOut }}
            >
              <span class="card-letter">{recs[ci].label}</span>
              <div class="card-meta">
                <div class="card-album">{recs[ci].album}</div>
                <div class="card-artist">{recs[ci].name}</div>
              </div>
            </div>
          {/key}
        </div>

        <!-- Nav -->
        <div class="crate-nav">
          <button on:click={() => crateNext(-1)}>↑</button>
          <span>{mod(ci,N)+1} / {N}</span>
          <button on:click={() => crateNext(1)}>↓</button>
        </div>
      </div>

      <div class="concept-desc">
        Scroll up/down flips through records like a store bin.
        Next records peek above the current one.
      </div>
    </div>

    <!-- ═══ COVER FLOW ════════════════════════════════════════════════ -->
    <div class="concept">
      <div class="concept-label">Cover Flow</div>

      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div class="demo flow-demo" on:wheel={flowWheel}>
        <div class="flow-stage">
          <!-- render 5 slots: -2 -1  0  1  2 -->
          {#each [-2,-1,0,1,2] as offset}
            {@const rec = flowRec(offset)}
            {@const abs = Math.abs(offset)}
            {@const angle = offset * 38}
            {@const tx    = offset * 115}
            {@const scale = abs === 0 ? 1 : abs === 1 ? 0.72 : 0.52}
            {@const zi    = 10 - abs * 3}
            {@const bright = abs === 0 ? 1 : abs === 1 ? 0.65 : 0.4}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div
              class="flow-card"
              style="
                background: {rec.color};
                transform: translateX({tx}px) scale({scale}) rotateY({angle}deg);
                z-index: {zi};
                filter: brightness({bright});
              "
              on:click={() => flowNext(offset)}
            >
              {#if abs === 0}
                <div class="card-meta center-meta">
                  <div class="card-album">{rec.album}</div>
                  <div class="card-artist">{rec.name}</div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
        <div class="flow-dots">
          {#each recs as _, i}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <span class="dot" class:active={i===fi} on:click={() => fi=i}></span>
          {/each}
        </div>
      </div>

      <div class="concept-desc">
        Scroll moves records through the center. Left and right
        neighbors visible simultaneously, angled in 3D.
      </div>
    </div>

    <!-- ═══ IMMERSIVE ════════════════════════════════════════════════ -->
    <div class="concept">
      <div class="concept-label">Full-Screen Immersive</div>

      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div class="demo immer-demo" on:wheel={immerWheel}>
        {#key ii}
          <div
            class="immer-frame"
            in:fade={{ duration: 320 }}
            out:fade={{ duration: 180 }}
            style="background: {recs[ii].color};"
          >
            <!-- Blurred ambient fill -->
            <div class="immer-ambient" style="background: {recs[ii].color};"></div>
            <!-- Cover -->
            <div class="immer-cover" style="background: {recs[ii].color}; filter: brightness(1.15) saturate(1.3);"></div>
            <!-- Info overlay -->
            <div class="immer-info">
              <div class="immer-album">{recs[ii].album}</div>
              <div class="immer-artist">{recs[ii].name}</div>
              <div class="immer-counter">{ii+1} / {N}</div>
            </div>
          </div>
        {/key}
      </div>

      <div class="concept-desc">
        One record fills the screen. Scroll crossfades between records.
        Art and color are the whole experience.
      </div>
    </div>

    <!-- ═══ SPINE / SHELF ════════════════════════════════════════════ -->
    <div class="concept">
      <div class="concept-label">Shelf / Spine</div>

      <div class="demo spine-demo">
        <div class="spine-shelf">
          {#each recs as rec, i}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div
              class="spine"
              class:spine-open={spineActive === i}
              style="
                background: {rec.color};
                width: {spineActive === i ? 180 : 36}px;
              "
              on:click={() => spineActive = spineActive === i ? null : i}
            >
              {#if spineActive === i}
                <div class="spine-expanded">
                  <div class="spine-cover" style="background:{rec.color};"></div>
                  <div class="spine-info">
                    <div class="spine-album">{rec.album}</div>
                    <div class="spine-artist">{rec.name}</div>
                  </div>
                </div>
              {:else}
                <span class="spine-label">{rec.name}</span>
              {/if}
            </div>
          {/each}
        </div>
        <div class="spine-hint">← scroll → to browse · click to expand</div>
      </div>

      <div class="concept-desc">
        Horizontal shelf of spines, color-coded by genre.
        Click any spine to pull the record out.
      </div>
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

  .page-header {
    margin-bottom: 3rem;
  }
  h1 {
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.45);
    margin: 0 0 0.3rem;
  }
  .page-header p {
    font-size: 11px;
    color: rgba(255,255,255,0.2);
    margin: 0;
    letter-spacing: 0.04em;
  }

  .concepts {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 2rem;
  }

  .concept {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .concept-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: rgba(255,255,255,0.35);
  }

  .concept-desc {
    font-size: 11px;
    color: rgba(255,255,255,0.22);
    line-height: 1.6;
    letter-spacing: 0.02em;
  }

  /* Shared demo shell */
  .demo {
    height: 420px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.03);
    overflow: hidden;
    position: relative;
    cursor: default;
    user-select: none;
  }

  /* ── CARD shared ── */
  .card-meta {
    position: absolute;
    bottom: 12px;
    left: 12px;
    right: 12px;
  }
  .card-album  { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.9); line-height: 1.3; }
  .card-artist { font-size: 10px; color: rgba(255,255,255,0.55); margin-top: 2px; }
  .card-letter {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%,-55%);
    font-size: 4rem;
    font-weight: 800;
    color: rgba(255,255,255,0.2);
    user-select: none;
  }

  /* ══════════════════════════════════════
     CRATE
  ══════════════════════════════════════ */
  .crate-demo {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 1.5rem;
  }

  .crate-bin {
    position: relative;
    width: 200px;
    height: 200px;
    flex-shrink: 0;
  }

  .crate-card {
    position: absolute;
    inset: 0;
    border-radius: 8px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.7);
    z-index: 10;
    overflow: hidden;
  }

  /* Peek strips — records peeking above the current */
  .crate-peek {
    position: absolute;
    left: 4px;
    right: 4px;
    height: 22px;
    border-radius: 5px 5px 0 0;
    z-index: 5;
  }

  .crate-nav {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 11px;
    color: rgba(255,255,255,0.25);
    letter-spacing: 0.06em;
  }
  .crate-nav button {
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.12);
    color: rgba(255,255,255,0.5);
    width: 30px; height: 30px;
    border-radius: 50%;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.15s;
    display: flex; align-items: center; justify-content: center;
  }
  .crate-nav button:hover { background: rgba(255,255,255,0.14); color: #fff; }

  /* ══════════════════════════════════════
     COVER FLOW
  ══════════════════════════════════════ */
  .flow-demo {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.25rem;
  }

  .flow-stage {
    position: relative;
    width: 100%;
    height: 220px;
    perspective: 600px;
    perspective-origin: 50% 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .flow-card {
    position: absolute;
    width: 160px;
    height: 160px;
    border-radius: 8px;
    transition: transform 0.38s cubic-bezier(0.2,0,0,1), filter 0.3s ease;
    transform-style: preserve-3d;
    cursor: pointer;
    overflow: hidden;
    box-shadow: 0 16px 40px rgba(0,0,0,0.6);
  }

  .center-meta {
    bottom: 0; left: 0; right: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
    padding: 28px 12px 10px;
  }

  .flow-dots {
    display: flex;
    gap: 6px;
  }
  .dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    cursor: pointer;
    transition: background 0.2s;
  }
  .dot.active { background: rgba(255,255,255,0.7); }

  /* ══════════════════════════════════════
     IMMERSIVE
  ══════════════════════════════════════ */
  .immer-frame {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .immer-ambient {
    position: absolute;
    inset: -30px;
    filter: blur(40px) saturate(200%);
    opacity: 0.55;
  }

  .immer-cover {
    width: 190px;
    height: 190px;
    border-radius: 8px;
    position: relative;
    z-index: 1;
    box-shadow: 0 30px 80px rgba(0,0,0,0.8);
    filter: brightness(1.1) saturate(1.2);
  }

  .immer-info {
    position: absolute;
    bottom: 20px;
    left: 0; right: 0;
    text-align: center;
    z-index: 2;
  }
  .immer-album  { font-size: 13px; font-weight: 700; color: #fff; }
  .immer-artist { font-size: 11px; color: rgba(255,255,255,0.55); margin-top: 3px; }
  .immer-counter {
    font-size: 9px;
    color: rgba(255,255,255,0.2);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-top: 6px;
  }

  /* ══════════════════════════════════════
     SPINE / SHELF
  ══════════════════════════════════════ */
  .spine-demo {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 1rem;
    gap: 0.75rem;
  }

  .spine-shelf {
    display: flex;
    align-items: flex-end;
    gap: 4px;
    overflow-x: auto;
    padding-bottom: 6px;
    height: 340px;
    scrollbar-width: none;
  }
  .spine-shelf::-webkit-scrollbar { display: none; }

  .spine {
    flex-shrink: 0;
    height: 280px;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: width 0.35s cubic-bezier(0.2,0,0,1), box-shadow 0.2s;
    display: flex;
    align-items: flex-end;
  }
  .spine:not(.spine-open):hover {
    box-shadow: 0 -12px 30px rgba(0,0,0,0.6);
    transform: translateY(-8px);
    transition: transform 0.18s ease, box-shadow 0.18s ease, width 0.35s cubic-bezier(0.2,0,0,1);
  }

  .spine-label {
    writing-mode: vertical-rl;
    text-orientation: mixed;
    transform: rotate(180deg);
    font-size: 9px;
    color: rgba(255,255,255,0.5);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 8px 10px;
    letter-spacing: 0.06em;
    max-height: 100%;
  }

  .spine-expanded {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .spine-cover {
    flex: 1;
    filter: brightness(1.15) saturate(1.2);
  }

  .spine-info {
    padding: 8px 10px;
    background: rgba(0,0,0,0.5);
    flex-shrink: 0;
  }
  .spine-album  { font-size: 10px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .spine-artist { font-size: 9px;  color: rgba(255,255,255,0.5); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }

  .spine-hint {
    font-size: 9px;
    color: rgba(255,255,255,0.15);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    text-align: center;
  }

  /* ── Responsive ── */
  @media (max-width: 1100px) {
    .concepts { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 600px) {
    .concepts { grid-template-columns: 1fr; }
    .page { padding: 2rem 1.25rem 4rem; }
  }
</style>
