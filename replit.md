# Record Shelf

A visual vinyl record collection browser built with SvelteKit and Vite.

## Project Overview

Record Shelf lets users browse a vinyl record collection with a "flipped" stack view (like browsing in a record store) or a grid view. It supports animated transitions, genre filtering, type-ahead search, and detailed album views.

## Tech Stack

- **Framework:** SvelteKit 2.5+ with Svelte 5
- **Build Tool:** Vite 5
- **Deployment:** Static site via `@sveltejs/adapter-static`
- **External APIs:** MusicBrainz / Cover Art Archive (album art), Google Sheets (CSV data source)
- **Package Manager:** npm

## Project Structure

```
src/
  lib/
    components/   # AlbumCard, DetailView, StackedView
    artloader.js  # Album art fetching
    data.js       # Google Sheets CSV data + sample records
  routes/
    +layout.svelte
    +page.svelte
    demo/
```

## Development

- Dev server runs on `0.0.0.0:5000`
- `npm run dev` — starts the development server
- `npm run build` — builds static output to `build/`
- `npm run preview` — preview production build

## Deployment

Configured as a **static** deployment. Build command: `npm run build`. Public directory: `build`.
