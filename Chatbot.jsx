import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import './Chatbot.css';

// Configure PDF.js Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const STORAGE_KEY = 'gemini_chat_threads';

// Signature Hybrid AI Logo Component (OpenAI Geometric Spiral + Google Gemini Sparkle Star Fusion)
const HybridAILogo = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="hybridLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10a37f" />
        <stop offset="50%" stopColor="#06b6d4" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
      <linearGradient id="hybridSparkleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#a5f3fc" />
      </linearGradient>
    </defs>

    {/* OpenAI Inspired Geometric Interlocking Spiral Ring */}
    <path
      d="M24 6C14.0589 6 6 14.0589 6 24C6 33.9411 14.0589 42 24 42C33.9411 42 42 33.9411 42 24C42 18.2 39.2 13.1 34.8 9.9"
      stroke="url(#hybridLogoGrad)"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <path
      d="M34 16C37.7 18.2 40 22.3 40 27C40 34.2 34.2 40 27 40C19.8 40 14 34.2 14 27C14 22.8 16 19.1 19.2 16.8"
      stroke="url(#hybridLogoGrad)"
      strokeWidth="3.2"
      strokeLinecap="round"
      opacity="0.85"
    />

    {/* Google Gemini Inspired 4-Pointed Sparkle Star Core */}
    <path
      d="M24 13L26.2 21.8L35 24L26.2 26.2L24 35L21.8 26.2L13 24L21.8 21.8L24 13Z"
      fill="url(#hybridSparkleGrad)"
    />
  </svg>
);

// Extract Text from PDF File Client-Side
async function extractTextFromPDF(pdfFile) {
  try {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(' ');
      fullText += `--- Page ${i} ---\n${pageText}\n\n`;
    }
    return fullText.trim();
  } catch (error) {
    console.error('PDF Parsing Error:', error);
    throw new Error('Failed to read PDF document.');
  }
}

