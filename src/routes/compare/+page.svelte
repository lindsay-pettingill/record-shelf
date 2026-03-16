<script>
  // Fake records with distinct colors for instant visual comparison
  const colors = [
    '#c0392b','#e67e22','#f1c40f','#2ecc71','#1abc9c',
    '#3498db','#9b59b6','#e91e63','#00bcd4','#8bc34a',
    '#ff5722','#607d8b','#795548','#ffc107','#03a9f4',
    '#673ab7','#4caf50','#ff9800','#2196f3','#e91e63',
  ];

  const records = colors.map((color, i) => ({ id: i, color, label: String.fromCharCode(65 + i) }));

  // Option A: large cards, wider offset
  const A = { CARD: 420, OFFSET: 44, TOP: 14, MAX: 16, label: 'A — larger cards, wider offset' };

  // Option B: smaller cards, proportionally wider offset
  const B = { CARD: 320, OFFSET: 38, TOP: 12, MAX: 16, label: 'B — smaller cards, wider sliver ratio' };

  function stackItems(cfg) {
    return records.slice(0, cfg.MAX).map((r, i) => ({
      ...r,
      tx: i * cfg.OFFSET,
      ty: i * -cfg.TOP,
      scale: Math.max(0.32, 1 - i * 0.034),
      zi: cfg.MAX - i,
    }));
  }
</script>

<div class="page">
  <h1>Stack comparison</h1>
  <p class="sub">Hover any background card to preview the pull effect</p>

  <div class="row">
    {#each [A, B] as cfg}
      <div class="col">
        <div class="col-label">{cfg.label}</div>
        <div class="stage">
          <div class="track" style="width:{cfg.CARD}px; height:{cfg.CARD}px;">
            {#each stackItems(cfg) as item}
              <div
                class="card"
                style="
                  width: {cfg.CARD}px;
                  height: {cfg.CARD}px;
                  background: {item.color};
                  --tx: {item.tx}px;
                  --ty: {item.ty}px;
                  --s: {item.scale};
                  z-index: {item.zi};
                "
              >
                <span class="lbl">{item.label}</span>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  :global(body) { background: #0a0a0a; margin: 0; }

  .page {
    min-height: 100vh;
    padding: 3rem 4rem;
    font-family: system-ui, sans-serif;
    color: #fff;
  }

  h1 {
    font-size: 1.2rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.5);
    margin: 0 0 0.25rem;
  }

  .sub {
    font-size: 12px;
    color: rgba(255,255,255,0.25);
    margin: 0 0 4rem;
    letter-spacing: 0.04em;
  }

  .row {
    display: flex;
    gap: 8rem;
    align-items: flex-end;
  }

  .col {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .col-label {
    font-size: 11px;
    color: rgba(255,255,255,0.3);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 1.5rem;
  }

  .stage {
    display: flex;
    align-items: flex-end;
    height: 560px;
    padding-bottom: 2rem;
  }

  .track {
    position: relative;
    flex-shrink: 0;
  }

  .card {
    position: absolute;
    border-radius: 6px;
    transform: translateX(var(--tx)) translateY(var(--ty)) scale(var(--s));
    transition:
      transform 0.3s cubic-bezier(0.2,0,0,1),
      filter 0.22s ease,
      box-shadow 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  /* Hover: desaturate all, lift hovered */
  .track:has(.card:hover) .card {
    filter: grayscale(65%) brightness(0.7);
    transition: filter 0.22s ease, transform 0.3s cubic-bezier(0.2,0,0,1), box-shadow 0.3s ease;
  }

  .card:hover {
    transform: translateX(var(--tx)) translateY(calc(var(--ty) - 90px)) scale(var(--s)) !important;
    filter: saturate(1.3) brightness(1.1) !important;
    z-index: 999 !important;
    box-shadow: 0 30px 70px rgba(0,0,0,0.8);
    transition:
      transform 0.15s cubic-bezier(0.15,0,0,1),
      filter 0.1s ease,
      box-shadow 0.15s ease !important;
  }

  .lbl {
    font-size: 2rem;
    font-weight: 700;
    color: rgba(255,255,255,0.35);
    user-select: none;
  }
</style>
