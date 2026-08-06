import { useState, useRef, useCallback } from 'react';

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const shouldListenRef = useRef(false);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    setIsListening(false);
    setAudioLevel(0);

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close(); } catch (e) {}
      audioContextRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
  }, []);

  const startListening = useCallback(async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Web Speech Recognition is not supported in this browser. Please use Chrome, Edge, or Brave.');
      return;
    }

    if (shouldListenRef.current) {
      stopListening();
      return;
    }

    try {
      // 1. Explicitly acquire unmuted hardware media stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // 2. AudioContext decibel volume analyzer
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkVolume = () => {
        if (!shouldListenRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        requestAnimationFrame(checkVolume);
      };

      shouldListenRef.current = true;
      setIsListening(true);
      checkVolume();

      // 3. Start Web Speech Recognition session
      const startSpeechSession = () => {
        if (!shouldListenRef.current) return;

        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event: any) => {
            let liveTranscript = '';
            for (let i = 0; i < event.results.length; ++i) {
              if (event.results[i] && event.results[i][0]) {
                liveTranscript += event.results[i][0].transcript;
              }
            }
            if (liveTranscript.trim()) {
              setTranscript(liveTranscript);
            }
          };

          recognition.onerror = (event: any) => {
            console.warn('Speech Engine Warning:', event.error);
            if (event.error === 'not-allowed') {
              stopListening();
              alert('Microphone access was denied. Please allow microphone access in browser location bar.');
            }
          };

          recognition.onend = () => {
            if (shouldListenRef.current) {
              setTimeout(() => {
                if (shouldListenRef.current) startSpeechSession();
              }, 150);
            } else {
              stopListening();
            }
          };

          recognitionRef.current = recognition;
          recognition.start();
        } catch (err) {
          console.error('Speech Start Exception:', err);
          if (shouldListenRef.current) {
            setTimeout(() => {
              if (shouldListenRef.current) startSpeechSession();
            }, 300);
          }
        }
      };

      startSpeechSession();
    } catch (err) {
      console.error('Hardware getUserMedia Exception:', err);
      stopListening();
      alert('Could not access microphone hardware. Please allow microphone permissions in browser settings.');
    }
  }, [stopListening]);

  return {
    isListening,
    transcript,
    setTranscript,
    audioLevel,
    startListening,
    stopListening
  };
}
