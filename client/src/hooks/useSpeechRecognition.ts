import { useState, useRef, useCallback, useEffect } from 'react';

// ── Manual type definitions for Web Speech API ────────────────────────────
// These types are not part of the standard lib; we define them to avoid
// depending on external @types packages.

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEventMap {
  audioend: Event;
  audiostart: Event;
  end: Event;
  error: SpeechRecognitionErrorEventShim;
  nomatch: SpeechRecognitionEventShim;
  result: SpeechRecognitionEventShim;
  soundend: Event;
  soundstart: Event;
  speechend: Event;
  speechstart: Event;
  start: Event;
}

interface SpeechRecognitionEventShim extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEventShim extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionShim extends EventTarget {
  grammars: unknown;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventShim) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventShim) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  addEventListener<K extends keyof SpeechRecognitionEventMap>(
    type: K,
    listener: (ev: SpeechRecognitionEventMap[K]) => unknown
  ): void;
}

// Extend Window type to include browser-prefixed SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionShim;
    webkitSpeechRecognition?: new () => SpeechRecognitionShim;
  }
}

export interface UseSpeechRecognitionReturn {
  supported: boolean;
  listening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
  setTranscript: (text: string) => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const SpeechRecognitionClass =
    typeof window !== 'undefined'
      ? window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
      : null;

  const supported = SpeechRecognitionClass !== null;

  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionShim | null>(null);
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const start = useCallback(() => {
    if (!supported || !SpeechRecognitionClass) {
      setError('Reconocimiento de voz no soportado en este navegador');
      return;
    }

    // Stop any existing session
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    setError(null);
    setInterimTranscript('');
    finalTranscriptRef.current = transcript; // keep existing text

    const recognition = new SpeechRecognitionClass();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEventShim) => {
      let interim = '';
      let finalPart = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalPart += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (finalPart) {
        finalTranscriptRef.current =
          (finalTranscriptRef.current ? finalTranscriptRef.current + ' ' : '') +
          finalPart.trim();
        setTranscript(finalTranscriptRef.current);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventShim) => {
      console.warn('[Speech] Error:', event.error);
      if (event.error === 'no-speech') {
        // Not critical — just no input detected
        return;
      }
      if (event.error === 'not-allowed') {
        setError('Permiso de micrófono denegado. Usa el área de texto manual.');
      } else if (event.error === 'network') {
        setError('Error de red en reconocimiento de voz.');
      } else {
        setError(`Error de reconocimiento: ${event.error}`);
      }
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (err) {
      console.error('[Speech] Could not start:', err);
      setError('No se pudo iniciar el reconocimiento de voz');
    }
  }, [supported, SpeechRecognitionClass, transcript]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setListening(false);
    setInterimTranscript('');
  }, []);

  const reset = useCallback(() => {
    stop();
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    finalTranscriptRef.current = '';
  }, [stop]);

  const setTranscriptManual = useCallback((text: string) => {
    finalTranscriptRef.current = text;
    setTranscript(text);
  }, []);

  return {
    supported,
    listening,
    transcript,
    interimTranscript,
    error,
    start,
    stop,
    reset,
    setTranscript: setTranscriptManual,
  };
}
