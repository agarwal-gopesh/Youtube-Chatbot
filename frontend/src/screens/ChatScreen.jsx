import { useState, useRef, useEffect } from 'react';
import { getChatMessages, sendChatMessage, streamChatMessage, getThumbnailUrl } from '../services/api';
import StructuredResponse from '../components/StructuredResponse';

const STARTER_PROMPTS = [
  { emoji: '⚡', label: 'Summarize key takeaways' },
  { emoji: '🕒', label: 'Extract important timestamps' },
  { emoji: '💡', label: 'Explain the main concepts' },
  { emoji: '🇮🇳', label: 'Explain in simple Hindi (आसान हिंदी में)' },
];

export default function ChatScreen({ chat, sidebarCollapsed }) {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const videoId = chat?.video_id || '';
  const videoTitle = chat?.title || `YouTube Video (${videoId})`;
  const videoUrl = chat?.url || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : '#');
  const thumbnail = getThumbnailUrl(videoId);

  // Load message history whenever chat thread changes
  useEffect(() => {
    if (!chat?.thread_id) return;

    let isCurrent = true;
    setLoadingHistory(true);
    setErrorMsg('');

    getChatMessages(chat.thread_id)
      .then((history) => {
        if (!isCurrent) return;
        if (Array.isArray(history)) {
          const formatted = history.map((m, idx) => ({
            id: `hist_${idx}_${Date.now()}`,
            role: m.role || 'assistant',
            content: m.content || '',
            time: 'Transcript sync',
          }));
          setMessages(formatted);
        }
      })
      .catch((err) => {
        if (!isCurrent) return;
        console.error('Failed to load chat history:', err);
      })
      .finally(() => {
        if (isCurrent) setLoadingHistory(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [chat?.thread_id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  async function handleSend(textToSend) {
    const question = (textToSend || inputValue).trim();
    if (!question || sending || !chat?.thread_id) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: question,
      time: timeStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setSending(true);
    setErrorMsg('');

    const aiMsgId = `ai_${Date.now()}`;
    let hasStartedStreaming = false;

    try {
      // 1. Attempt true streaming via backend SSE stream endpoint
      await streamChatMessage(chat.thread_id, question, (token) => {
        if (!hasStartedStreaming) {
          hasStartedStreaming = true;
          setMessages((prev) => [
            ...prev,
            {
              id: aiMsgId,
              role: 'assistant',
              content: token,
              time: timeStr,
              engine: 'Gemini Flash RAG',
              isStreaming: true,
            },
          ]);
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId ? { ...m, content: m.content + token } : m
            )
          );
        }
      });

      // Streaming finished cleanly
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId ? { ...m, isStreaming: false } : m
        )
      );
    } catch (streamErr) {
      console.warn('Real-time stream failed, using animated chunk reveal fallback:', streamErr);

      try {
        // Fallback: fetch via standard endpoint and reveal word-by-word / chunk-by-chunk
        const res = await sendChatMessage(chat.thread_id, question);
        const fullAnswer = res.answer || 'No answer generated.';

        const chunks = fullAnswer.match(/(\S+|\s+)/g) || [fullAnswer];
        let accumulated = '';

        setMessages((prev) => [
          ...prev,
          {
            id: aiMsgId,
            role: 'assistant',
            content: '',
            time: timeStr,
            engine: 'Gemini Flash RAG',
            isStreaming: true,
          },
        ]);

        for (let i = 0; i < chunks.length; i++) {
          accumulated += chunks[i];
          const curr = accumulated;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId ? { ...m, content: curr } : m
            )
          );
          if (i % 2 === 0) {
            await new Promise((r) => setTimeout(r, 16));
          }
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId ? { ...m, isStreaming: false } : m
          )
        );
      } catch (err) {
        console.error('Send message failed:', err);
        setErrorMsg(err.message || 'Failed to get answer from backend.');
        const errorAiMsg = {
          id: `err_${Date.now()}`,
          role: 'assistant',
          isError: true,
          content: `Error: ${err.message || 'Could not communicate with the Python API. Please check your connection.'}`,
          time: timeStr,
        };
        setMessages((prev) => [...prev, errorAiMsg]);
      }
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleStarterClick(starter) {
    setInputValue(starter.label);
    inputRef.current?.focus();
  }

  return (
    <div className="chat-screen">
      {/* Video Hero Banner */}
      <div className="video-hero-wrap">
        <div className="video-hero-glow" />
        <div className="video-hero-banner">
          <div className="video-banner-card">
            {/* Left: video meta */}
            <div className="video-meta-left">
              {/* Thumbnail */}
              <div className="video-thumb-wrap">
                <img src={thumbnail} alt={videoTitle} />
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="video-thumb-play"
                  title="Watch on YouTube"
                >
                  <span className="material-symbols-outlined">play_circle</span>
                </a>
              </div>

              {/* Info */}
              <div className="video-meta-info">
                <div className="video-meta-tags">
                  <span className="text-label-sm tag hi-audio">Multilingual Audio</span>
                  <span className="text-label-sm tag hinglish">ChromaDB Indexed</span>
                  <span className="text-code-md tag duration">
                    <span className="material-symbols-outlined">tag</span>
                    {videoId || 'Video'}
                  </span>
                </div>
                <h1 className="text-headline-sm video-meta-title truncate" title={videoTitle}>
                  {videoTitle}
                </h1>
                <p className="text-body-sm video-meta-channel truncate">
                  Ready for conversational queries in English, Hindi & Hinglish
                </p>
              </div>
            </div>

            {/* Right: actions */}
            <div className="video-banner-actions">
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="action-btn text-label-md"
              >
                <span className="material-symbols-outlined">open_in_new</span>
                <span>Open on YouTube</span>
              </a>
              <button
                className="action-btn text-label-md"
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText?.(videoUrl);
                  alert('Video URL copied to clipboard!');
                }}
              >
                <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)' }}>content_copy</span>
                <span>Copy Link</span>
              </button>
            </div>
          </div>

          {/* Quick starter chips */}
          <div className="starter-chips">
            <span className="text-label-sm starter-chips-label">
              <span className="material-symbols-outlined">bolt</span>
              Ask AI:
            </span>
            <div className="starter-chips-scroll">
              {STARTER_PROMPTS.map((starter) => (
                <button
                  key={starter.label}
                  type="button"
                  className="starter-chip text-label-md"
                  onClick={() => handleStarterClick(starter)}
                >
                  <span>{starter.emoji}</span>
                  <span>{starter.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chat messages */}
      <div className="chat-messages">
        {/* Date / session break */}
        <div className="date-break">
          <div className="date-break-pill text-label-sm">
            <span>Video Context Ready</span>
            <span>•</span>
            <span className="text-code-md">LangGraph Connected</span>
          </div>
        </div>

        {/* Loading history indicator */}
        {loadingHistory && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
            <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: 16 }}>sync</span>
              Loading chat history...
            </span>
          </div>
        )}

        {/* Empty state when no messages */}
        {!loadingHistory && messages.length === 0 && (
          <div className="chat-empty-hint animate-fade-in">
            <div className="chat-empty-icon">
              <span className="material-symbols-outlined">forum</span>
            </div>
            <h3 className="text-headline-sm" style={{ color: 'var(--on-surface)' }}>Ask anything about this video!</h3>
            <p className="text-body-md" style={{ color: 'var(--on-surface-variant)', maxWidth: 460 }}>
              The entire transcript has been vectorized into ChromaDB. Ask for specific moments, explanations, code snippets, or translations.
            </p>
          </div>
        )}

        {/* Render messages */}
        {messages.map((msg) => {
          if (msg.role === 'user') {
            return <UserMessage key={msg.id} msg={msg} />;
          }
          return <AiMessage key={msg.id} msg={msg} videoId={videoId} />;
        })}

        {/* In-flight typing indicator (shows while waiting for first tokens) */}
        {sending && !messages.some((m) => m.isStreaming) && <TypingMessage />}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating input bar */}
      <div className={`chat-input-bar ${sidebarCollapsed ? 'sidebar-hidden' : ''}`}>
        <div className="chat-input-inner">
          <div className="chat-input-box">
            {/* Input field */}
            <input
              ref={inputRef}
              type="text"
              className="chat-input-field text-body-md"
              placeholder="Ask anything about this video... (English या हिंदी में पूछें)"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
              autoFocus
            />

            <div className="chat-input-right">
              {/* Language indicator */}
              <div className="lang-indicator text-label-sm">
                <span className="dot" />
                {/* <span>HI / EN Auto</span> */}
              </div>

              {/* Send button */}
              <button
                type="button"
                className="send-btn"
                aria-label="Send query"
                onClick={() => handleSend()}
                disabled={sending || !inputValue.trim()}
              >
                {sending ? (
                  <span className="material-symbols-outlined animate-spin">sync</span>
                ) : (
                  <span className="material-symbols-outlined">arrow_upward</span>
                )}
              </button>
            </div>
          </div>

          {/* Footer disclaimer */}
          <div className="chat-input-footer">
            <span className="chat-input-disclaimer text-label-sm">
              <span className="material-symbols-outlined">verified_user</span>
              <span>Answers synthesized using transcript excerpts only. No hallucinations.</span>
            </span>
            <span className="text-code-md hide-mobile" style={{ color: 'var(--on-surface-variant)', opacity: 0.8 }}>
              Press Enter ↵ to send
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── User Message Component ── */
function UserMessage({ msg }) {
  return (
    <div className="msg-user animate-fade-in">
      <div className="msg-user-meta text-label-sm">
        <span>You</span>
        {msg.time && (
          <>
            <span>•</span>
            <span className="text-code-md">{msg.time}</span>
          </>
        )}
      </div>
      <div className="msg-user-bubble">
        <p className="text-body-md" style={{ fontWeight: 500, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {msg.content}
        </p>
      </div>
      <div className="msg-user-status text-body-sm">
        <span className="material-symbols-outlined">done_all</span>
        <span>Sent with video context</span>
      </div>
    </div>
  );
}

/* ── Formatted Assistant Message Component ── */
function AiMessage({ msg, videoId }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard?.writeText?.(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={`msg-ai animate-fade-in ${msg.isError ? 'msg-error' : ''}`}>
      {/* Header row */}
      <div className="msg-ai-header">
        <div className="msg-ai-header-left">
          <div className="ai-avatar">
            <span className="material-symbols-outlined">smart_toy</span>
          </div>
          <span className="text-headline-sm ai-name">TubeChat AI</span>
          {/* <span className="text-label-sm ai-engine-badge">{msg.engine || 'Gemini Flash'}</span> */}
          {msg.time && <span className="text-code-md ai-time">{msg.time}</span>}
        </div>
        <div className="msg-ai-actions">
          <button
            className="msg-action-btn"
            type="button"
            title="Copy answer"
            onClick={handleCopy}
          >
            <span className="material-symbols-outlined">{copied ? 'check' : 'content_copy'}</span>
          </button>
        </div>
      </div>

      {/* Structured Answer Card */}
      <div className="msg-ai-card">
        <StructuredResponse content={msg.content} videoId={videoId} />
        {msg.isStreaming && (
          <span className="streaming-cursor" title="Streaming response...">▍</span>
        )}
      </div>
    </div>
  );
}

/* ── Typing Indicator ── */
function TypingMessage() {
  return (
    <div className="msg-typing animate-fade-in">
      <div className="msg-ai-header-left" style={{ padding: '0 4px' }}>
        <div className="ai-avatar">
          <span className="material-symbols-outlined">smart_toy</span>
        </div>
        <span className="text-headline-sm ai-name">TubeChat AI</span>
        <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
          is reviewing transcript moments...
        </span>
      </div>
      <div className="typing-card">
        <div className="typing-dots">
          <span className="typing-dot animate-bounce-delay-1" />
          <span className="typing-dot animate-bounce-delay-2" />
          <span className="typing-dot animate-bounce" />
        </div>
        <span className="text-code-md typing-search">
          <span className="material-symbols-outlined">search</span>
          Finding matching answers
        </span>
      </div>
    </div>
  );
}
