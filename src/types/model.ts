export type ProviderName = 'OpenAI' | 'Anthropic' | 'Google' | 'Perplexity';

export interface AIModel {
  id: string;
  name: string;
  provider: ProviderName;
  description: string;
  badge: string;
  supportsVision: boolean;
  supportsDocuments: boolean;
  contextWindow: string;
}

export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: 'avis-core',
    name: 'Avis Core',
    provider: 'OpenAI',
    description: 'Flagship multimodal reasoning, vision & full-stack code synthesis',
    badge: 'GPT-4o',
    supportsVision: true,
    supportsDocuments: true,
    contextWindow: '128k tokens'
  },
  {
    id: 'avis-analytical',
    name: 'Avis Analytical',
    provider: 'Anthropic',
    description: 'Deep structural engineering, architectural logic & nuanced analysis',
    badge: 'Claude 3.5',
    supportsVision: true,
    supportsDocuments: true,
    contextWindow: '200k tokens'
  },
  {
    id: 'avis-flash',
    name: 'Avis Flash',
    provider: 'Google',
    description: 'High-speed multimodal intelligence & client document QA',
    badge: 'Gemini 2.5',
    supportsVision: true,
    supportsDocuments: true,
    contextWindow: '1M tokens'
  },
  {
    id: 'avis-search',
    name: 'Avis Search',
    provider: 'Perplexity',
    description: 'Real-time factual web search QA & live citation synthesis',
    badge: 'Search AI',
    supportsVision: false,
    supportsDocuments: false,
    contextWindow: '32k tokens'
  }
];
