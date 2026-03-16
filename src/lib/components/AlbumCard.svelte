<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { requestArt } from '$lib/artloader.js';

  const dispatch = createEventDispatcher();

  export let record;
  export let visible = true;
  export let scattering = false;
  export let reforming = false;
  export let scatterX = 0;
  export let scatterY = 0;

  let artUrl = null;
  let artFailed = false;

  onMount(() => {
    requestArt(record.id, record.artist, record.album, (url) => {
      artUrl = url;
    });
  });

  function handleArtError() {
    artFailed = true;
    artUrl = null;
  }

  $: initial = record.artist?.replace(/^(The |A )/i, '')[0]?.toUpperCase() ?? '?';
  $: hasArt = artUrl && !artFailed;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="card"
  class:hidden={!scattering && !reforming && !visible}
  class:scatter-out={scattering}
  class:scatter-in={!scattering && reforming && visible}
  class:scatter-gone={!scattering && reforming && !visible}
  on:click={() => dispatch('open', { record, artUrl })}
  style="view-transition-name: art-{record.id}; --sx:{scatterX}; --sy:{scatterY}"
>
  <div class="art-wrap">
    {#if hasArt}
      <img
        class="art"
        src={artUrl}
        alt="{record.artist} — {record.album}"
        on:error={handleArtError}
      />
      <img
        class="glow"
        src={artUrl}
        alt=""
        aria-hidden="true"
        on:error={() => {}}
      />
    {:else}
      <div class="placeholder">
        <span class="initial">{initial}</span>
        {#if !artUrl && !artFailed}
          <div class="shimmer"></div>
        {/if}
      </div>
    {/if}
  </div>

  <div class="info">
    <div class="album-title">{record.album}</div>
    <div class="artist">{record.artist}</div>
    <div class="meta">
      {record.year || '—'}
      {#if record.genre} · {record.genre.split('·')[0].trim()}{/if}
      {#if record.format && record.format !== 'LP'} · {record.format}{/if}
    </div>
    {#if record.tags}
      <div class="tags">
        {#each record.tags.split(',').map(t => t.trim()).filter(Boolean) as tag}
          <span class="tag">{tag}</span>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .card {
    position: relative;
    aspect-ratio: 1;
    border-radius: 6px;
    overflow: hidden;
    cursor: pointer;
    transition:
      transform 0.3s cubic-bezier(0.2, 0, 0, 1),
      opacity 0.25s ease;
  }

  .card:hover {
    transform: scale(1.05);
    z-index: 10;
  }

  .card.hidden {
    opacity: 0.07;
    transform: scale(0.96);
    pointer-events: none;
  }

  .card.scatter-out {
    transform:
      translate(calc(var(--sx) * 400px), calc(var(--sy) * 400px))
      scale(0.15)
      rotate(calc(var(--sx) * 25deg));
    opacity: 0;
    transition:
      transform 0.28s cubic-bezier(0.4, 0, 1, 1),
      opacity   0.2s ease;
    pointer-events: none;
  }

  .card.scatter-in {
    transform: none;
    opacity: 1;
    transition:
      transform 0.55s cubic-bezier(0.2, 0, 0, 1),
      opacity   0.4s ease;
  }

  .card.scatter-gone {
    opacity: 0;
    transform: scale(0.8);
    transition: none;
    pointer-events: none;
  }

  /* Art */
  .art-wrap {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .art {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  /* Ambient glow — blurred duplicate of art behind the card */
  .glow {
    position: absolute;
    inset: -25%;
    width: 150%;
    height: 150%;
    object-fit: cover;
    filter: blur(28px) saturate(130%);
    opacity: 0;
    z-index: -1;
    transition: opacity 0.4s ease;
    pointer-events: none;
  }

  .card:hover .glow {
    opacity: 0.75;
  }

  /* Placeholder */
  .placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #1c1c1c, #262626);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  .initial {
    font-size: 2.5rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.12);
    user-select: none;
  }

  .shimmer {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.04) 50%,
      transparent 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1.8s infinite;
  }

  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  /* Info overlay */
  .info {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 12px 10px 10px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.92) 0%, transparent 100%);
    transform: translateY(102%);
    transition: transform 0.22s cubic-bezier(0.2, 0, 0, 1);
  }

  .card:hover .info {
    transform: translateY(0);
  }

  .album-title {
    font-size: 11.5px;
    font-weight: 600;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.4;
  }

  .artist {
    font-size: 10.5px;
    color: rgba(255, 255, 255, 0.55);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 1px;
  }

  .meta {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.35);
    margin-top: 3px;
  }

  .tags {
    display: flex;
    gap: 4px;
    margin-top: 5px;
    flex-wrap: wrap;
  }

  .tag {
    font-size: 9px;
    padding: 2px 6px;
    border-radius: 100px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.45);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
</style>
