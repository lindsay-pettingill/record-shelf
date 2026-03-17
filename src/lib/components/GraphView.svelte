<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { requestArt } from '$lib/artloader.js';

  export let records = [];

  const dispatch = createEventDispatcher();

  const GENRE_COLORS = {
    'Folk/Americana': '#c8845a',
    'Rock':           '#6b8cba',
    'Jazz':           '#9b7fd4',
    'Pop':            '#d4738c',
    'Soul/R&B':       '#6bb8a8',
  };

  let svgEl;
  let width  = 900;
  let height = 600;
  let nodes  = [];
  let edges  = [];
  let hoveredNode  = null;
  let selectedNode = null;
  let dragging     = null;
  let frameId;

  let modalArtMap = {};

  // ── Build graph from records ──────────────────────────────────────────
  function buildGraph(recs, w, h) {
    const artistMap = {};
    for (const r of recs) {
      if (!r.artist || r.artist === 'Various') continue;
      if (!artistMap[r.artist]) {
        artistMap[r.artist] = { id: r.artist, genre: r.genre, albums: [], recs: [], years: [] };
      }
      artistMap[r.artist].albums.push(r.album);
      artistMap[r.artist].recs.push(r);
      if (r.year) artistMap[r.artist].years.push(+r.year);
    }

    const cx = w / 2, cy = h / 2;
    const nodeList = Object.values(artistMap).map(n => ({
      ...n,
      x:  cx + (Math.random() - 0.5) * 260,
      y:  cy + (Math.random() - 0.5) * 260,
      vx: 0,
      vy: 0,
      r:  Math.max(14, Math.min(30, 10 + n.albums.length * 6)),
    }));

    const edgeList = [];
    for (let i = 0; i < nodeList.length; i++) {
      for (let j = i + 1; j < nodeList.length; j++) {
        const a = nodeList[i], b = nodeList[j];
        let strength = 0;
        if (a.genre && b.genre && a.genre === b.genre) strength = 0.9;
        const aDecade = a.years.length ? Math.round(Math.min(...a.years) / 10) : null;
        const bDecade = b.years.length ? Math.round(Math.min(...b.years) / 10) : null;
        if (aDecade && bDecade && Math.abs(aDecade - bDecade) <= 1) strength = Math.max(strength, 0.3);
        if (strength > 0) edgeList.push({ source: i, target: j, strength });
      }
    }
    return { nodes: nodeList, edges: edgeList };
  }

  // ── Force simulation ──────────────────────────────────────────────────
  function startSimulation(nodeList, edgeList, w, h) {
    if (frameId) cancelAnimationFrame(frameId);
    let alpha = 1.0;
    const cx = w / 2, cy = h / 2;

    function tick() {
      alpha *= 0.98;
      if (alpha < 0.002) { frameId = null; return; }

      for (const n of nodeList) { n.vx *= 0.55; n.vy *= 0.55; }

      // Center gravity
      for (const n of nodeList) {
        n.vx += (cx - n.x) * 0.018 * alpha;
        n.vy += (cy - n.y) * 0.018 * alpha;
      }

      // Repulsion
      for (let i = 0; i < nodeList.length; i++) {
        for (let j = i + 1; j < nodeList.length; j++) {
          const a = nodeList[i], b = nodeList[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minD = a.r + b.r + 50;
          if (dist < minD * 2.5) {
            const f = (minD * minD) / (dist * dist) * 0.6 * alpha;
            const fx = (dx / dist) * f, fy = (dy / dist) * f;
            a.vx -= fx; a.vy -= fy;
            b.vx += fx; b.vy += fy;
          }
        }
      }

      // Spring attraction along edges
      for (const e of edgeList) {
        const a = nodeList[e.source], b = nodeList[e.target];
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const target = 100 + (1 - e.strength) * 80;
        const f = (dist - target) * 0.04 * e.strength * alpha;
        const fx = (dx / dist) * f, fy = (dy / dist) * f;
        a.vx += fx; a.vy += fy;
        b.vx -= fx; b.vy -= fy;
      }

      // Integrate
      for (const n of nodeList) {
        if (n === dragging) continue;
        n.x = Math.max(n.r + 8, Math.min(w - n.r - 8, n.x + n.vx));
        n.y = Math.max(n.r + 8, Math.min(h - n.r - 8, n.y + n.vy));
      }

      nodes = nodeList;
      frameId = requestAnimationFrame(tick);
    }
    frameId = requestAnimationFrame(tick);
  }

  // Rebuild when records change
  $: if (svgEl && records.length) {
    const g = buildGraph(records, width, height);
    nodes = g.nodes;
    edges = g.edges;
    startSimulation(g.nodes, g.edges, width, height);
  }

  onMount(() => {
    const ro = new ResizeObserver(entries => {
      const { width: w, height: h } = entries[0].contentRect;
      width = w; height = h;
      if (nodes.length) startSimulation(nodes, edges, w, h);
    });
    ro.observe(svgEl);

    const g = buildGraph(records, width, height);
    nodes = g.nodes;
    edges = g.edges;
    startSimulation(g.nodes, g.edges, width, height);

    return () => {
      ro.disconnect();
      if (frameId) cancelAnimationFrame(frameId);
    };
  });

  // ── Drag ─────────────────────────────────────────────────────────────
  function startDrag(e, node) {
    e.preventDefault();
    dragging = node;

    function onMove(ev) {
      const rect = svgEl.getBoundingClientRect();
      const cx = (ev.touches ? ev.touches[0].clientX : ev.clientX) - rect.left;
      const cy = (ev.touches ? ev.touches[0].clientY : ev.clientY) - rect.top;
      dragging.x = Math.max(dragging.r, Math.min(width - dragging.r, cx));
      dragging.y = Math.max(dragging.r, Math.min(height - dragging.r, cy));
      dragging.vx = 0; dragging.vy = 0;
      nodes = nodes;
    }

    function onUp() {
      dragging = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
  }

  function nodeColor(genre) { return GENRE_COLORS[genre] ?? '#888'; }

  function handleClick(node) {
    selectedNode = selectedNode === node ? null : node;
    if (selectedNode) {
      selectedNode.recs.forEach(r => {
        if (!modalArtMap[r.id]) {
          requestArt(r.id, r.artist, r.album, url => {
            modalArtMap = { ...modalArtMap, [r.id]: url };
          });
        }
      });
    }
  }

  function clearSelection() { selectedNode = null; }

  $: connectedSet = selectedNode
    ? new Set(
        edges
          .filter(e => nodes[e.source] === selectedNode || nodes[e.target] === selectedNode)
          .flatMap(e => [e.source, e.target])
      )
    : null;

  function nodeOpacity(node, idx) {
    if (!selectedNode) return 1;
    if (node === selectedNode) return 1;
    return connectedSet.has(idx) ? 0.75 : 0.12;
  }

  function edgeOpacity(e) {
    if (!selectedNode) return e.strength > 0.5 ? 0.14 : 0.05;
    if (nodes[e.source] === selectedNode || nodes[e.target] === selectedNode)
      return e.strength > 0.5 ? 0.5 : 0.25;
    return 0.02;
  }

  // Mini stack constants
  const MINI_CARD = 180;
  const MINI_OFFSET = 26;
  const MINI_TOP = 9;
  const MINI_MAX = 10;
</script>

<div class="wrap">
  <!-- Legend -->
  <div class="legend">
    {#each Object.entries(GENRE_COLORS) as [genre, color]}
      <span class="legend-item">
        <span class="swatch" style="background:{color}"></span>
        {genre}
      </span>
    {/each}
    <span class="legend-item muted">node size = album count</span>
  </div>

  <!-- Graph -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <svg bind:this={svgEl} class="graph" on:click={clearSelection}>

    <defs>
      {#each Object.entries(GENRE_COLORS) as [genre, color]}
        <radialGradient id="g-{genre.replace(/\W/g,'')}" cx="35%" cy="35%">
          <stop offset="0%"   stop-color={color} stop-opacity="0.95" />
          <stop offset="100%" stop-color={color} stop-opacity="0.55" />
        </radialGradient>
      {/each}
      <radialGradient id="g-default" cx="35%" cy="35%">
        <stop offset="0%"   stop-color="#888" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#888" stop-opacity="0.55" />
      </radialGradient>
    </defs>

    <!-- Edges -->
    <g class="edges">
      {#each edges as e}
        {@const a = nodes[e.source]}
        {@const b = nodes[e.target]}
        {#if a && b}
          <line
            x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke="rgba(255,255,255,{edgeOpacity(e)})"
            stroke-width={e.strength > 0.5 ? 1.5 : 0.75}
            stroke-dasharray={e.strength > 0.5 ? 'none' : '3 4'}
            style="transition: stroke 0.25s;"
          />
        {/if}
      {/each}
    </g>

    <!-- Nodes -->
    <g class="nodes">
      {#each nodes as node, idx (node.id)}
        {@const color = nodeColor(node.genre)}
        {@const gradId = node.genre ? 'g-' + node.genre.replace(/\W/g,'') : 'g-default'}
        {@const isHovered = hoveredNode === node}
        {@const isSelected = selectedNode === node}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <g
          class="node"
          transform="translate({node.x},{node.y})"
          opacity={nodeOpacity(node, idx)}
          style="transition: opacity 0.25s;"
          on:mouseenter={() => hoveredNode = node}
          on:mouseleave={() => hoveredNode = null}
          on:mousedown={e => startDrag(e, node)}
          on:touchstart={e => startDrag(e, node)}
          on:click|stopPropagation={() => handleClick(node)}
        >
          <!-- Selection ring -->
          {#if isSelected}
            <circle r={node.r + 10} fill="none" stroke={color} stroke-width="2" opacity="0.7" />
          {/if}

          <!-- Glow ring on hover -->
          {#if isHovered && !isSelected}
            <circle r={node.r + 8} fill="none" stroke={color} stroke-width="1.5" opacity="0.4" />
          {/if}

          <!-- Main circle -->
          <circle
            r={node.r}
            fill="url(#{gradId})"
            stroke={color}
            stroke-width={isHovered || isSelected ? 2 : 1}
            style="cursor: pointer; transition: r 0.2s;"
          />

          <!-- Label for larger nodes (3+ albums) -->
          {#if node.albums.length >= 3 || isHovered || isSelected}
            <text
              dy={node.r + 14}
              text-anchor="middle"
              font-size={isHovered || isSelected ? 11 : 10}
              fill="rgba(255,255,255,{isHovered || isSelected ? 0.9 : 0.45})"
              style="pointer-events:none; user-select:none;"
            >{node.id}</text>
          {/if}
        </g>
      {/each}
    </g>
  </svg>

  <!-- Tooltip (hidden when a node is selected) -->
  {#if hoveredNode && !selectedNode}
    {@const n = hoveredNode}
    <div class="tooltip" style="
      left: {Math.min(n.x + n.r + 12, width - 220)}px;
      top:  {Math.max(n.y - 60, 8)}px;
    ">
      <div class="tt-artist">{n.id}</div>
      <div class="tt-genre" style="color:{nodeColor(n.genre)}">{n.genre}</div>
      <ul class="tt-albums">
        {#each n.albums as album}
          <li>{album}</li>
        {/each}
      </ul>
      <div class="tt-hint">click to explore</div>
    </div>
  {/if}

  <!-- Artist modal -->
  {#if selectedNode}
    {@const n = selectedNode}
    {@const color = nodeColor(n.genre)}
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="backdrop" on:click={clearSelection}></div>

    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="modal" on:click|stopPropagation>

      <!-- Header -->
      <div class="modal-head">
        <div class="modal-title-group">
          <div class="modal-artist">{n.id}</div>
          <div class="modal-genre" style="color:{color}">{n.genre} · {n.recs.length} album{n.recs.length !== 1 ? 's' : ''}</div>
        </div>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <button class="modal-x" on:click={clearSelection}>✕</button>
      </div>

      <!-- Mini stack -->
      <div class="mini-stage">
        <div class="mini-track" style="width:{MINI_CARD}px; height:{MINI_CARD}px;">
          {#each n.recs.slice(0, MINI_MAX) as rec, i}
            {@const art = modalArtMap[rec.id]}
            {@const tx = i * MINI_OFFSET}
            {@const ty = i * -MINI_TOP}
            {@const scale = Math.max(0.35, 1 - i * 0.04)}
            {@const zi = MINI_MAX - i}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div
              class="mini-card"
              style="
                width:{MINI_CARD}px; height:{MINI_CARD}px;
                --tx:{tx}px; --ty:{ty}px; --s:{scale}; z-index:{zi};
              "
              on:click={() => dispatch('open', { record: rec, artUrl: modalArtMap[rec.id] ?? null })}
            >
              {#if art}
                <img src={art} alt="{rec.album}" class="mini-art"
                  on:error={e => e.target.style.display = 'none'} />
              {:else}
                <div class="mini-placeholder">
                  <span>{rec.artist?.replace(/^(The |A )/i,'')[0]?.toUpperCase()}</span>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <p class="modal-hint">click any record to view details</p>
    </div>
  {/if}
</div>

<style>
  .wrap {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .graph {
    width: 100%;
    height: 100%;
    display: block;
  }

  /* Legend */
  .legend {
    position: absolute;
    top: 1.25rem;
    right: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 6px;
    z-index: 10;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 10px;
    color: rgba(255,255,255,0.4);
    letter-spacing: 0.04em;
  }

  .legend-item.muted { color: rgba(255,255,255,0.2); margin-top: 4px; }

  .swatch {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  /* Tooltip */
  .tooltip {
    position: absolute;
    background: rgba(12,12,12,0.92);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 10px 14px;
    pointer-events: none;
    backdrop-filter: blur(12px);
    min-width: 160px;
    max-width: 220px;
    z-index: 20;
  }

  .tt-artist {
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    margin-bottom: 2px;
  }

  .tt-genre {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 8px;
  }

  .tt-albums {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .tt-albums li {
    font-size: 11px;
    color: rgba(255,255,255,0.55);
  }

  .tt-hint {
    font-size: 9px;
    color: rgba(255,255,255,0.2);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-top: 8px;
  }

  /* Modal */
  .backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.55);
    backdrop-filter: blur(4px);
    z-index: 30;
  }

  .modal {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 40;
    background: rgba(14,14,14,0.96);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 18px;
    padding: 1.5rem 2rem 1.25rem;
    backdrop-filter: blur(20px);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.25rem;
    min-width: 320px;
  }

  .modal-head {
    width: 100%;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }

  .modal-artist {
    font-size: 1.1rem;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.02em;
  }

  .modal-genre {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-top: 3px;
  }

  .modal-x {
    background: none;
    border: none;
    color: rgba(255,255,255,0.3);
    font-size: 15px;
    cursor: pointer;
    padding: 2px 4px;
    line-height: 1;
    flex-shrink: 0;
    transition: color 0.15s;
  }
  .modal-x:hover { color: rgba(255,255,255,0.7); }

  /* Mini stack */
  .mini-stage {
    display: flex;
    align-items: flex-end;
    justify-content: flex-start;
    /* Extra right/top padding so stacked cards don't clip */
    padding-top: 80px;
    padding-right: 200px;
  }

  .mini-track {
    position: relative;
    flex-shrink: 0;
  }

  .mini-card {
    position: absolute;
    border-radius: 6px;
    overflow: hidden;
    cursor: pointer;
    transform: translateX(var(--tx)) translateY(var(--ty)) scale(var(--s));
    transition:
      transform 0.28s cubic-bezier(0.2,0,0,1),
      filter     0.2s ease,
      box-shadow 0.28s ease;
  }

  /* Desaturate all when any card hovered */
  .mini-track:has(.mini-card:hover) .mini-card {
    filter: grayscale(60%) brightness(0.7);
    transition: filter 0.2s ease, transform 0.28s cubic-bezier(0.2,0,0,1), box-shadow 0.28s ease;
  }

  /* Lift and vivid on hover */
  .mini-card:hover {
    transform: translateX(var(--tx)) translateY(calc(var(--ty) - 60px)) scale(var(--s)) !important;
    filter: saturate(1.3) brightness(1.1) !important;
    z-index: 999 !important;
    box-shadow: 0 24px 60px rgba(0,0,0,0.85);
    transition:
      transform 0.15s cubic-bezier(0.15,0,0,1),
      filter    0.12s ease,
      box-shadow 0.15s ease !important;
  }

  .mini-art {
    width: 100%; height: 100%;
    object-fit: cover; display: block; pointer-events: none;
  }

  .mini-placeholder {
    width: 100%; height: 100%;
    background: linear-gradient(135deg, #2e2e2e, #3a3a3a);
    display: flex; align-items: center; justify-content: center;
  }
  .mini-placeholder span { font-size: 3rem; font-weight: 700; color: rgba(255,255,255,0.2); }

  .modal-hint {
    font-size: 9px;
    color: rgba(255,255,255,0.18);
    text-transform: uppercase;
    letter-spacing: 0.07em;
    margin: 0;
  }
</style>
