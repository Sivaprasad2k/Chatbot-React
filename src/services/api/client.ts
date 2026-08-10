import { AIModel } from '@/types/model';
import { DocMeta, Message } from '@/types/chat';

export interface GenerateResponseParams {
  userPrompt: string;
  selectedModel: AIModel;
  docObject?: DocMeta | null;
  imagePreviews?: string[];
  history?: Message[];
}

function evaluateMathExpression(expr: string): number | null {
  try {
    const sanitized = expr.replace(/[^0-9+\-*/().\s^]/g, '').replace(/\^/g, '**');
    if (!sanitized.trim()) return null;
    const val = Function(`'use strict'; return (${sanitized})`)();
    return typeof val === 'number' && !isNaN(val) ? val : null;
  } catch {
    return null;
  }
}

export const apiClient = {
  async generateAIResponse({
    userPrompt,
    selectedModel,
    docObject,
    history = []
  }: GenerateResponseParams): Promise<string> {
    const customEndpoint = import.meta.env.VITE_AVIS_API_ENDPOINT;
    const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

    // Fast Math Evaluation Utility
    const mathResult = evaluateMathExpression(userPrompt);
    if (mathResult !== null && /^[\d\s+\-*/()^.]+$/.test(userPrompt.trim())) {
      return `### 🧮 Avis Mathematical Evaluation (${selectedModel.name})\n\n**Expression:** \`${userPrompt.trim()}\`\n**Result:** **\`${mathResult}\`**\n\n\`\`\`javascript\nconst expression = "${userPrompt.trim()}";\nconst result = ${mathResult};\nconsole.log(result);\n\`\`\``;
    }

    // Prepare full conversation messages payload
    const formattedHistory = history
      .filter((m) => m.content && !m.error)
      .map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.content
      }));

    let fullPrompt = userPrompt;
    if (docObject && docObject.text) {
      fullPrompt = `[Attached Document: "${docObject.name}" (${docObject.size})]\nContext:\n${docObject.text.slice(0, 4000)}\n\nUser Question:\n${userPrompt}`;
    }

    const messages = [
      ...formattedHistory,
      { role: 'user', content: fullPrompt }
    ];

    // Case 1: Custom Avis Serverless API Endpoint configured
    if (customEndpoint && customEndpoint !== 'https://api.open-meteo.com') {
      try {
        const response = await fetch(`${customEndpoint}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: selectedModel.id,
            messages,
            docMeta: docObject
          })
        });

        if (!response.ok) {
          throw new Error(`API endpoint returned status ${response.status}`);
        }

        const data = await response.json();
        if (data.reply) return data.reply;
        if (data.choices?.[0]?.message?.content) return data.choices[0].message.content;
        throw new Error('Invalid response structure from backend endpoint.');
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Network error';
        throw new Error(`Unable to connect to Avis backend endpoint: ${errorMessage}`);
      }
    }

    // Case 2: Direct OpenAI API Key configured in client environment
    if (openaiApiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiApiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are Avis (${selectedModel.name}), an advanced AI assistant built for technical reasoning, full-stack software architecture, and document analysis.`
              },
              ...messages
            ]
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `OpenAI API returned status ${response.status}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || 'No response returned from model.';
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Network error';
        throw new Error(`OpenAI inference failed: ${errorMessage}`);
      }
    }

    // Case 3: Direct Gemini API Key configured in client environment
    if (geminiApiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: messages.map((m) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
              }))
            })
          }
        );

        if (!response.ok) {
          throw new Error(`Gemini API returned status ${response.status}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No content returned.';
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Network error';
        throw new Error(`Gemini inference failed: ${errorMessage}`);
      }
    }

    // Case 4: No Real AI Inference Backend or API Key Configured
    // Per specification (Part 4): Clearly state connection status without fake responses.
    return `### ⚠️ Avis AI Inference Backend Not Connected

**Avis is operating in frontend-only mode.** No active AI backend endpoint (\`VITE_AVIS_API_ENDPOINT\`) or API key (\`VITE_OPENAI_API_KEY\` / \`VITE_GEMINI_API_KEY\`) is configured in the environment.

**To connect a real AI model backend:**
1. Configure \`VITE_AVIS_API_ENDPOINT\` in your \`.env\` or Vercel Environment Variables pointing to your secure serverless API proxy.
2. Or set a valid provider key (\`VITE_OPENAI_API_KEY\` or \`VITE_GEMINI_API_KEY\`) for direct client API routing.

*Active Selected Profile:* **${selectedModel.name}** (${selectedModel.badge})
*Document Parser & Workspace:* Fully operational.`;
  }
};
