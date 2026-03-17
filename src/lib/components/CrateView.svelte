<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { requestArt } from '$lib/artloader.js';

  const dispatch = createEventDispatcher();

  export let records = [];
  export let resetKey = 0;
  export let reasons = {};

  let artMap = {};
  let ci = 0;
  let dir = 1;
  let throttled = false;

  $: resetKey, (ci = 0);
  $: ci = Math.min(ci, Math.max(0, records.length - 1));
  $: peek = [1, 2, 3, 4].map(n => records[(ci + n) % records.length]).filter(Boolean);
  $: currentRecord = records[ci];

  onMount(() => {
    records.forEach(r => {
      requestArt(r.id, r.artist, r.album, url => {
        artMap = { ...artMap, [r.id]: url };
      });
    });
  });

  $: {
    records.forEach(r => {
      if (!artMap[r.id]) {
        requestArt(r.id, r.artist, r.album, url => {
          artMap = { ...artMap, [r.id]: url };
        });
      }
    });
  }

  function go(d) {
    if (throttled) return;
    if (d > 0 && ci >= records.length - 1) return;
    if (d < 0 && ci <= 0) return;
    throttled = true;
    dir = d;
    ci += d;
    setTimeout(() => { throttled = false; }, 260);
  }

  function handleWheel(e) {
    e.preventDefault();
    if (e.deltaY > 8) go(1);
    else if (e.deltaY < -8) go(-1);
  }

  function handleKeydown(e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowUp'   || e.key === 'ArrowLeft')  { e.preventDefault(); go(-1); }
  }

  let touchStartY = null;
  function handleTouchStart(e) { touchStartY = e.touches[0].clientY; }
  function handleTouchEnd(e) {
    if (touchStartY === null) return;
    const dy = e.changedTouches[0].clientY - touchStartY;
    touchStartY = null;
    if (Math.abs(dy) < 12) return;
    go(dy < 0 ? 1 : -1);
  }

  function openDetail() {
    const r = records[ci];
    dispatch('open', { record: r, artUrl: artMap[r.id] ?? null });
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="crate-wrap" on:wheel|preventDefault={handleWheel} on:touchstart={handleTouchStart} on:touchend={handleTouchEnd}>

  <!-- Ambient color wash — slow crossfade on each flip -->
  {#key ci}
    <div
      class="ambient"
      style={artMap[currentRecord?.id]
        ? `background-image: url('${artMap[currentRecord.id]}');`
        : `background: #1a1a1a;`}
      in:fade={{ duration: 900 }}
      out:fade={{ duration: 700 }}
    ></div>
  {/key}

  <!-- Stage -->
  <div class="crate-stage">

    <!-- Peek strips -->
    {#each [...peek].reverse() as r, i}
      {@const peekIdx = peek.length - 1 - i}
      {@const art = artMap[r.id]}
      <div
        class="peek-strip"
        style="
          bottom: calc(100% - {(peekIdx + 1) * 58}px);
          opacity: {0.7 - peekIdx * 0.12};
          filter: brightness({0.45 + peekIdx * 0.12});
          z-index: {peekIdx + 1};
          {art ? `background-image: url('${art}'); background-size: cover; background-position: top center;` : 'background: #2a2a2a;'}
        "
      >
        <span class="spine-name">{r.artist}</span>
        <span class="spine-year">{r.year}</span>
      </div>
    {/each}

    <!-- Active record -->
    {#key ci}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div
        class="crate-card"
        in:fly={{ y: dir * -100, duration: 260, easing: cubicOut }}
        out:fly={{ y: dir * 100,  duration: 220, easing: cubicOut }}
        on:click={openDetail}
      >
        {#if artMap[currentRecord?.id]}
          <img src={artMap[currentRecord.id]} alt="{currentRecord.artist} — {currentRecord.album}" class="card-art" />
        {:else}
          <div class="card-placeholder">
            <span>{currentRecord?.artist?.replace(/^(The |A )/i, '')[0]?.toUpperCase()}</span>
          </div>
        {/if}
        <div class="card-gradient"></div>
        <div class="open-hint">view details</div>
      </div>
    {/key}

  </div>

  <!-- Glass info panel -->
  <div class="crate-info">
    {#key ci}
      <div class="info-inner" in:fade={{ duration: 120 }}>
        <p class="counter">{ci + 1} / {records.length}</p>
        <h2 class="title">{currentRecord?.album}</h2>
        <p class="artist">{currentRecord?.artist}</p>
        <p class="meta">
          {currentRecord?.year || '—'}{currentRecord?.genre ? ' · ' + currentRecord.genre : ''}
        </p>
        {#if currentRecord?.notes}
          <p class="notes">{currentRecord.notes}</p>
        {/if}
        {#if reasons[currentRecord?.id]}
          <p class="reason">
            <svg class="reason-record" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5.5" fill="#1a1a1a" stroke="rgba(180,160,255,0.5)" stroke-width="0.8"/><circle cx="6" cy="6" r="1" fill="rgba(180,160,255,0.7)"/></svg>
            {reasons[currentRecord.id]}
          </p>
        {/if}
      </div>
    {/key}

    <div class="nav-row">
      <button class="nav-btn" on:click={() => go(-1)} disabled={ci === 0}>↑</button>
      <button class="nav-btn" on:click={() => go(1)}  disabled={ci === records.length - 1}>↓</button>
    </div>
    <p class="hint">scroll · swipe · arrows · tap to open</p>
  </div>

</div>

<style>
  .crate-wrap {
    height: 100%;
    display: grid;
    grid-template-columns: 1fr 280px;
    overflow: hidden;
    position: relative;
  }

  /* ── Ambient wash ── */
  .ambient {
    position: absolute;
    inset: -80px;
    background-size: cover;
    background-position: center;
    filter: blur(80px) saturate(180%) brightness(0.45);
    opacity: 0.7;
    pointer-events: none;
    z-index: 0;
  }

  /* ── Stage ── */
  .crate-stage {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    z-index: 1;
  }

  /* ── Peek strips ── */
  .peek-strip {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 340px;
    height: 62px;
    border-radius: 6px 6px 0 0;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    padding: 7px 12px 0;
    gap: 2px;
    overflow: hidden;
  }

  .spine-name {
    font-size: 10px;
    font-weight: 600;
    color: rgba(255,255,255,0.8);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: 0.02em;
    text-shadow: 0 1px 4px rgba(0,0,0,0.7);
  }
  .spine-year {
    font-size: 9px;
    color: rgba(255,255,255,0.45);
    letter-spacing: 0.06em;
    text-shadow: 0 1px 3px rgba(0,0,0,0.6);
  }

  /* ── Active card ── */
  .crate-card {
    position: absolute;
    width: 340px;
    height: 340px;
    border-radius: 8px;
    overflow: hidden;
    cursor: zoom-in;
    z-index: 10;
    box-shadow:
      0 60px 120px rgba(0,0,0,0.85),
      0 20px 50px  rgba(0,0,0,0.5),
      0 0 0 1px    rgba(255,255,255,0.08);
  }

  .card-art {
    width: 100%; height: 100%;
    object-fit: cover; display: block;
  }

  .card-placeholder {
    width: 100%; height: 100%;
    background: linear-gradient(135deg, #2e2e2e, #3a3a3a);
    display: flex; align-items: center; justify-content: center;
  }
  .card-placeholder span {
    font-size: 6rem; font-weight: 800; color: rgba(255,255,255,0.15);
  }

  .card-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 50%);
    pointer-events: none;
  }

  .open-hint {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    padding: 24px 16px 16px;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.65);
    text-align: center;
    opacity: 0;
    transition: opacity 0.2s;
    pointer-events: none;
  }
  .crate-card:hover .open-hint { opacity: 1; }

  /* ── Glass info panel ── */
  .crate-info {
    position: relative;
    z-index: 1;
    border-left: 1px solid rgba(255,255,255,0.08);
    background: rgba(0,0,0,0.3);
    backdrop-filter: blur(20px);
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 2rem 1.5rem 1.5rem;
    overflow: hidden;
  }

  .info-inner { flex: 1; overflow: hidden; }

  .counter {
    font-size: 10px; color: rgba(255,255,255,0.2);
    letter-spacing: 0.1em; text-transform: uppercase;
    margin: 0 0 1.25rem;
  }
  .title {
    font-size: 1.2rem; font-weight: 700; color: #fff;
    line-height: 1.2; letter-spacing: -0.02em; margin: 0 0 0.3rem;
  }
  .artist { font-size: 0.85rem; color: rgba(255,255,255,0.5); margin: 0 0 0.3rem; }
  .meta   { font-size: 11px; color: rgba(255,255,255,0.28); margin: 0 0 0.5rem; }
  .notes  { font-size: 11px; color: rgba(255,255,255,0.3); font-style: italic; margin: 0; }

  .reason {
    display: flex; align-items: flex-start; gap: 5px;
    font-size: 11px; color: rgba(180,160,255,0.7);
    line-height: 1.4; margin: 0.5rem 0 0;
  }
  .reason-record { width: 12px; height: 12px; flex-shrink: 0; margin-top: 2px; }

  .nav-row { display: flex; gap: 8px; margin-bottom: 0.5rem; flex-shrink: 0; }
  .nav-btn {
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.12);
    color: rgba(255,255,255,0.5);
    width: 34px; height: 34px; border-radius: 50%;
    font-size: 1rem;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s;
  }
  .nav-btn:hover:not(:disabled) { background: rgba(255,255,255,0.14); color: #fff; }
  .nav-btn:disabled { opacity: 0.2; cursor: default; }

  .hint {
    font-size: 9px; color: rgba(255,255,255,0.12);
    letter-spacing: 0.04em; text-transform: uppercase; margin: 0;
    flex-shrink: 0;
  }

  /* ── Mobile ── */
  @media (max-width: 640px) {
    .crate-wrap {
      grid-template-columns: 1fr;
      grid-template-rows: 1fr auto;
    }

    .crate-card, .peek-strip { width: 260px; }
    .crate-card { height: 260px; }

    .crate-info {
      border-left: none;
      border-top: 1px solid rgba(255,255,255,0.08);
      flex-direction: row;
      align-items: center;
      padding: 0.75rem 1.25rem;
      gap: 1rem;
      height: auto;
    }

    .info-inner {
      display: flex; flex-direction: row;
      align-items: center; gap: 0.75rem;
    }

    .counter, .meta, .notes { display: none; }
    .title  { font-size: 0.95rem; margin: 0; }
    .artist { font-size: 0.78rem; margin: 0; }

    .nav-row { margin-bottom: 0; margin-left: auto; flex-shrink: 0; }
    .hint { display: none; }
  }
</style>
