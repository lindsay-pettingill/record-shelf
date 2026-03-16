<slot />

<style>
  :global(*) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(body) {
    background: #0a0a0a;
    color: #e8e8e8;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  :global(button) {
    font-family: inherit;
    cursor: pointer;
  }
</style>
