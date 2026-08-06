export interface SpeechRecognitionState {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
}

export interface AudioAnalyzerState {
  audioLevel: number; // 0 to 100
  isActive: boolean;
}
