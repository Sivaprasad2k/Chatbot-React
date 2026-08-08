import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageRow } from '@/components/chat/MessageRow';
import { InputDock } from '@/components/chat/InputDock';
import { AvisLogo } from '@/components/common/AvisLogo';
import { storageService } from '@/services/storage/localStorage';
import { extractTextFromPDF } from '@/services/parsers/pdfParser';
import { apiClient } from '@/services/api/client';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { Thread, Message, DocMeta } from '@/types/chat';
import { AVAILABLE_MODELS, AIModel } from '@/types/model';

// Code-split secondary Modal dialogs out of the critical initial bundle
const Modal = lazy(() => import('@/components/ui/Modal').then((m) => ({ default: m.Modal })));

export function App() {
  const [threads, setThreads] = useState<Thread[]>(() => storageService.getThreads());
  const [activeThreadId, setActiveThreadId] = useState<string>(() => threads[0]?.id || 'default');
  const [selectedModel, setSelectedModel] = useState<AIModel>(AVAILABLE_MODELS[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [inputText, setInputText] = useState('');
  const [docMeta, setDocMeta] = useState<DocMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { isListening, transcript, setTranscript, audioLevel, startListening, stopListening } = useSpeechRecognition();
  const { speakingMsgId, speak } = useTextToSpeech();

  const chatEndRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    storageService.saveThreads(threads);
  }, [threads]);

  // Sync Visual Viewport Height for Mobile Keyboard Handling
  useEffect(() => {
    const updateViewportHeight = () => {
      const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      document.documentElement.style.setProperty('--visual-viewport-height', `${vh}px`);
    };

    updateViewportHeight();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportHeight);
      window.visualViewport.addEventListener('scroll', updateViewportHeight);
    } else {
      window.addEventListener('resize', updateViewportHeight);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewportHeight);
        window.visualViewport.removeEventListener('scroll', updateViewportHeight);
      } else {
        window.removeEventListener('resize', updateViewportHeight);
      }
    };
  }, []);

  // Native Mobile Edge Touch Swipe Gesture for Drawer Toggle
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null) return;
      const touchEndX = e.changedTouches[0].clientX;
      const deltaX = touchEndX - touchStartX.current;

      // Swipe right from left edge (start X < 30px) to open sidebar on mobile
      if (touchStartX.current < 30 && deltaX > 60) {
        setIsSidebarOpen(true);
      }
      // Swipe left anywhere when sidebar is open to close sidebar on mobile
      else if (isSidebarOpen && deltaX < -60) {
        setIsSidebarOpen(false);
      }

      touchStartX.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isSidebarOpen]);

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

  const handleNewThread = useCallback(() => {
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
  }, [selectedModel.id]);

  const handleDeleteThread = useCallback((id: string, e: React.MouseEvent) => {
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
  }, [activeThreadId, threads, selectedModel.id]);

  const handleClearThreads = useCallback(() => {
    const fresh = storageService.clearThreads();
    setThreads(fresh);
    setActiveThreadId(fresh[0].id);
  }, []);

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
        onClose={() => setIsSidebarOpen(false)}
        onSelectThread={setActiveThreadId}
        onNewThread={handleNewThread}
        onDeleteThread={handleDeleteThread}
        onClearThreads={handleClearThreads}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <div className="main-chat-container">
        <ChatHeader
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
        />

        {currentMessages.length === 0 ? (
          <div className="welcome-hero-box">
            <div className="welcome-logo-badge">
              <AvisLogo size={42} />
            </div>
            <h1 className="welcome-hero-title">
              Avis
            </h1>
            <h2 style={{ fontSize: 24, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 32, letterSpacing: '-0.02em' }}>
              What can I help you with today?
            </h2>
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
                <div className="bot-avatar-icon">
                  <AvisLogo size={16} />
                </div>
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

      <Suspense fallback={null}>
        <Modal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} title="About Avis">
          <div className="about-modal-body">
            <p style={{ marginBottom: 12 }}>
              <strong style={{ color: 'var(--text-primary)' }}>Avis</strong> stands for <em>Adaptive Virtual Intelligence System</em>.
            </p>
            <p style={{ marginBottom: 12, lineHeight: 1.55, color: 'var(--text-secondary)' }}>
              Avis is an advanced AI assistant built for high-precision technical reasoning, full-stack code generation, document analysis, and natural voice interaction.
            </p>
            <div className="about-tech-pills">
              <span className="about-pill">Multimodal Reasoning</span>
              <span className="about-pill">Code Synthesis</span>
              <span className="about-pill">Document Parsing</span>
              <span className="about-pill">Voice Hardware Integration</span>
            </div>
          </div>
        </Modal>

        <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Workspace Settings">
          <div className="about-modal-body">
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                Storage Location
              </h4>
              <p style={{ fontSize: 13.5, color: 'var(--text-primary)', margin: 0 }}>
                Client-Side LocalStorage (Private & Offline)
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                Active AI Model
              </h4>
              <p style={{ fontSize: 13.5, color: 'var(--text-primary)', margin: 0 }}>
                {selectedModel.name} <span style={{ color: 'var(--text-muted)' }}>({selectedModel.provider})</span>
              </p>
            </div>

            <div style={{ paddingTop: 14, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Avis v0.1.0</span>
              <button
                onClick={() => {
                  if (window.confirm('Clear all local conversations?')) {
                    handleClearThreads();
                    setIsSettingsOpen(false);
                  }
                }}
                style={{
                  background: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: 'var(--status-error)',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-12)',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Clear Local Storage
              </button>
            </div>
          </div>
        </Modal>
      </Suspense>
    </div>
  );
}
