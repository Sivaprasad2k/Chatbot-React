import type { IncomingMessage, ServerResponse } from 'http';

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

function sendJson(req: IncomingMessage, res: ServerResponse, statusCode: number, data: any) {
  const origin = (req.headers.origin as string) || (req.headers.host ? `https://${req.headers.host}` : '*');
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.end(JSON.stringify(data));
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const method = req.method || 'GET';

  // Handle CORS Preflight OPTIONS Request
  if (method === 'OPTIONS') {
    const origin = (req.headers.origin as string) || '*';
    res.statusCode = 200;
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.end();
    return;
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  // GET: Zero-Token Health Check Endpoint
  if (method === 'GET') {
    const isConfigured = Boolean(openaiKey || geminiKey || anthropicKey);
    return sendJson(req, res, 200, {
      status: isConfigured ? 'READY' : 'CONFIGURATION_MISSING',
      backendReachable: true,
      providerConfigured: isConfigured,
      providers: {
        openai: Boolean(openaiKey),
        gemini: Boolean(geminiKey),
        anthropic: Boolean(anthropicKey)
      },
      activeModels: ['avis-core', 'avis-analytical', 'avis-flash', 'avis-search'],
      timestamp: Date.now()
    });
  }

  // POST: AI Inference Handler
  if (method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const { modelId = 'avis-core', userPrompt, docMeta, history = [] } = payload;

      if (!userPrompt || typeof userPrompt !== 'string' || !userPrompt.trim()) {
        return sendJson(req, res, 400, {
          error: 'INVALID_REQUEST',
          message: 'Missing or empty userPrompt in request payload.'
        });
      }

      if (!openaiKey && !geminiKey && !anthropicKey) {
        return sendJson(req, res, 503, {
          error: 'CONFIGURATION_MISSING',
          message: 'No server-side AI provider API keys (OPENAI_API_KEY, GEMINI_API_KEY) are configured in Vercel Environment Variables.'
        });
      }

      // Sanitize and format conversation history
      const formattedHistory = (Array.isArray(history) ? history : [])
        .filter((m: any) => m && m.content && !m.error)
        .map((m: any) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.content
        }));

      // Document Context Integration & Truncation (Max 8,000 chars ~ 2,000 tokens)
      let finalUserMessage = userPrompt;
      if (docMeta && docMeta.text) {
        const docTextSnippet = docMeta.text.length > 8000
          ? `${docMeta.text.slice(0, 8000)}\n[... document context truncated at 8,000 characters ...]`
          : docMeta.text;
        finalUserMessage = `[Attached Document Context: "${docMeta.name}" (${docMeta.size})]\n${docTextSnippet}\n\n[User Query]:\n${userPrompt}`;
      }

      // Adapter 1: Anthropic API (Avis Analytical when ANTHROPIC_API_KEY is configured)
      if (modelId === 'avis-analytical' && anthropicKey) {
        const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 2048,
            system: 'You are Avis Analytical. Focus on deep structural engineering logic, architectural decision-making, code reviews, and nuanced analysis.',
            messages: [
              ...formattedHistory.map((m: any) => ({
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: m.content
              })),
              { role: 'user', content: finalUserMessage }
            ]
          })
        });

        if (!anthropicRes.ok) {
          const status = anthropicRes.status;
          if (status === 401) return sendJson(req, res, 401, { error: 'PROVIDER_AUTHENTICATION_FAILURE', message: 'Anthropic API key authentication failed.' });
          if (status === 429) return sendJson(req, res, 429, { error: 'RATE_LIMITED', message: 'Anthropic rate limit exceeded.' });
          return sendJson(req, res, 500, { error: 'MODEL_PROVIDER_ERROR', message: `Anthropic API returned status ${status}.` });
        }

        const anthropicData = await anthropicRes.json();
        const replyText = anthropicData.content?.[0]?.text;
        if (!replyText) return sendJson(req, res, 500, { error: 'EMPTY_RESPONSE', message: 'Anthropic API returned empty message content.' });

        return sendJson(req, res, 200, {
          reply: replyText,
          modelId,
          provider: 'Anthropic',
          model: 'claude-3-5-sonnet-20241022'
        });
      }

      // Adapter 2: Google Gemini API (Avis Flash when GEMINI_API_KEY is configured)
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
          if (status === 401) return sendJson(req, res, 401, { error: 'PROVIDER_AUTHENTICATION_FAILURE', message: 'Gemini API key authentication failed.' });
          if (status === 429) return sendJson(req, res, 429, { error: 'RATE_LIMITED', message: 'Gemini rate limit exceeded.' });
          return sendJson(req, res, 500, { error: 'MODEL_PROVIDER_ERROR', message: `Gemini API returned status ${status}.` });
        }

        const geminiData = await geminiRes.json();
        const replyText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!replyText) return sendJson(req, res, 500, { error: 'EMPTY_RESPONSE', message: 'Gemini returned empty response text.' });

        return sendJson(req, res, 200, {
          reply: replyText,
          modelId,
          provider: 'Google Gemini',
          model: 'gemini-1.5-flash'
        });
      }

      // Adapter 3: OpenAI API (Avis Core, Avis Search, or General Provider Fallback)
      if (openaiKey) {
        const targetModel = process.env.OPENAI_MODEL || 'gpt-4o';
        let systemPrompt = 'You are Avis (Adaptive Virtual Intelligence System), an advanced AI assistant built for technical reasoning, full-stack software architecture, code generation, and document analysis.';

        if (modelId === 'avis-analytical') {
          systemPrompt = 'You are Avis Analytical. Focus on deep structural engineering logic, architectural decision-making, and technical analysis.';
        } else if (modelId === 'avis-search') {
          systemPrompt = 'You are Avis Search. Provide structured, factual explanations with authoritative synthesis and clear citations where relevant.';
        } else if (modelId === 'avis-flash') {
          systemPrompt = 'You are Avis Flash. Optimized for high-speed, concise, and precise responses.';
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
          if (status === 401) return sendJson(req, res, 401, { error: 'PROVIDER_AUTHENTICATION_FAILURE', message: `OpenAI API authentication failed: ${detail}` });
          if (status === 429) return sendJson(req, res, 429, { error: 'RATE_LIMITED', message: 'OpenAI rate limit reached. Please try again shortly.' });
          return sendJson(req, res, 500, { error: 'MODEL_PROVIDER_ERROR', message: `OpenAI returned status ${status}: ${detail}` });
        }

        const openAiData = await openAiRes.json();
        const replyText = openAiData.choices?.[0]?.message?.content;
        if (!replyText) return sendJson(req, res, 500, { error: 'EMPTY_RESPONSE', message: 'OpenAI returned an empty response choice.' });

        return sendJson(req, res, 200, {
          reply: replyText,
          modelId,
          provider: 'OpenAI',
          model: targetModel
        });
      }

      return sendJson(req, res, 503, {
        error: 'CONFIGURATION_MISSING',
        message: 'No active AI provider key matches the requested model profile.'
      });
    } catch (err: any) {
      return sendJson(req, res, 500, {
        error: 'MODEL_PROVIDER_ERROR',
        message: err?.message || 'Server error processing AI inference.'
      });
    }
  }

  return sendJson(req, res, 405, { error: 'INVALID_REQUEST', message: 'Method Not Allowed' });
}
