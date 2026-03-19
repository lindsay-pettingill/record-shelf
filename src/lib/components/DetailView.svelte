<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { requestArt, requestDetails } from '$lib/artloader.js';

  export let record;
  export let artUrl;
  export let allRecords = [];

  const dispatch = createEventDispatcher();

  let relatedArtMap = {};
  let details = null;

  $: {
    details = null;
    requestDetails(record.id, record.artist, record.album, d => { details = d; });
  }

  function formatDuration(ms) {
    const s = Math.round(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  function listenUrl(service) {
    const q = encodeURIComponent(`${record.artist} ${record.album}`);
    return service === 'spotify'
      ? `https://open.spotify.com/search/${q}`
      : `https://music.apple.com/search?term=${q}`;
  }

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
      }, r.imageUrl);
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
          {#if details?.label}
            <span class="sep">·</span>
            <span class="label-name">{details.label}{details.catalog ? ' · ' + details.catalog : ''}</span>
          {/if}
        </div>

        <!-- Listen buttons -->
        <div class="listen-row">
          <a href={listenUrl('spotify')} target="_blank" rel="noopener noreferrer" class="listen-btn spotify">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
            Spotify
          </a>
          <a href={listenUrl('apple')} target="_blank" rel="noopener noreferrer" class="listen-btn apple">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.064-2.31-2.05-3.06A5.022 5.022 0 0019.7.27c-.91-.19-1.84-.17-2.72.03-.13.03-.26.07-.39.11-.2.06-.39.14-.59.2-.76.27-1.46.64-2.02 1.17-.08.07-.15.14-.22.22-.47.44-.86.96-1.11 1.56-.13.32-.22.65-.29.99-.08.43-.1.86-.07 1.29.03.38.08.76.18 1.13-.36.09-.72.19-1.07.3-1.3.4-2.49 1.02-3.5 1.88-1.2 1.01-2.1 2.33-2.58 3.85-.46 1.48-.5 3.07-.12 4.58.36 1.43 1.07 2.74 2.08 3.8 1.01 1.07 2.29 1.87 3.7 2.27 1.36.39 2.81.41 4.19.07 1.12-.27 2.18-.78 3.08-1.5.9-.71 1.62-1.63 2.1-2.67.49-1.04.74-2.19.72-3.35V8.7a9.51 9.51 0 005.33 1.62v-3.1a5.67 5.67 0 01-2.19-.62 5.7 5.7 0 01-1.79-1.49z"/></svg>
            Apple Music
          </a>
        </div>

        {#if record.notes}
          <p class="notes">{record.notes}</p>
        {/if}

        <!-- Tracklist -->
        {#if details?.tracklist?.length}
          <div class="section">
            <div class="section-label">Tracklist</div>
            <ol class="tracklist">
              {#each details.tracklist as track}
                <li class="track">
                  <span class="track-num">{track.position}</span>
                  <span class="track-title">{track.title}</span>
                  {#if track.length}
                    <span class="track-dur">{formatDuration(track.length)}</span>
                  {/if}
                </li>
              {/each}
            </ol>
          </div>
        {:else if details !== null && !details?.tracklist?.length}
          <!-- details loaded but no tracklist — show nothing -->
        {:else}
          <!-- still loading — show nothing (no skeleton needed) -->
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

  .label-name {
    color: rgba(255, 255, 255, 0.25);
  }

  .notes {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.4);
    font-style: italic;
    margin-bottom: 1.5rem;
  }

  /* Listen buttons */
  .listen-row {
    display: flex;
    gap: 8px;
    margin-bottom: 1.5rem;
  }

  .listen-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 100px;
    font-size: 12px;
    font-weight: 500;
    text-decoration: none;
    letter-spacing: 0.01em;
    transition: opacity 0.15s, transform 0.15s;
    border: 1px solid transparent;
  }
  .listen-btn:hover { opacity: 0.8; transform: translateY(-1px); }

  .listen-btn.spotify {
    background: rgba(30, 215, 96, 0.12);
    border-color: rgba(30, 215, 96, 0.3);
    color: #1ed760;
  }

  .listen-btn.apple {
    background: rgba(252, 60, 68, 0.12);
    border-color: rgba(252, 60, 68, 0.3);
    color: #fc3c44;
  }

  /* Tracklist */
  .tracklist {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
  }

  .track {
    display: grid;
    grid-template-columns: 24px 1fr auto;
    align-items: baseline;
    gap: 8px;
    padding: 5px 0;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .track:last-child { border-bottom: none; }

  .track-num {
    font-size: 10px;
    color: rgba(255,255,255,0.2);
    text-align: right;
  }
  .track-title {
    font-size: 12px;
    color: rgba(255,255,255,0.65);
  }
  .track-dur {
    font-size: 10px;
    color: rgba(255,255,255,0.25);
    font-variant-numeric: tabular-nums;
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
