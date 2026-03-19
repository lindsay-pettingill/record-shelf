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

  let nodeArtMap  = {};   // artist → art url (for node circles)
  let hoveredGenre = null;
  let clearTimer;

  function sanitizeId(str) {
    return (str ?? '').replace(/[^a-zA-Z0-9]/g, '-');
  }

  function onNodeEnter(node) {
    clearTimeout(clearTimer);
    hoveredNode  = node;
    hoveredGenre = node.genre ?? null;
  }
  function onNodeLeave() {
    hoveredNode = null;
    clearTimer  = setTimeout(() => { hoveredGenre = null; }, 80);
  }

  // ── Build graph ───────────────────────────────────────────────────────
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
      vx: 0, vy: 0,
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

  // ── Load art into node circles ────────────────────────────────────────
  function loadNodeArt(nodeList) {
    nodeList.forEach(node => {
      if (node.recs.length > 0 && !nodeArtMap[node.id]) {
        const r = node.recs[0];
        requestArt(r.id, r.artist, r.album, url => {
          nodeArtMap = { ...nodeArtMap, [node.id]: url };
        }, r.imageUrl);
      }
    });
  }

  // ── Force simulation (never fully stops — ambient drift) ──────────────
  function startSimulation(nodeList, edgeList, w, h, energize = false) {
    if (frameId) cancelAnimationFrame(frameId);
    let alpha    = energize ? 0.5 : 1.0;
    let driftTick = 0;
    const cx = w / 2, cy = h / 2;

    function tick() {
      const settled = alpha < 0.004;

      if (!settled) {
        alpha *= 0.98;
      } else {
        // Ambient drift: gentle random nudge every ~45 frames
        driftTick++;
        if (driftTick % 45 === 0) {
          for (const n of nodeList) {
            n.vx += (Math.random() - 0.5) * 0.3;
            n.vy += (Math.random() - 0.5) * 0.3;
          }
        }
      }

      const eff = settled ? 0.012 : alpha;

      for (const n of nodeList) { n.vx *= 0.55; n.vy *= 0.55; }

      // Center gravity
      for (const n of nodeList) {
        n.vx += (cx - n.x) * 0.018 * eff;
        n.vy += (cy - n.y) * 0.018 * eff;
      }

      // Repulsion
      for (let i = 0; i < nodeList.length; i++) {
        for (let j = i + 1; j < nodeList.length; j++) {
          const a = nodeList[i], b = nodeList[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minD = a.r + b.r + 50;
          if (dist < minD * 2.5) {
            const f = (minD * minD) / (dist * dist) * 0.6 * eff;
            const fx = (dx / dist) * f, fy = (dy / dist) * f;
            a.vx -= fx; a.vy -= fy;
            b.vx += fx; b.vy += fy;
          }
        }
      }

      // Spring attraction
      for (const e of edgeList) {
        const a = nodeList[e.source], b = nodeList[e.target];
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const target = 100 + (1 - e.strength) * 80;
        const f = (dist - target) * 0.04 * e.strength * eff;
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

  $: if (svgEl && records.length) {
    const g = buildGraph(records, width, height);
    nodes = g.nodes;
    edges = g.edges;
    loadNodeArt(g.nodes);
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
    loadNodeArt(g.nodes);
    startSimulation(g.nodes, g.edges, width, height);

    return () => {
      ro.disconnect();
      if (frameId) cancelAnimationFrame(frameId);
    };
  });

  // ── Drag (re-energizes simulation) ───────────────────────────────────
  function startDrag(e, node) {
    e.preventDefault();
    dragging = node;
    startSimulation(nodes, edges, width, height, true);

    function onMove(ev) {
      const rect = svgEl.getBoundingClientRect();
      const px = (ev.touches ? ev.touches[0].clientX : ev.clientX) - rect.left;
      const py = (ev.touches ? ev.touches[0].clientY : ev.clientY) - rect.top;
      dragging.x = Math.max(dragging.r, Math.min(width  - dragging.r, px));
      dragging.y = Math.max(dragging.r, Math.min(height - dragging.r, py));
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
    if (selectedNode === node) {
      selectedNode = null;
      return;
    }
    selectedNode = node;
    // Open the first record in the full DetailView
    const r = node.recs[0];
    requestArt(r.id, r.artist, r.album, url => {
      dispatch('open', { record: r, artUrl: url });
    }, r.imageUrl);
  }

  function clearSelection() { selectedNode = null; }

  $: connectedSet = selectedNode
    ? new Set(
        edges
          .filter(e => nodes[e.source] === selectedNode || nodes[e.target] === selectedNode)
          .flatMap(e => [e.source, e.target])
      )
    : null;

  $: selectedEdges = selectedNode
    ? edges.filter(e => nodes[e.source] === selectedNode || nodes[e.target] === selectedNode)
    : [];

  function nodeOpacity(node, idx) {
    if (selectedNode) {
      if (node === selectedNode) return 1;
      return connectedSet.has(idx) ? 0.8 : 0.1;
    }
    if (hoveredGenre) {
      return node.genre === hoveredGenre ? 1 : 0.1;
    }
    return 1;
  }

  function edgeOpacity(e) {
    if (selectedNode) {
      if (nodes[e.source] === selectedNode || nodes[e.target] === selectedNode) return 0;
      return 0.02;
    }
    if (hoveredGenre) {
      const same = nodes[e.source]?.genre === hoveredGenre && nodes[e.target]?.genre === hoveredGenre;
      return same ? (e.strength > 0.5 ? 0.45 : 0.18) : 0.02;
    }
    return e.strength > 0.5 ? 0.14 : 0.05;
  }


</script>

<div class="wrap">
  <!-- Legend -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div class="legend" on:mouseleave={() => { clearTimeout(clearTimer); if (!hoveredNode) hoveredGenre = null; }}>
    {#each Object.entries(GENRE_COLORS) as [genre, color]}
      <span
        class="legend-item"
        class:legend-active={hoveredGenre === genre}
        on:mouseenter={() => { clearTimeout(clearTimer); if (!hoveredNode) hoveredGenre = genre; }}
      >
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
      <!-- Glow filter for selected nodes -->
      <filter id="node-glow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="5" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      <!-- Genre gradient fills -->
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

      <!-- Clip paths for album art in nodes (updated reactively as nodes move) -->
      {#each nodes as node (node.id)}
        <clipPath id="clip-{sanitizeId(node.id)}">
          <circle cx={node.x} cy={node.y} r={node.r} />
        </clipPath>
      {/each}
    </defs>

    <!-- Background edges -->
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

    <!-- Animated flow edges for selected node (genre-colored dashes that travel) -->
    {#if selectedNode}
      <g class="edges-flow">
        {#each selectedEdges as e}
          {@const a = nodes[e.source]}
          {@const b = nodes[e.target]}
          {#if a && b}
            <!-- Static base line -->
            <line
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={nodeColor(selectedNode.genre)}
              stroke-width={e.strength > 0.5 ? 1.5 : 1}
              opacity="0.2"
            />
            <!-- Animated traveling dashes -->
            <line
              class="edge-flow"
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={nodeColor(selectedNode.genre)}
              stroke-width={e.strength > 0.5 ? 2 : 1.2}
              stroke-dasharray={e.strength > 0.5 ? '8 6' : '5 8'}
              opacity={e.strength > 0.5 ? 0.75 : 0.45}
            />
          {/if}
        {/each}
      </g>
    {/if}

    <!-- Nodes -->
    <g class="nodes">
      {#each nodes as node, idx (node.id)}
        {@const color      = nodeColor(node.genre)}
        {@const gradId     = node.genre ? 'g-' + node.genre.replace(/\W/g,'') : 'g-default'}
        {@const isHovered  = hoveredNode === node}
        {@const isSelected = selectedNode === node}
        {@const hasArt     = !!nodeArtMap[node.id]}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <g
          class="node"
          transform="translate({node.x},{node.y})"
          opacity={nodeOpacity(node, idx)}
          style="transition: opacity 0.3s;"
          on:mouseenter={() => onNodeEnter(node)}
          on:mouseleave={onNodeLeave}
          on:mousedown={e => startDrag(e, node)}
          on:touchstart={e => startDrag(e, node)}
          on:click|stopPropagation={() => handleClick(node)}
        >
          <!-- Pulse ring: radiates outward from selected node -->
          {#if isSelected}
            <circle class="pulse-ring" r={node.r + 4} fill="none" stroke={color} stroke-width="2" />
            <circle class="pulse-ring pulse-ring-2" r={node.r + 4} fill="none" stroke={color} stroke-width="1.5" />
          {/if}

          <!-- Selection outer ring -->
          {#if isSelected}
            <circle r={node.r + 10} fill="none" stroke={color} stroke-width="1.5" opacity="0.5" />
          {/if}

          <!-- Hover glow ring -->
          {#if isHovered && !isSelected}
            <circle r={node.r + 8} fill="none" stroke={color} stroke-width="1.5" opacity="0.4" />
          {/if}

          <!-- Base circle (genre gradient; fades when art is showing) -->
          <circle
            class="node-circle"
            r={node.r}
            fill="url(#{gradId})"
            stroke={color}
            stroke-width={isHovered || isSelected ? 2 : 1}
            opacity={hasArt ? 0.25 : 1}
            filter={isSelected ? 'url(#node-glow)' : 'none'}
          />

          <!-- Album art clipped to circle -->
          {#if hasArt}
            <image
              href={nodeArtMap[node.id]}
              x={-node.r} y={-node.r}
              width={node.r * 2} height={node.r * 2}
              clip-path="url(#clip-{sanitizeId(node.id)})"
              preserveAspectRatio="xMidYMid slice"
              style="pointer-events:none;"
            />
            <!-- Genre color tint overlay for identification -->
            <circle
              r={node.r}
              fill={color}
              opacity={isHovered || isSelected ? 0.1 : 0.2}
              style="pointer-events:none; transition: opacity 0.2s;"
            />
            <!-- Stroke ring on top of art -->
            <circle
              r={node.r}
              fill="none"
              stroke={color}
              stroke-width={isHovered || isSelected ? 2 : 1}
              style="pointer-events:none;"
            />
          {/if}

          <!-- Label -->
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

  <!-- Tooltip -->
  {#if hoveredNode && !selectedNode}
    {@const n = hoveredNode}
    <div class="tooltip" style="left:{Math.min(n.x + n.r + 12, width - 220)}px; top:{Math.max(n.y - 60, 8)}px;">
      <div class="tt-artist">{n.id}</div>
      <div class="tt-genre" style="color:{nodeColor(n.genre)}">{n.genre}</div>
      <ul class="tt-albums">
        {#each n.albums as album}
          <li>{album}</li>
        {/each}
      </ul>
      <div class="tt-hint">click to open</div>
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

  /* ── Animated flowing edges ── */
  .edge-flow {
    animation: flow 1.4s linear infinite;
  }

  @keyframes flow {
    from { stroke-dashoffset: 28; }
    to   { stroke-dashoffset: 0; }
  }

  /* ── Pulse rings on selected node ── */
  .pulse-ring {
    transform-box: fill-box;
    transform-origin: center;
    animation: pulse-ring 2s ease-out infinite;
  }
  .pulse-ring-2 {
    animation-delay: 1s;
  }

  @keyframes pulse-ring {
    0%   { transform: scale(1);   opacity: 0.6; }
    100% { transform: scale(2.4); opacity: 0; }
  }

  /* ── Node hover scale ── */
  .node-circle {
    transform-box: fill-box;
    transform-origin: center;
    transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1);
  }
  .node:hover .node-circle {
    transform: scale(1.1);
  }

  /* ── Legend ── */
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
    cursor: default;
    transition: color 0.15s;
  }
  .legend-item:not(.muted):hover,
  .legend-item.legend-active { color: rgba(255,255,255,0.9); }
  .legend-item.muted { color: rgba(255,255,255,0.2); margin-top: 4px; }

  .swatch {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  /* ── Tooltip ── */
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