// Base64 Converter Helper
function fileToGenerativePart(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        const base64Data = result.split(',')[1];
        resolve({
          inlineData: {
            data: base64Data,
            mimeType: file.type
          }
        });
      } else {
        reject(new Error('Failed to convert file to Base64 string.'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

const SendIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

function CodeArtifactViewer({ code, language }) {
  const [showPreview, setShowPreview] = useState(false);
  const langLower = (language || '').toLowerCase();
  const isRenderable = ['html', 'svg', 'xml'].includes(langLower);

  if (!isRenderable) return null;

  return (
    <div className="artifact-container">
      <button
        type="button"
        className="preview-toggle-btn"
        onClick={() => setShowPreview(!showPreview)}
      >
        {showPreview ? '🙈 Hide Live Preview' : '👁 Render Live Preview'}
      </button>

      {showPreview && (
        <div className="artifact-preview-box">
          {langLower === 'svg' ? (
            <div
              className="svg-preview-wrapper"
              dangerouslySetInnerHTML={{ __html: code }}
            />
          ) : (
            <iframe
              title="HTML Artifact Preview"
              srcDoc={`<!DOCTYPE html><html><head><style>body { font-family: system-ui, sans-serif; padding: 14px; color: #333; background: #fff; }</style></head><body>${code}</body></html>`}
              sandbox="allow-scripts"
              className="preview-iframe"
            />
          )}
        </div>
      )}
    </div>
  );
}

function CodeBlockWithCopy({ code, lang }) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="code-wrapper">
      <div className="code-header">
        <span>{lang || 'code'}</span>
        <button
          className={`copy-btn ${isCopied ? 'copied' : ''}`}
          onClick={handleCopy}
        >
          {isCopied ? '✓ Copied!' : '📋 Copy Code'}
        </button>
      </div>
      <pre className="code-content">
        <code>{code}</code>
      </pre>
      <CodeArtifactViewer code={code} language={lang} />
    </div>
  );
}

// Inline Markdown Helper Functions
function parseInlineFormatting(str) {
  if (!str) return '';

  const parts = str.split(/(`[^`]+`)/g);

  return parts.map((part, pIdx) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 1) {
      return <code key={pIdx} className="inline-code-pill">{part.slice(1, -1)}</code>;
    }

    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((bPart, bIdx) => {
      if (bPart.startsWith('**') && bPart.endsWith('**') && bPart.length > 3) {
        return <strong key={bIdx}>{bPart.slice(2, -2)}</strong>;
      }

      const italicParts = bPart.split(/(\*[^*]+\*)/g);
      return italicParts.map((iPart, iIdx) => {
        if (iPart.startsWith('*') && iPart.endsWith('*') && iPart.length > 1) {
          return <em key={iIdx}>{iPart.slice(1, -1)}</em>;
        }
        return iPart;
      });
    });
  });
}

function renderFormattedInlineText(text) {
  if (!text) return '';
  const lines = text.split('\n');

  return lines.map((line, lIdx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('### ')) {
      return <h3 key={lIdx} className="md-h3">{parseInlineFormatting(trimmed.slice(4))}</h3>;
    }
    if (trimmed.startsWith('## ')) {
      return <h2 key={lIdx} className="md-h2">{parseInlineFormatting(trimmed.slice(3))}</h2>;
    }
    if (trimmed.startsWith('# ')) {
      return <h1 key={lIdx} className="md-h1">{parseInlineFormatting(trimmed.slice(2))}</h1>;
    }
    if (trimmed.startsWith('> ')) {
      return <blockquote key={lIdx} className="md-blockquote">{parseInlineFormatting(trimmed.slice(2))}</blockquote>;
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return <li key={lIdx} className="md-bullet">{parseInlineFormatting(trimmed.slice(2))}</li>;
    }
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      return <li key={lIdx} className="md-num-bullet"><strong>{numMatch[1]}.</strong> {parseInlineFormatting(numMatch[2])}</li>;
    }
    if (!trimmed) return <div key={lIdx} style={{ height: '6px' }} />;

    return <div key={lIdx} className="md-line">{parseInlineFormatting(line)}</div>;
  });
}

function MarkdownMessage({ rawText }) {
  const parseSegments = (text) => {
    const regex = /```(\w*)\n?([\s\S]*?)```/g;
    const segments = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push({
          type: 'text',
          content: text.slice(lastIndex, match.index)
        });
      }
      segments.push({
        type: 'code',
        language: match[1] || 'code',
        content: match[2].trim()
      });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex)
      });
    }

    return segments;
  };

  const segments = parseSegments(rawText || '');

  return (
    <div className="markdown-body">
      {segments.map((seg, idx) => {
        if (seg.type === 'code') {
          return (
            <CodeBlockWithCopy
              key={idx}
              code={seg.content}
              lang={seg.language}
            />
          );
        }
        return (
          <div key={idx}>
            {renderFormattedInlineText(seg.content)}
          </div>
        );
      })}
    </div>
  );
}

function StreamingBotMessage({ fullText, speedMs = 18, onComplete }) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < (fullText || '').length) {
      const timer = setTimeout(() => {
        setDisplayedText((prev) => prev + fullText[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speedMs);
      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, fullText, speedMs]);

  const isStreaming = currentIndex < (fullText || '').length;

  return (
    <div>
      <MarkdownMessage rawText={displayedText} />
      {isStreaming && <span className="blinking-cursor" />}
    </div>
  );
}

export default function Chatbot() {
  const [threads, setThreads] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return [{ id: 'default', title: 'New Conversation', messages: [] }];
  });

  const [activeThreadId, setActiveThreadId] = useState(() => threads[0]?.id || 'default');
  const [inputText, setInputText] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [docMeta, setDocMeta] = useState(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedModel, setSelectedModel] = useState('GPT-4o');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);

  const unifiedInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const shouldListenRef = useRef(false);
  const chatEndRef = useRef(null);

  const availableModels = [
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', desc: 'Flagship multimodal reasoning & vision model', badge: 'OpenAI' },
    { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', desc: 'Superior coding, logic & nuanced writing', badge: 'Anthropic' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', desc: 'High-speed multimodal intelligence & document QA', badge: 'Google' },
    { id: 'perplexity-search', name: 'Perplexity Search', provider: 'Perplexity', desc: 'Real-time web search QA & citation synthesis', badge: 'Perplexity' }
  ];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  }, [threads]);

  useEffect(() => {
    if (threads.length > 0 && !threads.some(t => t.id === activeThreadId)) {
      setActiveThreadId(threads[0].id);
    }
  }, [threads, activeThreadId]);

  const currentThread = threads.find((t) => t.id === activeThreadId) || threads[0] || { id: 'default', title: 'New Conversation', messages: [] };
  const currentMessages = currentThread ? currentThread.messages : [];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, isLoading]);

  const handleSpeakMessage = (msgId, text) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-Speech is not supported in this browser.');
      return;
    }

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/```[\s\S]*?```/g, 'Code block omitted.').replace(/[*#>`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleUnifiedFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const imageBatch = [];
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        imageBatch.push(file);
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setLoadingDoc(true);
        try {
          const extractedText = await extractTextFromPDF(file);
          setDocMeta({
            name: file.name,
            size: (file.size / 1024).toFixed(1) + ' KB',
            text: extractedText
          });
        } catch (err) {
          alert('Unable to extract text from PDF document.');
        } finally {
          setLoadingDoc(false);
        }
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        setLoadingDoc(true);
        try {
          const extractedText = await file.text();
          setDocMeta({
            name: file.name,
            size: (file.size / 1024).toFixed(1) + ' KB',
            text: extractedText
          });
        } catch (err) {
          alert('Unable to read text document.');
        } finally {
          setLoadingDoc(false);
        }
      }
    }

    if (imageBatch.length > 0) {
      processFiles(imageBatch);
    }

    e.target.value = '';
  };

  const removeDoc = () => {
    setDocMeta(null);
  };

  const stopAudioHardware = () => {
    shouldListenRef.current = false;
    setIsListening(false);
    setAudioLevel(0);

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close(); } catch (e) {}
      audioContextRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
  };

  const toggleListening = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Web Speech Recognition is not supported in this browser. Please use Chrome, Edge, or Brave.');
      return;
    }

    if (shouldListenRef.current) {
      stopAudioHardware();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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

      const startSpeechSession = () => {
        if (!shouldListenRef.current) return;

        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event) => {
            let liveTranscript = '';
            for (let i = 0; i < event.results.length; ++i) {
              if (event.results[i] && event.results[i][0]) {
                liveTranscript += event.results[i][0].transcript;
              }
            }

            if (liveTranscript.trim()) {
              setInputText(liveTranscript);
            }
          };

          recognition.onerror = (event) => {
            console.warn('Speech engine warning:', event.error);
            if (event.error === 'not-allowed') {
              stopAudioHardware();
              alert('Microphone access was denied. Please allow microphone access in your browser location bar.');
            }
          };

          recognition.onend = () => {
            if (shouldListenRef.current) {
              setTimeout(() => {
                if (shouldListenRef.current) startSpeechSession();
              }, 150);
            } else {
              stopAudioHardware();
            }
          };

          recognitionRef.current = recognition;
          recognition.start();
        } catch (err) {
          console.error('Speech session exception:', err);
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
      stopAudioHardware();
      alert('Could not access microphone hardware. Please allow microphone permissions in browser location bar or Windows Privacy settings.');
    }
  };

  const processFiles = (files) => {
    const validImages = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    );

    if (validImages.length === 0) return;

    const newPreviews = validImages.map((file) => URL.createObjectURL(file));
    setImageFiles((prev) => [...prev, ...validImages]);
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (indexToRemove) => {
    URL.revokeObjectURL(previewUrls[indexToRemove]);
    setImageFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setPreviewUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const addMessageToActiveThread = (newMessage) => {
    setThreads((prevThreads) => {
      const targetId = prevThreads.some(t => t.id === activeThreadId) ? activeThreadId : (prevThreads[0]?.id || 'default');
      return prevThreads.map((thread) => {
        if (thread.id !== targetId) return thread;

        const updatedMessages = [...(thread.messages || []), newMessage];

        let updatedTitle = thread.title;
        if (thread.title === 'New Conversation' && newMessage.sender === 'user') {
          const textSnippet = newMessage.text ? newMessage.text.slice(0, 24) : (newMessage.docMeta ? newMessage.docMeta.name : 'Document Query');
          updatedTitle = textSnippet + '...';
        }

        return {
          ...thread,
          title: updatedTitle,
          messages: updatedMessages
        };
      });
    });
  };

  const markStreamingComplete = (msgId) => {
    setThreads((prevThreads) =>
      prevThreads.map((thread) => {
        if (thread.id !== activeThreadId) return thread;
        return {
          ...thread,
          messages: thread.messages.map((m) =>
            m.id === msgId ? { ...m, isStreaming: false } : m
          )
        };
      })
    );
  };

  const createNewThread = () => {
    const newId = Date.now().toString();
    const newThread = {
      id: newId,
      title: 'New Conversation',
      messages: []
    };
    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newId);
  };

  const deleteThread = (threadId, e) => {
    if (e) e.stopPropagation();
    setThreads((prev) => {
      const filtered = prev.filter((t) => t.id !== threadId);
      return filtered.length ? filtered : [{ id: Date.now().toString(), title: 'New Conversation', messages: [] }];
    });
    if (activeThreadId === threadId) {
      setActiveThreadId(threads[0]?.id || 'default');
    }
  };

  const evaluateMathExpression = (expr) => {
    try {
      const sanitized = expr.replace(/[^0-9+\-*/().\s^]/g, '').replace(/\^/g, '**');
      if (!sanitized.trim()) return null;
      const val = Function(`'use strict'; return (${sanitized})`)();
      return typeof val === 'number' && !isNaN(val) ? val : null;
    } catch (e) {
      return null;
    }
  };

  const generateAIResponse = async (userPrompt, chatHistory, imageParts = [], docObject = null) => {
    const lower = (userPrompt || '').toLowerCase().trim();

    const mathResult = evaluateMathExpression(userPrompt);
    if (mathResult !== null && /[\d+\-*/^]/.test(userPrompt)) {
      return `### 🧮 Mathematical Evaluation (${selectedModel})\n\n**Calculation:** \`${userPrompt}\`\n**Result:** **\`${mathResult}\`**\n\n\`\`\`javascript\n// Evaluated Expression\nconst result = ${mathResult};\nconsole.log(result);\n\`\`\``;
    }

    if (docObject) {
      const previewSnippet = docObject.text ? docObject.text.slice(0, 400) : '';
      return `### 📄 Document Analysis (${selectedModel}): "${docObject.name}"\n\n**Extracted Document Context:**\n> ${previewSnippet}...\n\n**Key Synthesis:**\n- Analyzed Document Size: **${docObject.size}**\n- Extracted text structured into prompt context.\n- Feel free to ask specific questions about this document!`;
    }

    if (selectedModel === 'GPT-4o') {
      if (['hi', 'hello', 'hey', 'greetings', 'help'].some(term => lower.includes(term))) {
        return `Hello! 👋 I am **GPT-4o** by OpenAI.\n\nI deliver high-precision reasoning, vision multimodal processing, and full-stack code synthesis across your workflow.\n\nHow can I help you today?`;
      }
      if (lower.includes('weather')) {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=9.98&longitude=76.28&current_weather=true');
        const data = await res.json();
        const temp = data.current_weather?.temperature;
        return `### 🌤️ Weather Forecast (GPT-4o)\nThe current temperature is **${temp}°C**.\n\n\`\`\`python\n# GPT-4o Python Fetch Snippet\nimport requests\nres = requests.get('https://api.open-meteo.com/v1/forecast?latitude=9.98&longitude=76.28&current_weather=true')\nprint(res.json()['current_weather'])\n\`\`\``;
      }
      if (lower.includes('news')) {
        return `### 📰 OpenAI Tech Highlights\n- **GPT-4o Omni Integration**: Audio, vision, and text processing in real time.\n- **React 19 Server Actions**: Zero-bundle size backend executions.\n\n\`\`\`tsx\n// GPT-4o Optimized Server Action\nexport async function handleAction(formData: FormData) {\n  'use server';\n  return { success: true };\n}\n\`\`\``;
      }
      if (lower.includes('html') || lower.includes('ui card') || lower.includes('show html') || lower.includes('code')) {
        return `Here is an OpenAI GPT-4o styled UI Card artifact:\n\n\`\`\`html\n<div style="padding:24px; background:linear-gradient(135deg, #10a37f, #059669); color:white; border-radius:16px; font-family:sans-serif; text-align:center; box-shadow: 0 10px 30px rgba(16,163,127,0.3);">\n  <h2 style="margin:0 0 10px 0;">🤖 OpenAI GPT-4o Artifact</h2>\n  <p style="margin:0; opacity:0.9;">High-precision UI component rendered live!</p>\n</div>\n\`\`\``;
      }
      return `### 🤖 GPT-4o Response\n\nI have processed your query: **"${userPrompt}"**.\n\nGPT-4o excels at multi-step reasoning, mathematical modeling, vision processing, and code synthesis. Feel free to attach images or documents!`;
    }

    if (selectedModel === 'Claude 3.5 Sonnet') {
      if (['hi', 'hello', 'hey', 'greetings', 'help'].some(term => lower.includes(term))) {
        return `Greetings! 🧠 I am **Claude 3.5 Sonnet** by Anthropic.\n\nI specialize in deep analytical writing, software engineering, and high-precision logic synthesis.\n\nWhat complex task shall we tackle today?`;
      }
      if (lower.includes('weather')) {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=9.98&longitude=76.28&current_weather=true');
        const data = await res.json();
        const temp = data.current_weather?.temperature;
        return `### 🌤️ Weather Analysis (Claude 3.5 Sonnet)\nCurrently recording **${temp}°C**.\n\n\`\`\`typescript\ninterface WeatherResponse {\n  temperature: number;\n  windspeed: number;\n}\n\`\`\``;
      }
      if (lower.includes('html') || lower.includes('ui card') || lower.includes('show html') || lower.includes('code')) {
        return `Here is a Claude 3.5 Sonnet styled UI Card artifact:\n\n\`\`\`html\n<div style="padding:24px; background:linear-gradient(135deg, #d97706, #b45309); color:white; border-radius:16px; font-family:sans-serif; text-align:center; box-shadow: 0 10px 30px rgba(217,119,6,0.3);">\n  <h2 style="margin:0 0 10px 0;">🧠 Claude 3.5 Sonnet Artifact</h2>\n  <p style="margin:0; opacity:0.9;">High-elegance code artifact rendered live!</p>\n</div>\n\`\`\``;
      }
      return `### 🧠 Claude 3.5 Sonnet Response\n\nAnalyzing **"${userPrompt}"** with analytical rigor:\n\nClaude 3.5 Sonnet is engineered for nuanced reasoning and architectural logic. Let me know if you would like code architecture or detailed breakdowns.`;
    }

    if (selectedModel === 'Perplexity Search') {
      if (['hi', 'hello', 'hey', 'greetings', 'help'].some(term => lower.includes(term))) {
        return `Hello! 🔍 I am **Perplexity Search AI**.\n\nI combine LLMs with real-time web search indexing to deliver factual answers complete with live citations.\n\nWhat search query can I answer for you?`;
      }
      return `### 🔍 Perplexity Search Synthesis\n\n**Search Query:** "${userPrompt}"\n\n**Key Findings & Analysis:**\n- Real-time search indexing executed across authoritative sources [1].\n- Structured factual synthesis generated with citations [2].\n\n**Sources:**\n1. *Global AI Benchmark Reports 2026*\n2. *Official Documentation & Live Indexing*`;
    }

    if (['hi', 'hello', 'hey', 'greetings', 'help'].some(term => lower.includes(term))) {
      return `Hello! ⚡ I am **Gemini 2.5 Flash** powered by Google AI.\n\nI offer lightning-fast multimodal reasoning, PDF document extraction, and vision analysis.\n\nHow can I help you today?`;
    }

    if (lower.includes('weather')) {
      const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=9.98&longitude=76.28&current_weather=true');
      const data = await res.json();
      const temp = data.current_weather?.temperature;
      return `The current temperature is **${temp}°C**.\n\n\`\`\`javascript\nasync function getWeather() {\n  const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=9.98&longitude=76.28&current_weather=true');\n  const data = await res.json();\n  console.log("Temp:", data.current_weather.temperature);\n}\ngetWeather();\n\`\`\``;
    }

    if (lower.includes('html') || lower.includes('ui card') || lower.includes('show html') || lower.includes('code')) {
      return `Here is a live HTML UI Card component artifact preview:\n\n\`\`\`html\n<div style="padding:20px; background:linear-gradient(135deg, #10a37f, #6366f1); color:white; border-radius:12px; font-family:sans-serif; text-align:center;">\n  <h2 style="margin:0 0 8px 0;">⚡ Gemini 2.5 Flash Card</h2>\n  <p style="margin:0;">Live HTML Code Artifact rendered directly in chat!</p>\n</div>\n\`\`\``;
    }

    return `### ⚡ Gemini 2.5 Flash Response\n\nProcessed query: **"${userPrompt}"**.\n\nGemini 2.5 Flash is ready to analyze document uploads, audio speech, or visual inputs!`;
  };

  const handleSubmit = async (e, textOverride) => {
    if (e) e.preventDefault();
    const query = textOverride || inputText;

    if ((!query.trim() && imageFiles.length === 0 && !docMeta) || isLoading) return;

    if (shouldListenRef.current) {
      stopAudioHardware();
    }

    const currentFiles = [...imageFiles];
    const currentPreviews = [...previewUrls];
    const currentDoc = docMeta ? { ...docMeta } : null;

    setInputText('');
    setImageFiles([]);
    setPreviewUrls([]);
    setDocMeta(null);
    setIsLoading(true);

    try {
      const base64Payloads = await Promise.all(
        currentFiles.map((file) => fileToGenerativePart(file))
      );

      const userMsg = {
        id: Date.now(),
        sender: 'user',
        text: query,
        previews: currentPreviews,
        docMeta: currentDoc
      };
      addMessageToActiveThread(userMsg);

      const botReplyText = await generateAIResponse(query, currentMessages, base64Payloads, currentDoc);

      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: botReplyText,
        isStreaming: true
      };

      addMessageToActiveThread(botMsg);
    } catch (err) {
      console.error("Submission Error:", err);
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: `⚠️ An error occurred: ${err.message || 'Unknown error'}. Please try sending again!`,
        isStreaming: false
      };
      addMessageToActiveThread(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-layout">
      {/* Abstract Frosted Glass Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? '' : 'collapsed'}`}>
        <div className="sidebar-brand-header">
          <HybridAILogo size={28} />
          <span>AI Assistant Pro</span>
        </div>

        <button onClick={createNewThread} className="new-chat-btn">
          <span className="new-chat-icon">+</span> New chat
        </button>

        <div className="sidebar-section-title">Recent</div>
        <div className="thread-list">
          {threads.map((thread) => (
            <div
              key={thread.id}
              className={`thread-item ${thread.id === activeThreadId ? 'active' : ''}`}
              onClick={() => setActiveThreadId(thread.id)}
            >
              <span className="thread-icon">💬</span>
              <span className="thread-title">{thread.title}</span>
              <button
                className="delete-thread-btn"
                onClick={(e) => deleteThread(thread.id, e)}
                title="Delete chat thread"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Abstract Main Interface */}
      <main className="chat-main">
        <header className="chat-header">
          <div className="header-left">
            <button
              className="sidebar-toggle-btn"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title="Toggle Sidebar"
            >
              ☰
            </button>
            <div className="model-selector-container">
              <div
                className="model-selector-badge"
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              >
                <HybridAILogo size={18} />
                <span>{selectedModel} ▾</span>
              </div>

              {isModelDropdownOpen && (
                <div className="model-dropdown-menu">
                  {availableModels.map((model) => (
                    <div
                      key={model.id}
                      className={`model-option-item ${selectedModel === model.name ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedModel(model.name);
                        setIsModelDropdownOpen(false);
                      }}
                    >
                      <div className="model-option-header">
                        <span>{model.name}</span>
                        <span className="model-option-tag">
                          {model.badge}
                        </span>
                      </div>
                      <div className="model-option-desc">{model.desc}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Ultra-Clean Minimalist Hero View OR Chat Stream */}
        {currentMessages.length === 0 ? (
          <div className="welcome-hero">
            <div className="hero-icon-wrapper">
              <HybridAILogo size={42} />
            </div>
            <h1 className="hero-title">What can I help with today?</h1>
          </div>
        ) : (
          <div className="chat-stream">
            {currentMessages.map((msg) => {
              return (
                <div key={msg.id} className={`message-row ${msg.sender}`}>
                  {msg.sender === 'bot' && (
                    <div className="bot-avatar">
                      <HybridAILogo size={20} />
                    </div>
                  )}
                  <div className="message-body">
                    <div className="message-content">
                      {msg.docMeta && (
                        <div className="doc-chip bubble-doc">
                          <span className="doc-icon">📄</span>
                          <div className="doc-info">
                            <span className="doc-name">{msg.docMeta.name}</span>
                            <span className="doc-size">{msg.docMeta.size}</span>
                          </div>
                        </div>
                      )}
                      {msg.previews && msg.previews.length > 0 && (
                        <div className="bubble-image-grid">
                          {msg.previews.map((src, i) => (
                            <img key={i} src={src} alt="User attachment" className="bubble-img" />
                          ))}
                        </div>
                      )}
                      {msg.sender === 'bot' ? (
                        msg.isStreaming ? (
                          <StreamingBotMessage
                            fullText={msg.text}
                            onComplete={() => markStreamingComplete(msg.id)}
                          />
                        ) : (
                          <MarkdownMessage rawText={msg.text} />
                        )
                      ) : (
                        msg.text
                      )}
                    </div>

                    {/* Bot Action Bar with TTS Audio Speaker Button */}
                    {msg.sender === 'bot' && (
                      <div className="message-actions-bar">
                        <button
                          className={`tts-speak-btn ${speakingMsgId === msg.id ? 'active-speech' : ''}`}
                          onClick={() => handleSpeakMessage(msg.id, msg.text)}
                          title="Read response aloud (Text-to-Speech)"
                        >
                          {speakingMsgId === msg.id ? '⏹️ Stop Voice' : '🔊 Listen'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="message-row bot">
                <div className="bot-avatar pulse">
                  <HybridAILogo size={20} />
                </div>
                <div className="message-content loading-text">
                  {selectedModel} is thinking...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}

        {/* Floating Input Zone */}
        <footer className="input-wrapper">
          <div
            className={`vision-drop-zone ${isDragging ? 'dragging-active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Live Audio Decibel Wave Indicator */}
            {isListening && (
              <div className="audio-wave-meter">
                <span>🎙️ Mic Live</span>
                <div className="audio-bar-container">
                  <div className="audio-bar" style={{ height: `${Math.max(6, Math.min(22, audioLevel * 0.4))}px` }} />
                  <div className="audio-bar" style={{ height: `${Math.max(8, Math.min(26, audioLevel * 0.6))}px` }} />
                  <div className="audio-bar" style={{ height: `${Math.max(6, Math.min(22, audioLevel * 0.3))}px` }} />
                </div>
              </div>
            )}

            {/* Document Attachment Chip */}
            {loadingDoc && <div className="doc-loader">📄 Parsing document...</div>}

            {docMeta && !loadingDoc && (
              <div className="doc-attachment-container">
                <div className="doc-chip">
                  <span className="doc-icon">📄</span>
                  <div className="doc-info">
                    <span className="doc-name">{docMeta.name}</span>
                    <span className="doc-size">{docMeta.size}</span>
                  </div>
                  <button
                    type="button"
                    className="doc-remove-btn"
                    onClick={removeDoc}
                    disabled={isLoading}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Image Preview Strip */}
            {previewUrls.length > 0 && (
              <div className="preview-strip">
                {previewUrls.map((url, idx) => (
                  <div key={`${url}-${idx}`} className="preview-card">
                    <img src={url} alt={`Attachment ${idx + 1}`} />
                    <button
                      type="button"
                      className="remove-img-btn"
                      onClick={() => removeImage(idx)}
                      aria-label="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="input-form-row">
              <button
                type="button"
                className="icon-attach-btn"
                onClick={() => unifiedInputRef.current?.click()}
                title="Attach Images, PDF or Text files"
              >
                📎
              </button>

              <button
                type="button"
                className={`icon-mic-btn ${isListening ? 'listening-pulse' : ''}`}
                onClick={toggleListening}
                title={isListening ? 'Stop listening' : 'Voice Input (Mic)'}
              >
                🎙️
              </button>

              <input
                ref={unifiedInputRef}
                type="file"
                accept="image/*,.pdf,.txt"
                multiple
                onChange={handleUnifiedFileSelect}
                style={{ display: 'none' }}
              />

              <input
                type="text"
                className="main-text-input"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  isListening
                    ? '🎙️ Listening to your voice... speak now...'
                    : isDragging
                    ? 'Drop files here...'
                    : `Ask ${selectedModel} anything, attach files or drop images...`
                }
                disabled={isLoading}
              />

              <button
                type="submit"
                className={`send-payload-btn ${(inputText.trim() || imageFiles.length > 0 || docMeta) ? 'active' : ''}`}
                disabled={
                  (!inputText.trim() && imageFiles.length === 0 && !docMeta) || isLoading
                }
              >
                <SendIcon />
              </button>
            </form>
          </div>
        </footer>
      </main>
    </div>
  );
}
