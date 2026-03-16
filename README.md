# Record Shelf

A visual vinyl record collection browser. Flip through your records the way you would at the store.

![Record Shelf stacked view](https://raw.githubusercontent.com/lindsay-pettingill/record-shelf/main/preview.png)

## Features

- **Stacked view** — diagonal card stack with hover-to-preview and click-to-open
- **Grid view** — album art grid with scatter/reform animation on filter changes
- **Genre filtering** — chip-based filter with animated transitions
- **Type-ahead search** — searches artist, album, and year
- **Detail modal** — full album view with related records by artist and genre
- **Live data** — pulls from a Google Sheet; falls back to sample data

## Stack

- [SvelteKit](https://kit.svelte.dev/) (adapter-static, no SSR)
- Album art via [MusicBrainz](https://musicbrainz.org/) + [Cover Art Archive](https://coverartarchive.org/)
- Data from Google Sheets (CSV export endpoint)

## Getting Started

```bash
npm install
npm run dev
```

App runs at `http://localhost:5888`.

## Data Source

Records are loaded from a Google Sheet at startup. To use your own collection:

1. Create a Google Sheet with columns: `artist`, `album`, `year`, `genre`, `format`, `tags`, `notes`
2. Make it publicly accessible (File → Share → Anyone with the link)
3. Replace `SHEET_ID` in `src/lib/data.js` with your sheet's ID

If the sheet is unavailable, the app falls back to the built-in sample collection.

## License

[CC BY-NC 4.0](./LICENSE) — free to use and adapt, not for commercial purposes.
