export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_API_TOKEN;
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Server misconfigured: missing OpenAI key' });
  }

  try {
    const { text, voice, model } = req.body || {};
    if (!text) return res.status(400).json({ error: 'Missing text' });

    const ttsModel = model || 'tts-1';
    const ttsVoice = voice || 'alloy';

    const r = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({ model: ttsModel, input: text, voice: ttsVoice, format: 'mp3' })
    });

    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      return res.status(r.status).json({ error: 'OpenAI TTS error', details: err });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    const arrayBuffer = await r.arrayBuffer();
    return res.status(200).send(Buffer.from(arrayBuffer));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Proxy error' });
  }
}
