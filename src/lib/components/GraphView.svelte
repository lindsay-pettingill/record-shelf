<script>
  import { onMount, createEventDispatcher } from 'svelte';

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
  let hoveredNode = null;
  let dragging    = null;
  let frameId;

  // ── Build graph from records ──────────────────────────────────────────
  function buildGraph(recs, w, h) {
    const artistMap = {};
    for (const r of recs) {
      if (!r.artist || r.artist === 'Various') continue;
      if (!artistMap[r.artist]) {
        artistMap[r.artist] = { id: r.artist, genre: r.genre, albums: [], years: [] };
      }
      artistMap[r.artist].albums.push(r.album);
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
  function handleClick(node) { dispatch('filter', { artist: node.id }); }
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
  <svg bind:this={svgEl} class="graph">

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
            stroke="rgba(255,255,255,{e.strength > 0.5 ? 0.14 : 0.05})"
            stroke-width={e.strength > 0.5 ? 1.5 : 0.75}
            stroke-dasharray={e.strength > 0.5 ? 'none' : '3 4'}
          />
        {/if}
      {/each}
    </g>

    <!-- Nodes -->
    <g class="nodes">
      {#each nodes as node (node.id)}
        {@const color = nodeColor(node.genre)}
        {@const gradId = node.genre ? 'g-' + node.genre.replace(/\W/g,'') : 'g-default'}
        {@const isHovered = hoveredNode === node}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <g
          class="node"
          transform="translate({node.x},{node.y})"
          on:mouseenter={() => hoveredNode = node}
          on:mouseleave={() => hoveredNode = null}
          on:mousedown={e => startDrag(e, node)}
          on:touchstart={e => startDrag(e, node)}
          on:click={() => handleClick(node)}
        >
          <!-- Glow ring on hover -->
          {#if isHovered}
            <circle r={node.r + 8} fill="none" stroke={color} stroke-width="1.5" opacity="0.4" />
          {/if}

          <!-- Main circle -->
          <circle
            r={node.r}
            fill="url(#{gradId})"
            stroke={color}
            stroke-width={isHovered ? 2 : 1}
            style="cursor: pointer; transition: r 0.2s;"
          />

          <!-- Label for larger nodes (3+ albums) -->
          {#if node.albums.length >= 3 || isHovered}
            <text
              dy={node.r + 14}
              text-anchor="middle"
              font-size={isHovered ? 11 : 10}
              fill="rgba(255,255,255,{isHovered ? 0.9 : 0.45})"
              style="pointer-events:none; user-select:none;"
            >{node.id}</text>
          {/if}
        </g>
      {/each}
    </g>
  </svg>

  <!-- Tooltip -->
  {#if hoveredNode}
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
      <div class="tt-hint">click to filter</div>
    </div>
  {/if}
</div>

<style>
  .wrap {
    position: relative;
    width: 100%;
    height: calc(100vh - 130px);
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
</style>
