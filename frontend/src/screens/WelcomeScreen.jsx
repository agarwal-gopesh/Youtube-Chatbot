import { useState, useRef } from 'react';
import { MOCK_TRENDING, MOCK_QUICK_TRIES } from '../data/mockData';

export default function WelcomeScreen({
  onSubmitUrl,
  errorMessage,
  onClearError,
  onOpenSettings,
  apiStatus,
  apiUrl,
}) {
  const [url, setUrl] = useState('');
  const inputRef = useRef(null);

  function fillAndFocus(fillUrl) {
    setUrl(fillUrl);
    inputRef.current?.focus();
  }

  function clearInput() {
    setUrl('');
    inputRef.current?.focus();
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!url.trim()) {
      inputRef.current?.focus();
      return;
    }
    onSubmitUrl(url.trim());
  }

  return (
    <div className="welcome-screen">
      {/* Ambient glows */}
      <div className="ambient-glow ambient-glow-1" />
      <div className="ambient-glow ambient-glow-2" />
      <div className="ambient-glow ambient-glow-3" />

      <div className="welcome-workspace">

        {/* Backend status banner / Version pill */}
        <div className="welcome-top-badges">
          {/* <div className="version-pill">
            <span className="ping-dot">
              <span className="ping-dot-outer animate-ping" />
              <span className="ping-dot-inner" />
            </span>
            <span className="text-label-sm version-pill-text">Multilingual Neural Context</span>
            <span className="version-pill-sep">•</span>
            <span className="text-code-md version-pill-ver">Gemini Flash</span>
          </div> */}

          {/* Ngrok / Remote Backend Notice */}
          <button
            type="button"
            className={`api-pill ${apiStatus === 'connected' ? 'connected' : 'disconnected'}`}
            onClick={onOpenSettings}
            title="Configure remote Python backend via ngrok"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              {apiStatus === 'connected' ? 'cloud_done' : 'cloud_off'}
            </span>
            <span className="text-label-sm">
              {apiStatus === 'connected' ? 'Remote API Connected' : 'Set Ngrok Backend URL'}
            </span>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
          </button>
        </div>

        {/* Hero */}
        <div className="hero-header">
          <h1 className="text-display-lg gradient-text hero-title">
            Chat with any YouTube video
          </h1>
          <p className="text-body-lg hero-subtitle">
            Paste a link, ask questions in English or Hindi{' '}
            <span className="sep">/</span>{' '}
            <span className="hindi">किसी भी यूट्यूब वीडियो से सवाल पूछें</span>
          </p>
        </div>

        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="welcome-error-banner animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--error)' }}>error</span>
              <span className="text-body-sm">{errorMessage}</span>
            </div>
            <button
              type="button"
              className="error-dismiss-btn"
              onClick={onClearError}
              aria-label="Dismiss error"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        )}

        {/* Input card */}
        <div className="input-card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {/* URL bar */}
            <div className="url-input-bar">
              {/* YouTube icon */}
              <div className="yt-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </div>

              {/* Input */}
              <input
                ref={inputRef}
                id="yt-url-input"
                className="url-input text-body-md"
                type="text"
                placeholder="https://www.youtube.com/watch?v=... or youtu.be/..."
                value={url}
                onChange={e => setUrl(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />

              {/* Clear button */}
              {url.length > 0 && (
                <button
                  type="button"
                  className="clear-btn"
                  aria-label="Clear link input"
                  onClick={clearInput}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}

              {/* Submit button */}
              <button type="submit" className="submit-btn text-label-lg" disabled={!url.trim()}>
                <span>Start chat</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>

            {/* Quick try samples */}
            {/* <div className="quick-try">
              <span className="text-label-sm quick-try-label">Quick Try:</span>
              <div className="quick-try-scroll">
                {MOCK_QUICK_TRIES.map((qt) => (
                  <button
                    key={qt.url}
                    type="button"
                    className="quick-pill text-label-md"
                    onClick={() => fillAndFocus(qt.url)}
                  >
                    <span className={`pill-dot ${qt.dotClass}`} />
                    <span>{qt.label}</span>
                    <span className="material-symbols-outlined">north_east</span>
                  </button>
                ))}
              </div>
            </div> */}
          </form>
        </div>

        {/* Feature bento */}
        <div className="feature-grid" style={{ width: '100%', marginBottom: 'var(--space-xl)' }}>
          <div className="feature-card">
            <div className="feature-card-header">
              <div className="feature-icon-wrap tertiary">
                <span className="material-symbols-outlined">translate</span>
              </div>
              <span className="text-label-sm feature-badge tertiary" style={{ textTransform: 'uppercase' }}>हिंदी + EN</span>
            </div>
            <h2 className="text-headline-sm feature-title tertiary">Works with Hindi videos</h2>
            <p className="text-body-sm feature-desc">
              Native understanding of pure Hindi, English, and Hinglish transcripts with zero translation loss.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-card-header">
              <div className="feature-icon-wrap secondary">
                <span className="material-symbols-outlined">tab_group</span>
              </div>
              <span className="text-label-sm feature-badge secondary" style={{ textTransform: 'uppercase' }}>Multi-Session</span>
            </div>
            <h2 className="text-headline-sm feature-title secondary">Multiple concurrent chats</h2>
            <p className="text-body-sm feature-desc">
              Switch between lecture summaries, podcasts, and debates without losing context or history.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-card-header">
              <div className="feature-icon-wrap primary">
                <span className="material-symbols-outlined">verified</span>
              </div>
              <span className="text-label-sm feature-badge primary" style={{ textTransform: 'uppercase' }}>Semantic RAG</span>
            </div>
            <h2 className="text-headline-sm feature-title primary">Answers from transcript</h2>
            <p className="text-body-sm feature-desc">
              Powered by ChromaDB vector search and Google Gemini for grounded, hallucination-free answers.
            </p>
          </div>
        </div>

        {/* Trending gallery */}
        <div className="trending-section" style={{ width: '100%' }}>
          {/* <div className="trending-header">
            <div className="trending-header-left">
              <span className="material-symbols-outlined">insights</span>
              <span className="text-headline-sm" style={{ color: 'var(--on-surface)' }}>
                Trending Video Studies Ready to Explore
              </span>
            </div>
            <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Suggestions
            </span>
          </div> */}

          {/* <div className="trending-grid">
            {MOCK_TRENDING.map((video) => (
              <div
                key={video.id}
                className="trending-card"
                onClick={() => fillAndFocus(video.url)}
              >
                <div className="trending-thumb">
                  <img src={video.thumb} alt={video.title} />
                  <div className="trending-thumb-overlay" />
                  <span className={`trending-lang text-label-sm ${video.langClass}`} style={{ textTransform: 'uppercase' }}>
                    {video.lang}
                  </span>
                  <span className="trending-duration text-code-md">{video.duration}</span>
                </div>
                <div className="trending-info">
                  <h3 className="text-headline-sm trending-title line-clamp-1">{video.title}</h3>
                  <p className="text-body-sm trending-channel line-clamp-1">{video.channel}</p>
                </div>
              </div>
            ))}
          </div> */}
        </div>

        {/* Disabled bottom bar */}
        <div className="disabled-bar-wrap">
          <div className="disabled-bar">
            <div className="disabled-bar-left text-body-md">
              <span className="material-symbols-outlined">lock</span>
              <span>Ask questions about any video transcript (summaries, timelines, explanations)...</span>
            </div>
            <div>
              <span className="text-code-md kbd-chip">Enter ↵</span>
            </div>
          </div>
          <div className="disabled-hint text-label-sm">
            <span className="material-symbols-outlined">info</span>
            <span>Enter a valid YouTube URL above to unlock interactive transcription analysis</span>
          </div>
        </div>

      </div>
    </div>
  );
}
