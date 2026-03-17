import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '$env/static/private';
import { json, error } from '@sveltejs/kit';

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

export async function POST({ request }) {
  const { query, records } = await request.json();

  if (!query?.trim() || !records?.length) {
    throw error(400, 'Missing query or records');
  }

  const list = records
    .map(r => `${r.id}|${r.artist}|${r.album}|${r.year || ''}|${r.genre || ''}`)
    .join('\n');

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are helping someone browse their vinyl record collection.

Their collection:
${list}

Their request: "${query}"

Return the records that best match this request. Consider genre, mood, era, artist connections, sonic similarity, lyrical themes — whatever is most relevant to the query.

Respond with ONLY a JSON array (no markdown, no explanation outside the JSON):
[{"id": "record_id", "reason": "one short sentence why this fits"}, ...]

Include 3–8 matches. If nothing fits well, return an empty array [].`
    }]
  });

  const text = message.content[0].text.trim();

  try {
    const results = JSON.parse(text);
    return json({ results });
  } catch {
    // Claude sometimes adds stray text — try to extract the JSON array
    const match = text.match(/\[[\s\S]*\]/);
    if (match) return json({ results: JSON.parse(match[0]) });
    return json({ results: [] });
  }
}
