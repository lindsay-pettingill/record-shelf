<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import { requestArt } from '$lib/artloader.js';

  const dispatch = createEventDispatcher();

  export let records = [];
  export let scattering = false;
  export let reforming  = false;
  export let resetKey   = 0;

  let activeIndex   = 0;
  let artMap        = {};
  let hoveredRecIdx = null;
  let touchStartX   = null;

  $: resetKey, (activeIndex = 0);
  $: if (records) activeIndex = Math.min(activeIndex, Math.max(0, records.length - 1));
  $: activeRecord = records[activeIndex];
  $: activeArt    = artMap[activeRecord?.id] ?? null;

  // Info panel: show hovered record as live preview, else active
  $: previewRecord = (hoveredRecIdx !== null && hoveredRecIdx !== activeIndex)
    ? records[hoveredRecIdx] : null;
  $: displayRecord = previewRecord ?? activeRecord;
  $: displayArt    = previewRecord ? (artMap[previewRecord.id] ?? null) : activeArt;
  $: isPreviewing  = !!previewRecord;

  // Stack geometry — steep diagonal, dramatic depth
  const OFFSET   = 38;   // option B: wide offset relative to card size
  const TOP      = 12;
  const MAX_SHOW = 16;

  $: orderedIndices = [
    ...records.slice(activeIndex).map((_, i) => activeIndex + i),
    ...records.slice(0, activeIndex).map((_, i) => i),
  ];

  onMount(() => {
    // Load active record first, then the rest
    const sorted = [
      records[activeIndex],
      ...records.filter((_, i) => i !== activeIndex),
    ].filter(Boolean);
    sorted.forEach(r => {
      requestArt(r.id, r.artist, r.album, url => {
        artMap = { ...artMap, [r.id]: url };
      });
    });
  });

  function openCard(record) { dispatch('open', { record, artUrl: artMap[record.id] ?? null }); }
  function next() { activeIndex = Math.min(activeIndex + 1, records.length - 1); }
  function prev() { activeIndex = Math.max(activeIndex - 1, 0); }

  function handleKeydown(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); next(); }
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); prev(); }
  }
  function handleWheel(e) {
    e.preventDefault();
    if (e.deltaY > 10) next();
    else if (e.deltaY < -10) prev();
  }

  function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
  }
  function handleTouchEnd(e) {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(dx) < 12) return; // tap — let click handler fire
    if (dx < 0) next();
    else prev();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="shell">

  <!-- Stack — anchored to bottom-left -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="stack-area"
    on:wheel|preventDefault={handleWheel}
    on:touchstart={handleTouchStart}
    on:touchend={handleTouchEnd}
  >
    <div
      class="track"
      style="
        transform: {scattering ? 'translateX(80px) scale(0.88)' : 'none'};
        opacity: {scattering ? 0 : 1};
        transition: {scattering
          ? 'transform 0.22s cubic-bezier(0.4,0,1,1), opacity 0.18s ease'
          : reforming
            ? 'transform 0.5s cubic-bezier(0.2,0,0,1), opacity 0.36s ease'
            : 'none'};
      "
    >
      {#each orderedIndices as recIdx, stackPos (recIdx)}
        {@const record   = records[recIdx]}
        {@const isActive = stackPos === 0}
        {@const art      = artMap[record.id]}
        {@const show     = stackPos < MAX_SHOW}
        {@const scale    = Math.max(0.32, 1 - stackPos * 0.034)}
        {@const opacity  = isActive ? 1 : show ? Math.max(0.55, 1 - (stackPos / MAX_SHOW) * 0.45) : 0}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
          class="card"
          class:is-active={isActive}
          style="
            --tx: {stackPos * OFFSET}px;
            --ty: {stackPos * -TOP}px;
            --s:  {scale};
            --zi: {isActive ? 999 : MAX_SHOW - stackPos};
            opacity: {opacity};
            pointer-events: {show ? 'auto' : 'none'};
          "
          on:click={() => openCard(record)}
          on:mouseenter={() => hoveredRecIdx = recIdx}
          on:mouseleave={() => hoveredRecIdx = null}
        >
          {#if art}
            <img src={art} alt="{record.artist} — {record.album}" class="art"
              on:error={e => e.target.style.display = 'none'} />
          {:else}
            <div class="placeholder">
              <span>{record.artist?.replace(/^(The |A )/i,'')[0]?.toUpperCase()}</span>
            </div>
          {/if}
          {#if isActive}
            <div class="open-hint">view details</div>
          {/if}
        </div>
      {/each}
    </div>
  </div>

  <!-- Info panel -->
  <div class="info-panel">
    {#if displayRecord}
      {#key displayRecord.id}
        <div class="info-inner" in:fade={{ duration: 110 }}>
          <p class="counter" class:previewing={isPreviewing}>
            {isPreviewing ? 'preview' : `${activeIndex + 1} / ${records.length}`}
          </p>

          {#if displayArt}
            <div class="thumb-wrap">
              <div class="thumb-glow" style="background-image:url({displayArt})" />
              <img src={displayArt} alt="" class="thumb" />
            </div>
          {:else}
            <div class="thumb-placeholder">
              <span>{displayRecord.artist?.replace(/^(The |A )/i,'')[0]?.toUpperCase()}</span>
            </div>
          {/if}

          <div class="badges">
            {#if displayRecord.format && displayRecord.format !== 'LP'}
              <span class="badge">{displayRecord.format}</span>
            {/if}
            {#each (displayRecord.tags||'').split(',').map(t=>t.trim()).filter(Boolean) as tag}
              <span class="badge">{tag}</span>
            {/each}
          </div>

          <h1 class="title">{displayRecord.album}</h1>
          <h2 class="artist">{displayRecord.artist}</h2>
          <p class="meta">{displayRecord.year || '—'}{displayRecord.genre ? ' · ' + displayRecord.genre : ''}</p>
          {#if displayRecord.notes}<p class="notes">{displayRecord.notes}</p>{/if}
        </div>
      {/key}

      <div class="panel-footer">
        {#if !isPreviewing}
          <div class="nav-row">
            <button class="nav-btn" on:click={prev} disabled={activeIndex === 0}>←</button>
            <button class="nav-btn" on:click={next} disabled={activeIndex === records.length - 1}>→</button>
          </div>
          <p class="hint">scroll · swipe · arrows · tap to open</p>
        {:else}
          <p class="hint previewing">click to select</p>
        {/if}
      </div>
    {/if}
  </div>

</div>

<style>
  .shell {
    display: grid;
    grid-template-columns: 1fr 280px;
    height: calc(100vh - 80px);
    overflow: hidden;
  }

  /* ── Stack — anchored at bottom-left ── */
  .stack-area {
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: flex-end;       /* front card sits at the bottom */
    justify-content: flex-start;
    padding: 0 2rem 5rem 5rem;
  }

  /* Track: same size as front card — cards overflow upward via negative translateY */
  .track {
    position: relative;
    width:  320px;
    height: 320px;
    flex-shrink: 0;
  }

  /* ── Cards ── */
  .card {
    position: absolute;
    width:  320px;
    height: 320px;
    border-radius: 8px;
    overflow: hidden;
    will-change: transform, filter, opacity;
    /* Idle: full color — matches video */
    transform: translateX(var(--tx)) translateY(var(--ty)) scale(var(--s));
    filter: none;
    z-index: var(--zi);
    cursor: pointer;
    transition:
      transform  0.3s  cubic-bezier(0.2,0,0,1),
      filter     0.22s ease,
      opacity    0.28s ease,
      box-shadow 0.3s  ease;
  }

  .card.is-active {
    cursor: zoom-in;
    box-shadow:
      0 50px 100px rgba(0,0,0,0.9),
      0 20px 50px  rgba(0,0,0,0.6),
      0 0 0 1px    rgba(255,255,255,0.08);
  }

  /* When any background card is hovered, desaturate the whole stack */
  .track:has(.card:not(.is-active):hover) .card {
    filter: grayscale(65%) brightness(0.72);
    transition: filter 0.25s ease, transform 0.3s cubic-bezier(0.2,0,0,1), opacity 0.28s ease, box-shadow 0.3s ease;
  }

  /* Active card dims a bit more when browsing background cards */
  .track:has(.card:not(.is-active):hover) .card.is-active {
    filter: grayscale(40%) brightness(0.6);
    opacity: 0.5;
  }

  /* Hovered card: override desaturation — vivid + straight-up lift */
  .card:not(.is-active):hover {
    transform: translateX(var(--tx)) translateY(calc(var(--ty) - 90px)) scale(var(--s));
    filter: saturate(1.25) brightness(1.08) !important;
    z-index: 998;
    box-shadow: 0 36px 80px rgba(0,0,0,0.88), 0 10px 28px rgba(0,0,0,0.55);
    transition:
      transform  0.16s cubic-bezier(0.15,0,0,1),
      filter     0.12s ease,
      box-shadow 0.16s ease;
  }

  .art {
    width: 100%; height: 100%;
    object-fit: cover; display: block; pointer-events: none;
  }

  .placeholder {
    width: 100%; height: 100%;
    background: linear-gradient(135deg, #3a3a3a, #4a4a4a);
    display: flex; align-items: center; justify-content: center;
  }
  .placeholder span { font-size: 4.5rem; font-weight: 700; color: rgba(255,255,255,0.22); }

  .open-hint {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    padding: 28px 16px 14px;
    background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%);
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.6);
    text-align: center;
    opacity: 0;
    transition: opacity 0.2s;
  }
  .card:hover .open-hint { opacity: 1; }

  /* ── Info panel ── */
  .info-panel {
    border-left: 1px solid rgba(255,255,255,0.06);
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .info-inner {
    padding: 2rem 1.5rem 0.5rem;
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .counter {
    font-size: 10px;
    color: rgba(255,255,255,0.2);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin: 0 0 1rem;
    transition: color 0.2s;
  }
  .counter.previewing { color: rgba(255,255,255,0.5); }

  .thumb-wrap {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    border-radius: 5px;
    overflow: hidden;
    margin-bottom: 1rem;
    flex-shrink: 0;
  }
  .thumb {
    width: 100%; height: 100%; object-fit: cover; display: block;
    position: relative; z-index: 1; border-radius: 5px;
  }
  .thumb-glow {
    position: absolute; inset: -20px;
    background-size: cover;
    filter: blur(22px) saturate(180%);
    opacity: 0.6; z-index: 0;
  }
  .thumb-placeholder {
    width: 100%; aspect-ratio: 1; border-radius: 5px;
    background: linear-gradient(135deg, #2e2e2e, #3a3a3a);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 1rem; flex-shrink: 0;
  }
  .thumb-placeholder span { font-size: 3rem; font-weight: 700; color: rgba(255,255,255,0.2); }

  .badges { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 0.5rem; }
  .badge {
    font-size: 9px; padding: 2px 8px; border-radius: 100px;
    border: 1px solid rgba(255,255,255,0.18); color: rgba(255,255,255,0.4);
    text-transform: uppercase; letter-spacing: 0.06em;
  }

  .title {
    font-size: 1.15rem; font-weight: 700; color: #fff;
    line-height: 1.2; letter-spacing: -0.02em; margin: 0 0 0.2rem;
  }
  .artist { font-size: 0.85rem; color: rgba(255,255,255,0.5); margin: 0 0 0.3rem; }
  .meta   { font-size: 11px; color: rgba(255,255,255,0.28); margin: 0 0 0.5rem; }
  .notes  { font-size: 11px; color: rgba(255,255,255,0.3); font-style: italic; margin: 0; }

  .panel-footer { padding: 1rem 1.5rem 1.5rem; flex-shrink: 0; }

  .nav-row { display: flex; gap: 8px; margin-bottom: 0.5rem; }
  .nav-btn {
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.5); width: 34px; height: 34px; border-radius: 50%;
    font-size: 1rem; display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s;
  }
  .nav-btn:hover:not(:disabled) { background: rgba(255,255,255,0.12); color: #fff; }
  .nav-btn:disabled { opacity: 0.2; cursor: default; }

  .hint {
    font-size: 9px; color: rgba(255,255,255,0.12);
    letter-spacing: 0.04em; text-transform: uppercase; margin: 0;
  }
  .hint.previewing { color: rgba(255,255,255,0.35); }

  /* ── Mobile ── */
  @media (max-width: 640px) {
    .shell {
      grid-template-columns: 1fr;
      grid-template-rows: 1fr auto;
      height: calc(100vh - 64px);
    }

    .stack-area {
      padding: 0 1rem 3rem 1.5rem;
      justify-content: center;
    }

    .info-panel {
      border-left: none;
      border-top: 1px solid rgba(255,255,255,0.06);
      height: auto;
      flex-direction: row;
      align-items: center;
      padding: 0.75rem 1.25rem;
      gap: 1rem;
    }

    .info-inner {
      flex-direction: row;
      align-items: center;
      padding: 0;
      gap: 0.75rem;
      overflow: hidden;
    }

    /* Hide thumbnail and badges on mobile — keep title/artist/nav */
    .thumb-wrap, .thumb-placeholder, .badges, .counter, .meta, .notes {
      display: none;
    }

    .title { font-size: 0.95rem; margin: 0; }
    .artist { font-size: 0.78rem; margin: 0; }

    .panel-footer {
      padding: 0;
      margin-left: auto;
      flex-shrink: 0;
    }

    .nav-row { margin-bottom: 0; }
    .hint { display: none; }
  }
</style>
