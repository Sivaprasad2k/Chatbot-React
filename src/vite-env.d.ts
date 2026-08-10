/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AVIS_API_ENDPOINT?: string;
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_ANTHROPIC_API_KEY?: string;
  readonly VITE_AVIS_ENV?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
