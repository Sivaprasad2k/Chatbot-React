import React, { useState, useEffect, useRef } from 'react';
import { Edit3, Code, GraduationCap, BarChart2 } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageRow } from '@/components/chat/MessageRow';
import { InputDock } from '@/components/chat/InputDock';
import { Modal } from '@/components/ui/Modal';
import { storageService } from '@/services/storage/localStorage';
import { extractTextFromPDF } from '@/services/parsers/pdfParser';
import { apiClient } from '@/services/api/client';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { Thread, Message, DocMeta } from '@/types/chat';
import { AVAILABLE_MODELS, AIModel } from '@/types/model';

export function App() {
  const [threads, setThreads] = useState<Thread[]>(() => storageService.getThreads());
  const [activeThreadId, setActiveThreadId] = useState<string>(() => threads[0]?.id || 'default');
  const [selectedModel, setSelectedModel] = useState<AIModel>(AVAILABLE_MODELS[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [inputText, setInputText] = useState('');
  const [docMeta, setDocMeta] = useState<DocMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const { isListening, transcript, setTranscript, audioLevel, startListening, stopListening } = useSpeechRecognition();
  const { speakingMsgId, speak } = useTextToSpeech();

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    storageService.saveThreads(threads);
  }, [threads]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleNewThread();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [threads]);

  const currentThread = threads.find((t) => t.id === activeThreadId) || threads[0];
  const currentMessages = currentThread ? currentThread.messages : [];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, isLoading]);

  const handleNewThread = () => {
    const newThread: Thread = {
      id: Date.now().toString(),
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      modelId: selectedModel.id
    };
    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
  };

  const handleDeleteThread = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setThreads((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      return filtered.length ? filtered : [{
        id: Date.now().toString(),
        title: 'New Conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        modelId: selectedModel.id
      }];
    });
    if (activeThreadId === id) {
      setActiveThreadId(threads[0]?.id || 'default');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const file = files[0];
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      try {
        const text = await extractTextFromPDF(file);
        setDocMeta({
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          text
        });
      } catch (err) {
        alert('Failed to parse PDF document.');
      }
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      try {
        const text = await file.text();
        setDocMeta({
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          text
        });
      } catch (err) {
        alert('Failed to read text file.');
      }
    }
    e.target.value = '';
  };

  const handleQuickPrompt = (promptText: string) => {
    setInputText(promptText);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !docMeta) || isLoading) return;

    if (isListening) {
      stopListening();
    }

    const userQuery = inputText;
    const currentDoc = docMeta;

    setInputText('');
    setTranscript('');
    setDocMeta(null);
    setIsLoading(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: userQuery,
      timestamp: Date.now(),
      docMeta: currentDoc
    };

    setThreads((prev) =>
      prev.map((thread) => {
        if (thread.id !== activeThreadId) return thread;
        const updatedMessages = [...thread.messages, userMessage];
        const updatedTitle = thread.title === 'New Conversation' ? (userQuery.slice(0, 24) || currentDoc?.name || 'Conversation') : thread.title;
        return { ...thread, title: updatedTitle, messages: updatedMessages, updatedAt: Date.now() };
      })
    );

    try {
      const responseText = await apiClient.generateAIResponse({
        userPrompt: userQuery,
        selectedModel,
        docObject: currentDoc
      });

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        content: responseText,
        timestamp: Date.now(),
        modelId: selectedModel.id
      };

      setThreads((prev) =>
        prev.map((thread) => {
          if (thread.id !== activeThreadId) return thread;
          return { ...thread, messages: [...thread.messages, botMessage], updatedAt: Date.now() };
        })
      );
    } catch (err) {
      console.error('Submission Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        threads={threads}
        activeThreadId={activeThreadId}
        isOpen={isSidebarOpen}
        onSelectThread={setActiveThreadId}
        onNewThread={handleNewThread}
        onDeleteThread={handleDeleteThread}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <ChatHeader
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
        />

        {currentMessages.length === 0 ? (
          <div className="welcome-hero-box">
            <div className="welcome-logo-badge">
              <span style={{ fontSize: 32, fontWeight: 800, background: 'linear-gradient(135deg, var(--accent-emerald), var(--accent-cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                A
              </span>
            </div>
            <h1 className="welcome-hero-title">
              Avis
            </h1>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 20 }}>
              ADAPTIVE VIRTUAL INTELLIGENCE SYSTEM
            </p>
            <h2 style={{ fontSize: 24, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 32, letterSpacing: '-0.02em' }}>
              What can I help you with today?
            </h2>

            {/* 4 Feature Quick Prompt Cards */}
            <div className="feature-card-grid">
              <div className="feature-card" onClick={() => handleQuickPrompt('Write a technical RFC document for a microservices migration')}>
                <div className="feature-card-icon"><Edit3 size={16} /></div>
                <div className="feature-card-title">Write</div>
                <div className="feature-card-desc">Draft technical docs, RFCs, emails and proposals</div>
              </div>
              <div className="feature-card" onClick={() => handleQuickPrompt('Debug React custom hook performance and render bottlenecks')}>
                <div className="feature-card-icon"><Code size={16} /></div>
                <div className="feature-card-title">Code</div>
                <div className="feature-card-desc">Refactor code, debug errors, explain algorithms</div>
              </div>
              <div className="feature-card" onClick={() => handleQuickPrompt('Explain how B-Tree database indexes work with examples')}>
                <div className="feature-card-icon"><GraduationCap size={16} /></div>
                <div className="feature-card-title">Learn</div>
                <div className="feature-card-desc">Explore system design, algorithms & concepts</div>
              </div>
              <div className="feature-card" onClick={() => handleQuickPrompt('Analyze PDF document structure and summarize key findings')}>
                <div className="feature-card-icon"><BarChart2 size={16} /></div>
                <div className="feature-card-title">Analyze</div>
                <div className="feature-card-desc">Extract insights from PDF documents and data</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="chat-stream-viewport">
            {currentMessages.map((msg) => (
              <MessageRow
                key={msg.id}
                message={msg}
                speakingMsgId={speakingMsgId}
                onSpeak={speak}
              />
            ))}
            {isLoading && (
              <div className="loading-indicator-row">
                <div className="bot-avatar-icon">A</div>
                <div className="loading-indicator-text">
                  {selectedModel.name} is reasoning...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}

        <InputDock
          inputText={inputText}
          onChangeText={setInputText}
          onSubmit={handleSubmit}
          isListening={isListening}
          audioLevel={audioLevel}
          onToggleListening={startListening}
          onFileSelect={handleFileSelect}
          docMeta={docMeta}
          onRemoveDoc={() => setDocMeta(null)}
          isLoading={isLoading}
          modelName={selectedModel.name}
        />
      </div>

      <Modal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} title="About Avis">
        <div className="about-modal-body">
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Avis</strong> stands for <em>Adaptive Virtual Intelligence System</em>.
          </p>
          <p style={{ marginBottom: 12 }}>
            Engineered with a calm, minimal Liquid Glass floating dock, matte canvas, Geist typography, strict TypeScript architecture, WCAG AA accessibility, client-side PDF analysis, and Web Speech hardware integration.
          </p>
          <div className="about-tech-pills">
            <span className="about-pill">React 18</span>
            <span className="about-pill">TypeScript 5</span>
            <span className="about-pill">Vite</span>
            <span className="about-pill">Vercel Ready</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
