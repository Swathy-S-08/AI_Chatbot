import 'dotenv/config';
import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const LOG_FILE = path.join(__dirname, 'logs', 'conversations.txt');

if (!process.env.GEMINI_API_KEY) {
  console.warn('Missing GEMINI_API_KEY. Add it to .env before chatting with Gemini.');
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

async function appendConversationLog({ userMessage, botReply }) {
  const timestamp = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    hour12: true
  });

  const entry = [
    `[${timestamp}]`,
    `User: ${userMessage}`,
    `Jarvis: ${botReply}`,
    ''
  ].join('\n');

  await fs.mkdir(path.dirname(LOG_FILE), { recursive: true });
  await fs.appendFile(LOG_FILE, `${entry}\n`, 'utf8');
}

function normalizeHistory(history = []) {
  return history
    .filter((message) => ['user', 'model'].includes(message.role) && message.text)
    .slice(-10)
    .map((message) => ({
      role: message.role,
      parts: [{ text: message.text }]
    }));
}

app.post('/api/chat', async (req, res) => {
  const userMessage = String(req.body?.message || '').trim();
  const history = normalizeHistory(req.body?.history);

  if (!userMessage) {
    return res.status(400).json({ error: 'Please enter a message first.' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: 'Gemini API key is missing. Add GEMINI_API_KEY to your .env file and restart the server.'
    });
  }

  try {
    console.log(`User: ${userMessage}`);

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        ...history,
        {
          role: 'user',
          parts: [{ text: userMessage }]
        }
      ],
      config: {
        systemInstruction:
          'You are Jarvis, a helpful, concise, friendly website assistant. Answer clearly and keep replies useful for speech playback.',
        temperature: 0.7
      }
    });

    const botReply = response.text || 'I could not generate a response. Please try again.';
    console.log(`Jarvis: ${botReply}`);

    await appendConversationLog({ userMessage, botReply });

    return res.json({ reply: botReply });
  } catch (error) {
    console.error('Gemini request failed:', error);
    return res.status(500).json({
      error: 'Jarvis could not reach Gemini right now. Check your API key, internet connection, and terminal error message.'
    });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    model: MODEL,
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY)
  });
});

app.get('/api/conversation-log', async (_req, res) => {
  try {
    await fs.mkdir(path.dirname(LOG_FILE), { recursive: true });
    await fs.access(LOG_FILE).catch(() => fs.writeFile(LOG_FILE, '', 'utf8'));
    res.download(LOG_FILE, 'jarvis-conversations.txt');
  } catch (error) {
    console.error('Could not download conversation log:', error);
    res.status(500).json({ error: 'Could not download the conversation log.' });
  }
});

app.listen(PORT, () => {
  console.log(`Jarvis Web is running at http://localhost:${PORT}`);
});
