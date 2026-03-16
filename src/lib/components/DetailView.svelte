<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { requestArt } from '$lib/artloader.js';

  export let record;
  export let artUrl;
  export let allRecords = [];

  const dispatch = createEventDispatcher();

  let relatedArtMap = {};

  $: moreByArtist = allRecords.filter(
    r => r.artist === record.artist && r.id !== record.id
  );

  // Single genre exact match
  $: sameGenre = allRecords.filter(r => {
    if (r.artist === record.artist || r.id === record.id) return false;
    return r.genre && r.genre === record.genre;
  }).slice(0, 6);

  $: relatedRecords = [...moreByArtist, ...sameGenre];

  // Load art for related records
  $: relatedRecords.forEach(r => {
    if (!relatedArtMap[r.id]) {
      requestArt(r.id, r.artist, r.album, url => {
        relatedArtMap = { ...relatedArtMap, [r.id]: url };
      });
    }
  });

  function close() { dispatch('close'); }

  function handleKeydown(e) {
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') dispatch('next');
    if (e.key === 'ArrowLeft') dispatch('prev');
  }

  let visible = false;
  onMount(() => { requestAnimationFrame(() => { visible = true; }); });
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="overlay" class:visible on:click|self={close}>

  <!-- Ambient background: blurred art fills screen -->
  <div class="ambient">
    {#if artUrl}
      <img src={artUrl} alt="" aria-hidden="true" class="ambient-img" />
    {:else}
      <div class="ambient-fallback" />
    {/if}
  </div>

  <div class="panel" class:visible>
    <!-- Close -->
    <button class="close-btn" on:click={close} aria-label="Close">✕</button>

    <!-- Nav arrows -->
    <button class="nav prev" on:click={() => dispatch('prev')} aria-label="Previous">‹</button>
    <button class="nav next" on:click={() => dispatch('next')} aria-label="Next">›</button>

    <div class="layout">

      <!-- Art -->
      <div class="art-col">
        {#if artUrl}
          <img
            src={artUrl}
            alt="{record.artist} — {record.album}"
            class="main-art"
            style="view-transition-name: art-{record.id}"
          />
        {:else}
          <div class="art-placeholder">
            <span>{record.artist?.replace(/^(The |A )/i, '')[0]?.toUpperCase()}</span>
          </div>
        {/if}
      </div>

      <!-- Info -->
      <div class="info-col">
        <div class="tags-row">
          {#if record.format && record.format !== 'LP'}
            <span class="badge">{record.format}</span>
          {/if}
          {#each (record.tags || '').split(',').map(t => t.trim()).filter(Boolean) as tag}
            <span class="badge">{tag}</span>
          {/each}
        </div>

        <h1 class="album-title">{record.album}</h1>
        <h2 class="artist">{record.artist}</h2>

        <div class="meta-row">
          <span class="year">{record.year || '—'}</span>
          {#if record.genre}
            <span class="sep">·</span>
            <span class="genre">{record.genre}</span>
          {/if}
        </div>

        {#if record.notes}
          <p class="notes">{record.notes}</p>
        {/if}

        <!-- More by artist -->
        {#if moreByArtist.length > 0}
          <div class="section">
            <div class="section-label">More by {record.artist}</div>
            <div class="related-grid">
              {#each moreByArtist as rel}
                <button class="related-card" on:click={() => dispatch('select', rel)}>
                  <div class="rel-art-wrap">
                    {#if relatedArtMap[rel.id]}
                      <img src={relatedArtMap[rel.id]} alt={rel.album} class="rel-art" on:error={e => e.target.style.display='none'} />
                    {/if}
                    <div class="rel-initial">{rel.artist?.replace(/^(The |A )/i, '')[0]?.toUpperCase()}</div>
                  </div>
                  <div class="rel-title">{rel.album}</div>
                  <div class="rel-year">{rel.year}</div>
                </button>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Same genre -->
        {#if sameGenre.length > 0}
          <div class="section">
            <div class="section-label">Also in {record.genre}</div>
            <div class="related-grid">
              {#each sameGenre as rel}
                <button class="related-card" on:click={() => dispatch('select', rel)}>
                  <div class="rel-art-wrap">
                    {#if relatedArtMap[rel.id]}
                      <img src={relatedArtMap[rel.id]} alt={rel.album} class="rel-art" on:error={e => e.target.style.display='none'} />
                    {/if}
                    <div class="rel-initial">{rel.artist?.replace(/^(The |A )/i, '')[0]?.toUpperCase()}</div>
                  </div>
                  <div class="rel-title">{rel.album}</div>
                  <div class="rel-year">{rel.year}</div>
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>

    </div>
  </div>
</div>

<style>
  /* Overlay */
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.6);
    opacity: 0;
    transition: opacity 0.25s ease;
    backdrop-filter: blur(2px);
  }
  .overlay.visible { opacity: 1; }

  /* Ambient background */
  .ambient {
    position: absolute;
    inset: 0;
    overflow: hidden;
    z-index: 0;
  }
  .ambient-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: blur(80px) saturate(180%) brightness(0.35);
    transform: scale(1.15);
  }
  .ambient-fallback {
    width: 100%;
    height: 100%;
    background: #111;
  }

  /* Panel */
  .panel {
    position: relative;
    z-index: 1;
    width: 90vw;
    max-width: 1100px;
    max-height: 88vh;
    overflow-y: auto;
    background: rgba(10, 10, 10, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    backdrop-filter: blur(40px);
    padding: 2.5rem;
    transform: translateY(24px) scale(0.97);
    transition: transform 0.35s cubic-bezier(0.2, 0, 0, 1);
  }
  .panel.visible {
    transform: translateY(0) scale(1);
  }

  /* Layout */
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 420px) 1fr;
    gap: 3rem;
    align-items: start;
  }

  /* Art */
  .art-col {
    position: sticky;
    top: 0;
  }
  .main-art {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: 8px;
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.7);
    display: block;
  }
  .art-placeholder {
    width: 100%;
    aspect-ratio: 1;
    border-radius: 8px;
    background: linear-gradient(135deg, #1c1c1c, #2a2a2a);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .art-placeholder span {
    font-size: 6rem;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.1);
  }

  /* Info */
  .info-col {
    padding-top: 0.25rem;
  }

  .tags-row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }
  .badge {
    font-size: 10px;
    padding: 3px 10px;
    border-radius: 100px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .album-title {
    font-size: 2.2rem;
    font-weight: 700;
    color: #fff;
    line-height: 1.15;
    letter-spacing: -0.02em;
    margin-bottom: 0.4rem;
  }
  .artist {
    font-size: 1.1rem;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 0.75rem;
  }
  .meta-row {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.35);
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 1.5rem;
  }
  .sep { color: rgba(255,255,255,0.2); }

  .notes {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.4);
    font-style: italic;
    margin-bottom: 1.5rem;
  }

  /* Related sections */
  .section {
    margin-top: 2rem;
  }
  .section-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: rgba(255, 255, 255, 0.3);
    margin-bottom: 0.75rem;
  }
  .related-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 8px;
  }
  .related-card {
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    padding: 0;
    transition: opacity 0.15s;
  }
  .related-card:hover { opacity: 0.75; }
  .rel-art-wrap {
    aspect-ratio: 1;
    border-radius: 4px;
    overflow: hidden;
    background: #1e1e1e;
    position: relative;
    margin-bottom: 4px;
  }
  .rel-art {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .rel-initial {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.12);
  }
  .rel-title {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.6);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .rel-year {
    font-size: 9px;
    color: rgba(255, 255, 255, 0.3);
  }

  /* Controls */
  .close-btn {
    position: absolute;
    top: 1.25rem;
    right: 1.25rem;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.5);
    width: 32px;
    height: 32px;
    border-radius: 50%;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    cursor: pointer;
    z-index: 2;
  }
  .close-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
  }

  .nav {
    position: fixed;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.5);
    width: 44px;
    height: 44px;
    border-radius: 50%;
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    cursor: pointer;
    z-index: 110;
  }
  .nav:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
  }
  .nav.prev { left: 1.5rem; }
  .nav.next { right: 1.5rem; }

  /* Scrollbar */
  .panel::-webkit-scrollbar { width: 4px; }
  .panel::-webkit-scrollbar-track { background: transparent; }
  .panel::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
</style>
