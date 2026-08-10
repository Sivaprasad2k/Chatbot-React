import type { IncomingMessage, ServerResponse } from 'http';

// Helper to parse JSON request body in Node.js HTTP serverless environment
async function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', (err) => reject(err));
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.end(JSON.stringify(data));
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const method = req.method || 'GET';

  // Handle CORS Preflight Options Request
  if (method === 'OPTIONS') {
    res.statusCode = 200;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.end();
    return;
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  // GET: Health Check Endpoint
  if (method === 'GET') {
    const isConfigured = Boolean(openaiKey || geminiKey || anthropicKey);
    return sendJson(res, 200, {
      status: isConfigured ? 'CONNECTED' : 'CONFIGURATION_MISSING',
      providers: {
        openai: Boolean(openaiKey),
        gemini: Boolean(geminiKey),
        anthropic: Boolean(anthropicKey)
      },
      activeModels: ['avis-core', 'avis-analytical', 'avis-flash', 'avis-search'],
      timestamp: Date.now()
    });
  }

  // POST: AI Inference Endpoint
  if (method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const { modelId = 'avis-core', userPrompt, docMeta, history = [] } = payload;

      if (!userPrompt || typeof userPrompt !== 'string') {
        return sendJson(res, 400, {
          error: 'INVALID_REQUEST',
          message: 'Missing or invalid userPrompt in request body.'
        });
      }

      if (!openaiKey && !geminiKey && !anthropicKey) {
        return sendJson(res, 503, {
          error: 'CONFIGURATION_MISSING',
          message: 'No server-side AI provider API keys (OPENAI_API_KEY, GEMINI_API_KEY) are configured in Vercel Environment Variables.'
        });
      }

      // Format messages history
      const formattedHistory = (Array.isArray(history) ? history : [])
        .filter((m: any) => m && m.content && !m.error)
        .map((m: any) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.content
        }));

      // Document Context Integration
      let finalUserMessage = userPrompt;
      if (docMeta && docMeta.text) {
        finalUserMessage = `[Attached Document Context: "${docMeta.name}" (${docMeta.size})]\n${docMeta.text.slice(0, 4000)}\n\n[User Query]:\n${userPrompt}`;
      }

      // 1. Google Gemini API Adapter (Avis Flash or when GEMINI_API_KEY is present for avis-flash)
      if (modelId === 'avis-flash' && geminiKey) {
        const geminiMessages = [
          ...formattedHistory.map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          })),
          { role: 'user', parts: [{ text: finalUserMessage }] }
        ];

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: geminiMessages })
          }
        );

        if (!geminiRes.ok) {
          const status = geminiRes.status;
          if (status === 401) return sendJson(res, 401, { error: 'PROVIDER_AUTHENTICATION_FAILURE', message: 'Gemini API key authentication failed.' });
          if (status === 429) return sendJson(res, 429, { error: 'RATE_LIMITED', message: 'Gemini rate limit exceeded.' });
          return sendJson(res, 500, { error: 'MODEL_PROVIDER_ERROR', message: `Gemini API returned HTTP status ${status}.` });
        }

        const geminiData = await geminiRes.json();
        const replyText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!replyText) return sendJson(res, 500, { error: 'EMPTY_RESPONSE', message: 'Gemini returned empty response text.' });

        return sendJson(res, 200, {
          reply: replyText,
          modelId,
          provider: 'Google Gemini',
          model: 'gemini-1.5-flash'
        });
      }

      // 2. OpenAI API Adapter (Avis Core, Avis Analytical, Avis Search, or General Fallback)
      if (openaiKey) {
        const targetModel = process.env.OPENAI_MODEL || 'gpt-4o';
        let systemPrompt = 'You are Avis (Adaptive Virtual Intelligence System), an advanced AI assistant built for technical reasoning, full-stack software architecture, code generation, and document analysis.';

        if (modelId === 'avis-analytical') {
          systemPrompt = 'You are Avis Analytical. Focus on deep structural engineering logic, architectural decision-making, and technical analysis.';
        } else if (modelId === 'avis-search') {
          systemPrompt = 'You are Avis Search. Provide structured, factual explanations with authoritative synthesis and clear citations where relevant.';
        }

        const openAiMessages = [
          { role: 'system', content: systemPrompt },
          ...formattedHistory,
          { role: 'user', content: finalUserMessage }
        ];

        const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: targetModel,
            messages: openAiMessages
          })
        });

        if (!openAiRes.ok) {
          const status = openAiRes.status;
          const errorData = await openAiRes.json().catch(() => ({}));
          const detail = errorData.error?.message || `HTTP ${status}`;
          if (status === 401) return sendJson(res, 401, { error: 'PROVIDER_AUTHENTICATION_FAILURE', message: `OpenAI API authentication failed: ${detail}` });
          if (status === 429) return sendJson(res, 429, { error: 'RATE_LIMITED', message: 'OpenAI rate limit reached. Please try again shortly.' });
          return sendJson(res, 500, { error: 'MODEL_PROVIDER_ERROR', message: `OpenAI returned status ${status}: ${detail}` });
        }

        const openAiData = await openAiRes.json();
        const replyText = openAiData.choices?.[0]?.message?.content;
        if (!replyText) return sendJson(res, 500, { error: 'EMPTY_RESPONSE', message: 'OpenAI returned an empty response choice.' });

        return sendJson(res, 200, {
          reply: replyText,
          modelId,
          provider: 'OpenAI',
          model: targetModel
        });
      }

      return sendJson(res, 503, {
        error: 'CONFIGURATION_MISSING',
        message: 'No active AI provider key matches the requested model profile.'
      });
    } catch (err: any) {
      return sendJson(res, 500, {
        error: 'MODEL_PROVIDER_ERROR',
        message: err?.message || 'Server error processing AI inference.'
      });
    }
  }

  return sendJson(res, 405, { error: 'INVALID_REQUEST', message: 'Method Not Allowed' });
}
