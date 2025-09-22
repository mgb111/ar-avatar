import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_API_TOKEN;

if (!OPENAI_API_KEY) {
  console.warn('[WARN] OPENAI_API_KEY is not set. Set it in backend/.env');
}

app.use(cors({
  origin: '*', // tighten this for production
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '2mb' }));

// Health check
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Chat completion proxy
app.post('/api/chat', async (req, res) => {
  try {
    const { systemPrompt, userPrompt, model } = req.body || {};
    if (!OPENAI_API_KEY) return res.status(500).json({ error: 'Server misconfigured: missing OpenAI key' });
    if (!userPrompt) return res.status(400).json({ error: 'Missing userPrompt' });

    const chatModel = model || 'gpt-4o-mini';

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: chatModel,
        messages: [
          systemPrompt ? { role: 'system', content: systemPrompt } : null,
          { role: 'user', content: userPrompt }
        ].filter(Boolean)
      })
    });

    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      return res.status(r.status).json({ error: 'OpenAI error', details: err });
    }

    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content || '';
    return res.json({ text });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Proxy error' });
  }
});

// TTS proxy -> returns audio/mpeg
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice, model } = req.body || {};
    if (!OPENAI_API_KEY) return res.status(500).json({ error: 'Server misconfigured: missing OpenAI key' });
    if (!text) return res.status(400).json({ error: 'Missing text' });

    const ttsModel = model || 'tts-1';
    const ttsVoice = voice || 'alloy';

    const r = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: ttsModel,
        input: text,
        voice: ttsVoice,
        format: 'mp3'
      })
    });

    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      return res.status(r.status).json({ error: 'OpenAI TTS error', details: err });
    }

    // Stream/pipe the audio
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    const arrayBuffer = await r.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Proxy error' });
  }
});

app.listen(port, () => {
  console.log(`Backend proxy listening on http://localhost:${port}`);
});
