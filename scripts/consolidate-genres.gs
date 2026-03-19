// Paste this into Extensions → Apps Script in your Google Sheet
// Then click Run → consolidateGenres

function consolidateGenres() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => h.toLowerCase().trim());
  const genreCol = headers.indexOf('genre');

  if (genreCol === -1) {
    SpreadsheetApp.getUi().alert('Could not find a "genre" column.');
    return;
  }

  const map = {
    // Blues (own category)
    'Delta Blues':                  'Blues',

    // Post-Rock (merge Post-Rock + Experimental)
    'Post-Rock / Art Rock':         'Post-Rock',
    'Experimental/ Art Rock':       'Post-Rock',
    'Experimental/Art Rock':        'Post-Rock',

    // Jazz (absorb Free Jazz/Experimental)
    'Free Jazz/ Experimental':      'Jazz',
    'Free Jazz/Experimental':       'Jazz',

    // Indie Folk — keep, but normalise subtypes
    'Indie Folk/ Lo-Fi':            'Indie Folk',
    'Indie Folk/Lo-Fi':             'Indie Folk',
    'Indie Folk/Chamber Pop':       'Indie Folk',
    'Indie Folk/ Chamber Pop':      'Indie Folk',
    'Indie Folk/Art Pop':           'Indie Folk',
    'Indie Folk/ Art Pop':          'Indie Folk',
    'Indie Folk/Pop':               'Indie Folk',
    'Indie Folk/ Pop':              'Indie Folk',

    // Folk (consolidate all folk variants)
    'Folk Rock':                    'Folk',
    'Folk / Indie':                 'Folk',
    'Folk/Indie':                   'Folk',
    'Folk/Americana':               'Folk',
    'Folk/Americana, Rock':         'Folk',
    'Folk/Americana, Pop':          'Folk',
    'Folk/ Americana':              'Folk',
    'Folk/ Country':                'Folk',
    'Folk/Country':                 'Folk',
    'Folk/ Singer-Songwriter':      'Folk',
    'Folk/Singer-Songwriter':       'Folk',
    'Folk/Indie Pop':               'Folk',
    'Indie/ Singer-Songwriter':     'Folk',

    // Rock
    'Alt Rock':                     'Rock',
    'Heartland Rock':               'Rock',
    'Rock, Pop':                    'Rock',

    // Indie Rock
    'Indie Rock/ Post-Punk':        'Indie Rock',
    'Indie Rock/Post-Punk':         'Indie Rock',
    'Indie Rock / Pop':             'Indie Rock',
    'Indie Rock/Pop':               'Indie Rock',

    // Indie Pop
    'Dream Pop/ Indie Pop':         'Indie Pop',
    'Dream Pop/Indie Pop':          'Indie Pop',
    'Psychedelic Pop':              'Indie Pop',

    // Electronic
    'Electronic/Dance-Punk':        'Electronic',
    'Electronic/ Dance-Punk':       'Electronic',
    'Electronic/Indie Pop':         'Electronic',
    'Electronic/ Indie Pop':        'Electronic',

    // Classical
    'Classic/ Opera':               'Classical',
    'Classic/Opera':                'Classical',
    'Classical/Military':           'Classical',

    // R&B / Soul
    'Pop / R&B':                    'R&B / Soul',
    'Pop / R&B / Funk':             'R&B / Soul',
    'Pop/ R&B/ Funk':               'R&B / Soul',
    'Soul/R&B':                     'R&B / Soul',
    'Soul/R&B, Holiday':            'R&B / Soul',

    // World
    'Hawaiian / World':             'World',
    'Cuban Soul':                   'World',
    'etc':                          'World',

    // Fixes for bad data
    'Compilation':                  'Folk',   // John Prine — genre was wrong
  };

  const log = [];
  for (let i = 1; i < data.length; i++) {
    const current = data[i][genreCol];
    if (map.hasOwnProperty(current)) {
      const newVal = map[current];
      sheet.getRange(i + 1, genreCol + 1).setValue(newVal);
      log.push(`Row ${i + 1}: "${current}" → "${newVal}"`);
    }
  }

  Logger.log(log.join('\n'));
  SpreadsheetApp.getUi().alert(
    `Done! Updated ${log.length} genre values.\n\nSee View → Logs for details.`
  );
}
