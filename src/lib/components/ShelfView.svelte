<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { requestArt } from '$lib/artloader.js';

  const dispatch = createEventDispatcher();

  export let records = [];
  export let reasons = {};

  let artMap = {};
  let expandedId = null;
  let containerWidth = 0;
  let containerEl;

  const SPINE_W    = 34;   // collapsed spine px
  const SPINE_GAP  = 3;
  const EXPANDED_W = 200;

  // How many records fit per shelf row
  $: perRow = containerWidth
    ? Math.floor((containerWidth - 48) / (SPINE_W + SPINE_GAP))
    : 20;

  // Chunk records into shelf rows
  $: rows = (() => {
    if (!perRow) return [];
    const out = [];
    for (let i = 0; i < records.length; i += perRow) {
      out.push(records.slice(i, i + perRow));
    }
    return out;
  })();

  // Reset expanded when records change
  $: records, (expandedId = null);

  onMount(() => {
    const ro = new ResizeObserver(([e]) => {
      containerWidth = e.contentRect.width;
    });
    ro.observe(containerEl);
    containerWidth = containerEl.getBoundingClientRect().width;

    records.forEach(r => {
      requestArt(r.id, r.artist, r.album, url => {
        artMap = { ...artMap, [r.id]: url };
      });
    });

    return () => ro.disconnect();
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

  function expand(r) { expandedId = r.id; }
  function collapse() { expandedId = null; }

  function openDetail(r) {
    dispatch('open', { record: r, artUrl: artMap[r.id] ?? null });
  }

</script>

<div class="shelves" bind:this={containerEl}>
  {#each rows as row, rowIdx}
    <div class="shelf-row">
      <!-- Shelf board -->
      <div class="shelf-board"></div>

      <!-- Records -->
      <div class="spines">
        {#each row as r (r.id)}
          {@const art = artMap[r.id]}
          {@const isOpen = expandedId === r.id}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div
            class="spine"
            class:spine-open={isOpen}
            on:mouseenter={() => expand(r)}
            on:mouseleave={collapse}
            on:click={() => openDetail(r)}
          >
            {#if isOpen}
              <div class="spine-expanded">
                <div class="spine-cover">
                  {#if art}
                    <img src={art} alt="{r.artist} — {r.album}" />
                  {:else}
                    <div class="cover-placeholder">
                      <span>{r.artist?.replace(/^(The |A )/i,'')[0]?.toUpperCase()}</span>
                    </div>
                  {/if}
                </div>
                <div class="spine-info">
                  <p class="info-album">{r.album}</p>
                  <p class="info-artist">{r.artist}</p>
                  <p class="info-meta">{r.year || '—'}{r.genre ? ' · ' + r.genre : ''}</p>
                  {#if reasons[r.id]}
                    <p class="info-reason">
                      <svg class="reason-record" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5.5" fill="#1a1a1a" stroke="rgba(180,160,255,0.5)" stroke-width="0.8"/><circle cx="6" cy="6" r="1" fill="rgba(180,160,255,0.7)"/></svg>
                      {reasons[r.id]}
                    </p>
                  {:else}
                    <p class="info-hint">click to open</p>
                  {/if}
                </div>
              </div>
            {:else}
              <div
                class="spine-closed"
                style={art
                  ? `background-image: url('${art}'); background-size: cover; background-position: center;`
                  : `background: hsl(${(r.id * 47) % 360}, 22%, 22%);`}
              >
                <span class="spine-label">{r.artist}</span>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/each}

  {#if records.length === 0}
    <p class="empty">No records found.</p>
  {/if}
</div>

<style>
  .shelves {
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 4rem 2rem 4rem;
    display: flex;
    flex-direction: column;
    gap: 0;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.1) transparent;
  }
  .shelves::-webkit-scrollbar { width: 4px; }
  .shelves::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

  /* ── Shelf row ── */
  .shelf-row {
    position: relative;
    padding-bottom: 14px; /* space for board */
    margin-bottom: 2rem;
    overflow: visible;
  }

  /* The shelf board sits below the spines */
  .shelf-board {
    position: absolute;
    bottom: 0;
    left: -8px; right: -8px;
    height: 10px;
    background: linear-gradient(to bottom,
      rgba(255,255,255,0.06) 0%,
      rgba(255,255,255,0.03) 40%,
      rgba(0,0,0,0.4) 100%
    );
    border-top: 1px solid rgba(255,255,255,0.08);
    border-radius: 1px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.6);
  }

  /* ── Spines row ── */
  .spines {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    flex-wrap: nowrap;
    overflow: visible;
  }

  /* ── Individual spine ── */
  .spine {
    flex-shrink: 0;
    height: 260px;
    width: 34px;
    border-radius: 4px 4px 0 0;
    cursor: pointer;
    overflow: hidden;
    transition: width 0.32s cubic-bezier(0.2,0,0,1), box-shadow 0.25s, transform 0.25s ease, opacity 0.2s ease, filter 0.2s ease;
  }

  .spine-open {
    width: 280px;
    z-index: 10;
    transform: translateY(-36px) scale(1.04);
    box-shadow:
      0 50px 100px rgba(0,0,0,0.95),
      0 20px 40px rgba(0,0,0,0.7),
      0 0 0 1px rgba(255,255,255,0.13);
    overflow: visible;
  }

  /* Aggressively dim everything else */
  .spines:has(.spine-open) .spine:not(.spine-open) {
    opacity: 0.18;
    filter: saturate(0) brightness(0.6);
  }

  /* ── Closed ── */
  .spine-closed {
    width: 100%;
    height: 100%;
    background: #222;
    display: flex;
    align-items: flex-end;
    padding-bottom: 10px;
    justify-content: center;
  }

  .spine-label {
    writing-mode: vertical-rl;
    text-orientation: mixed;
    transform: rotate(180deg);
    font-size: 9px;
    color: rgba(255,255,255,0.6);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: 0.04em;
    max-height: 88%;
    text-shadow: 0 1px 4px rgba(0,0,0,0.8);
  }

  /* ── Expanded ── */
  .spine-expanded {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .spine-cover {
    flex-shrink: 0;
    height: 240px;
    overflow: hidden;
    background: #1a1a1a;
  }
  .spine-cover img {
    width: 100%; height: 100%;
    object-fit: cover; display: block;
  }
  .cover-placeholder {
    width: 100%; height: 100%;
    background: linear-gradient(135deg, #2e2e2e, #1e1e1e);
    display: flex; align-items: center; justify-content: center;
  }
  .cover-placeholder span {
    font-size: 3rem; font-weight: 800; color: rgba(255,255,255,0.15);
  }

  .spine-info {
    flex: 1;
    background: rgba(10,10,10,0.92);
    padding: 7px 9px 6px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: hidden;
    min-height: 0;
  }

  .info-album  { font-size: 13px; font-weight: 700; color: #fff; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.01em; }
  .info-artist { font-size: 11px; color: rgba(255,255,255,0.55); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .info-meta   { font-size: 10px; color: rgba(255,255,255,0.28); margin: 0; }

  .info-hint {
    margin-top: auto;
    font-size: 9px;
    color: rgba(255,255,255,0.22);
    padding-top: 3px;
    white-space: nowrap;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .info-reason {
    margin-top: auto;
    display: flex;
    align-items: flex-start;
    gap: 5px;
    font-size: 10px;
    color: rgba(180,160,255,0.7);
    line-height: 1.4;
    padding-top: 4px;
  }
  .reason-record {
    width: 12px; height: 12px;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .empty {
    font-size: 13px;
    color: rgba(255,255,255,0.2);
    text-align: center;
    margin-top: 4rem;
  }

  /* ── Mobile ── */
  @media (max-width: 640px) {
    .shelves { padding: 1.5rem 1rem 4rem; }
    .spine { height: 200px; }
    .spine-cover { height: 150px; }
    .spine-open { width: 160px; }
  }
</style>
