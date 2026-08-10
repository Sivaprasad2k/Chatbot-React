import { AIModel } from '@/types/model';
import { DocMeta, Message } from '@/types/chat';

export interface GenerateResponseParams {
  userPrompt: string;
  selectedModel: AIModel;
  docObject?: DocMeta | null;
  imagePreviews?: string[];
  history?: Message[];
}

export interface BackendHealth {
  status: 'READY' | 'CONFIGURATION_MISSING' | 'UNAVAILABLE';
  backendReachable?: boolean;
  providerConfigured?: boolean;
  providers?: {
    openai?: boolean;
    gemini?: boolean;
    anthropic?: boolean;
  };
  activeModels?: string[];
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
  async checkHealth(): Promise<BackendHealth> {
    const endpoint = import.meta.env.VITE_AVIS_API_ENDPOINT || '/api/avis/inference';
    try {
      const res = await fetch(endpoint, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        return {
          status: data.status === 'READY' || data.status === 'CONNECTED' ? 'READY' : 'CONFIGURATION_MISSING',
          backendReachable: Boolean(data.backendReachable ?? true),
          providerConfigured: Boolean(data.providerConfigured ?? (data.status === 'CONNECTED' || data.status === 'READY')),
          providers: data.providers,
          activeModels: data.activeModels
        };
      }
      return { status: 'UNAVAILABLE', backendReachable: false, providerConfigured: false };
    } catch {
      const localKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
      if (localKey) {
        return {
          status: 'READY',
          backendReachable: true,
          providerConfigured: true,
          providers: {
            openai: Boolean(import.meta.env.VITE_OPENAI_API_KEY),
            gemini: Boolean(import.meta.env.VITE_GEMINI_API_KEY)
          }
        };
      }
      return { status: 'CONFIGURATION_MISSING', backendReachable: false, providerConfigured: false };
    }
  },

  async generateAIResponse({
    userPrompt,
    selectedModel,
    docObject,
    history = []
  }: GenerateResponseParams): Promise<string> {
    const endpoint = import.meta.env.VITE_AVIS_API_ENDPOINT || '/api/avis/inference';
    const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

    // Fast Math Evaluation Utility
    const mathResult = evaluateMathExpression(userPrompt);
    if (mathResult !== null && /^[\d\s+\-*/()^.]+$/.test(userPrompt.trim())) {
      return `### 🧮 Avis Mathematical Evaluation (${selectedModel.name})\n\n**Expression:** \`${userPrompt.trim()}\`\n**Result:** **\`${mathResult}\`**\n\n\`\`\`javascript\nconst expression = "${userPrompt.trim()}";\nconst result = ${mathResult};\nconsole.log(result);\n\`\`\``;
    }

    // 1. Primary Path: Serverless API Endpoint (/api/avis/inference)
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: selectedModel.id,
          userPrompt,
          docMeta: docObject,
          history
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.reply) return data.reply;
      }

      if (response.status === 503) {
        const data = await response.json().catch(() => ({}));
        if (data.error === 'CONFIGURATION_MISSING' && !openaiApiKey && !geminiApiKey) {
          return `### ⚠️ Avis AI Inference Backend Not Connected

**Avis is operating in frontend-only mode.** No active AI backend endpoint (\`VITE_AVIS_API_ENDPOINT\`) or server-side API key (\`OPENAI_API_KEY\` / \`GEMINI_API_KEY\`) is configured in the environment.

**To connect a real AI model backend:**
1. Configure \`OPENAI_API_KEY\` or \`GEMINI_API_KEY\` in your Vercel Environment Variables.
2. Or set \`VITE_AVIS_API_ENDPOINT\` to your backend API server URL.

*Active Selected Profile:* **${selectedModel.name}** (${selectedModel.badge})
*Document Parser & Workspace:* Fully operational.`;
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.message || `Serverless endpoint returned status ${response.status}`;
        throw new Error(message);
      }
    } catch (err: any) {
      if (err.message && !err.message.includes('Failed to fetch')) {
        throw err;
      }
    }

    // 2. Client-Side Fallback for Local Development (if VITE_OPENAI_API_KEY or VITE_GEMINI_API_KEY is set)
    if (openaiApiKey) {
      try {
        const formattedHistory = history.map((m) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.content
        }));
        let fullPrompt = userPrompt;
        if (docObject?.text) {
          fullPrompt = `[Attached Document: "${docObject.name}"]\n${docObject.text.slice(0, 4000)}\n\nQuestion:\n${userPrompt}`;
        }
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiApiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: `You are Avis (${selectedModel.name}).` },
              ...formattedHistory,
              { role: 'user', content: fullPrompt }
            ]
          })
        });
        if (res.ok) {
          const data = await res.json();
          return data.choices?.[0]?.message?.content || 'No response';
        }
      } catch {
        // Fallthrough
      }
    }

    // 3. Fallback Notice when Endpoint is unreachable and no local keys set
    return `### ⚠️ Avis AI Inference Backend Not Connected

**Avis is operating in frontend-only mode.** No active AI backend endpoint (\`VITE_AVIS_API_ENDPOINT\`) or server-side API key (\`OPENAI_API_KEY\` / \`GEMINI_API_KEY\`) is configured in the environment.

**To connect a real AI model backend:**
1. Configure \`OPENAI_API_KEY\` or \`GEMINI_API_KEY\` in your Vercel Environment Variables.
2. Or set \`VITE_AVIS_API_ENDPOINT\` to your backend API server URL.

*Active Selected Profile:* **${selectedModel.name}** (${selectedModel.badge})
*Document Parser & Workspace:* Fully operational.`;
  }
};
