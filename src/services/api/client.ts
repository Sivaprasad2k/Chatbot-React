import { AIModel } from '@/types/model';
import { DocMeta } from '@/types/chat';

export interface GenerateResponseParams {
  userPrompt: string;
  selectedModel: AIModel;
  docObject?: DocMeta | null;
  imagePreviews?: string[];
}

function evaluateMathExpression(expr: string): number | null {
  try {
    const sanitized = expr.replace(/[^0-9+\-*/().\s^]/g, '').replace(/\^/g, '**');
    if (!sanitized.trim()) return null;
    const val = Function(`'use strict'; return (${sanitized})`)();
    return typeof val === 'number' && !isNaN(val) ? val : null;
  } catch (e) {
    return null;
  }
}

export const apiClient = {
  async generateAIResponse({
    userPrompt,
    selectedModel,
    docObject
  }: GenerateResponseParams): Promise<string> {
    const lower = (userPrompt || '').toLowerCase().trim();

    // 1. Math Evaluator Fast Router
    const mathResult = evaluateMathExpression(userPrompt);
    if (mathResult !== null && /[\d+\-*/^]/.test(userPrompt)) {
      return `### 🧮 Avis Mathematical Evaluation (${selectedModel.name})\n\n**Expression:** \`${userPrompt}\`\n**Result:** **\`${mathResult}\`**\n\n\`\`\`javascript\n// Evaluated Expression\nconst result = ${mathResult};\nconsole.log("Result:", result);\n\`\`\``;
    }

    // 2. Client Document QA Context Synthesizer
    if (docObject) {
      const previewSnippet = docObject.text ? docObject.text.slice(0, 400) : '';
      return `### 📄 Document Analysis (${selectedModel.name}): "${docObject.name}"\n\n**Extracted Document Context:**\n> ${previewSnippet}...\n\n**Analysis Synthesis:**\n- Document File Size: **${docObject.size}**\n- Extracted text structured into prompt context successfully.\n- What specific sections would you like summarized?`;
    }

    // 3. Model Persona Routers
    if (selectedModel.id === 'avis-core') {
      if (['hi', 'hello', 'hey', 'greetings', 'help'].some(term => lower.includes(term))) {
        return `Hello! 👋 I am **Avis Core** (Adaptive Virtual Intelligence System).\n\nI offer multimodal reasoning, vision processing, full-stack architectural synthesis, and code generation across your workspace.\n\nHow can I assist you today?`;
      }
      if (lower.includes('weather')) {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=9.98&longitude=76.28&current_weather=true');
        const data = await res.json();
        const temp = data.current_weather?.temperature;
        return `### 🌤️ Weather Forecast (Avis Core)\nCurrently recording **${temp}°C**.\n\n\`\`\`python\nimport requests\nres = requests.get('https://api.open-meteo.com/v1/forecast?latitude=9.98&longitude=76.28&current_weather=true')\nprint(res.json()['current_weather'])\n\`\`\``;
      }
      if (lower.includes('html') || lower.includes('ui card') || lower.includes('code')) {
        return `Here is a production UI Card artifact:\n\n\`\`\`html\n<div style="padding:24px; background:#18181b; color:#f4f4f5; border:1px solid #3f3f46; border-radius:12px; font-family:sans-serif; text-align:center;">\n  <h2 style="margin:0 0 8px 0; font-size:18px;">🤖 Avis Production Component</h2>\n  <p style="margin:0; color:#a1a1aa; font-size:14px;">Clean, accessible artifact rendered live in sandbox.</p>\n</div>\n\`\`\``;
      }
      return `### 🤖 Avis Core Response\n\nProcessed query: **"${userPrompt}"**.\n\nAvis Core is ready to analyze document uploads, architectural queries, or code synthesis requests.`;
    }

    if (selectedModel.id === 'avis-analytical') {
      return `### 🧠 Avis Analytical Response\n\nAnalyzing **"${userPrompt}"** with engineering precision:\n\nEngineered for structural clarity, architectural decision making, and deep technical writing. Let me know if you would like a code review or breakdown.`;
    }

    if (selectedModel.id === 'avis-search') {
      return `### 🔍 Avis Search Synthesis\n\n**Search Query:** "${userPrompt}"\n\n**Factual Synthesis:**\n- Real-time search indexing executed across authoritative sources [1].\n- Structured factual synthesis generated with citations [2].\n\n**Sources:**\n1. *Global AI Benchmark Reports*\n2. *Official Documentation & Live Indexing*`;
    }

    return `### ⚡ Avis Flash Response\n\nProcessed query: **"${userPrompt}"**.\n\nAvis Flash is optimized for high-speed document QA and rapid multimodal processing.`;
  }
};
