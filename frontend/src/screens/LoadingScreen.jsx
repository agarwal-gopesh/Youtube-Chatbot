import { useState, useEffect } from 'react';
import { getThumbnailUrl } from '../services/api';

export default function LoadingScreen({
  videoUrl,
  videoId,
  videoTitle,
  error,
  onCancel,
  onRetry,
}) {
  const [stage, setStage] = useState(1);
  const [progress, setProgress] = useState(25);

  const thumbnail = getThumbnailUrl(videoId);
  const displayTitle = videoTitle || (videoId ? `YouTube Video (${videoId})` : 'Ingesting Video Stream');

  useEffect(() => {
    // Realistic progress animation while awaiting backend response
    if (error) return;

    const timer1 = setTimeout(() => {
      setStage(2);
      setProgress(60);
    }, 2500);

    const timer2 = setTimeout(() => {
      setStage(3);
      setProgress(90);
    }, 6000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [error]);

  const STEPS = [
    {
      id: 1,
      status: error ? 'pending' : (stage > 1 ? 'done' : 'active'),
      label: 'Fetching transcript & captions',
      desc: 'Retrieving multilingual subtitle tracks (Hindi / English / Auto-generated) from YouTube API.',
      pct: stage > 1 ? '100%' : 'Extracting',
    },
    {
      id: 2,
      status: error ? 'pending' : (stage > 2 ? 'done' : stage === 2 ? 'active' : 'pending'),
      label: 'Vectorizing & Semantic Chunking',
      desc: 'Splitting transcript into context segments and embedding into ChromaDB using HuggingFace BGE-M3.',
      pct: stage > 2 ? '100%' : stage === 2 ? 'Embedding' : '',
    },
    {
      id: 3,
      status: error ? 'pending' : (stage === 3 ? 'active' : 'pending'),
      label: 'Initializing Conversational Graph',
      desc: 'Configuring LangGraph state pipeline with Google Gemini Flash for grounded Q&A.',
      pct: stage === 3 ? 'Finalizing' : '',
    },
  ];

  return (
    <div className="loading-screen">
      {/* Glows */}
      <div className="loading-glow-1" />
      <div className="loading-glow-2" />

      {/* Video ribbon */}
      <div className="video-ribbon">
        <div className="video-ribbon-card">
          <div className="ribbon-left">
            {/* Thumbnail */}
            <div className="ribbon-thumb">
              <img src={thumbnail} alt={displayTitle} />
              <span className="text-code-md ribbon-thumb-dur">YouTube</span>
            </div>

            {/* Info */}
            <div className="ribbon-info">
              <div className="ribbon-title-row">
                <span className="text-headline-sm ribbon-title truncate">{displayTitle}</span>
                <span className="text-label-sm ribbon-badge">HI / EN</span>
              </div>
              <div className="ribbon-meta text-label-md">
                <span>Direct Feed</span>
                <span>•</span>
                <span className="text-code-md">{videoId || 'Video'}</span>
                <span>•</span>
                <span className="ribbon-cc text-label-sm">
                  <span className="material-symbols-outlined">closed_caption</span>
                  Auto-captions stream
                </span>
              </div>
            </div>
          </div>

          {videoUrl && (
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ribbon-yt-link text-label-md"
            >
              <span>Open on YouTube</span>
              <span className="material-symbols-outlined">arrow_outward</span>
            </a>
          )}
        </div>
      </div>

      {/* Central processing card */}
      <div className="processing-section">
        <div className="processing-card">
          {/* Top progress bar */}
          <div className="processing-top-bar">
            <div
              className={`processing-top-fill ${error ? 'error' : ''}`}
              style={{
                width: error ? '100%' : `${progress}%`,
                background: error ? 'var(--error)' : 'var(--primary-container)'
              }}
            />
          </div>

          <div className="processing-card-body">
            {/* Source snippet */}
            <div className="source-snippet">
              <div className="source-thumb">
                <img src={thumbnail} alt={displayTitle} />
                <div className="source-thumb-overlay" />
                <span className="text-code-md source-thumb-dur">Ingest</span>
              </div>
              <div className="source-info">
                <span className="text-label-sm source-label">Video Source Ingestion</span>
                <p className="text-headline-sm source-title truncate">{displayTitle}</p>
                <div className="source-id text-code-md">
                  <span className="material-symbols-outlined">tag</span>
                  <span>{videoId || 'Processing'}</span>
                </div>
              </div>
            </div>

            {/* Heading / Error Alert */}
            {error ? (
              <div className="loading-error-box animate-fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--error)', fontSize: 28 }}>
                    error
                  </span>
                  <div>
                    <h3 className="text-headline-sm" style={{ color: 'var(--error)' }}>Ingestion Failed</h3>
                    <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginTop: 4 }}>
                      {error}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  {onRetry && (
                    <button type="button" className="btn-modal-save text-label-md" onClick={onRetry}>
                      <span className="material-symbols-outlined">refresh</span>
                      <span>Retry</span>
                    </button>
                  )}
                  <button type="button" className="btn-modal-cancel text-label-md" onClick={onCancel}>
                    <span>Back to Home</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="processing-heading">
                  <div className="processing-heading-left">
                    <span className="processing-ping">
                      <span className="processing-ping-outer animate-ping" />
                      <span className="processing-ping-inner" />
                    </span>
                    <h2 className="text-headline-md" style={{ color: 'var(--on-surface)', fontWeight: 600 }}>
                      Processing video transcript...
                    </h2>
                  </div>
                  <span className="text-code-md processing-stage-badge">Stage {stage}/3</span>
                </div>

                {/* Steps */}
                <div className="steps-list">
                  {STEPS.map((step, idx) => (
                    <div key={step.id}>
                      {/* Step item */}
                      <div className={`step-item ${step.status}`}>
                        {/* Icon */}
                        {step.status === 'done' && (
                          <div className="step-icon done">
                            <span className="material-symbols-outlined">check</span>
                          </div>
                        )}
                        {step.status === 'active' && (
                          <div className="step-spin">
                            <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="var(--primary-container)" strokeWidth="3" style={{ opacity: 0.2 }} />
                              <path
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                fill="var(--primary-container)"
                                style={{ opacity: 0.9 }}
                              />
                            </svg>
                            <span className="step-spin-center" />
                          </div>
                        )}
                        {step.status === 'pending' && (
                          <div className="step-icon pending">
                            <span className="material-symbols-outlined">schedule</span>
                          </div>
                        )}

                        {/* Content */}
                        <div className="step-content">
                          <div className="step-header">
                            {step.status === 'active' ? (
                              <span className="text-label-lg step-label active">
                                {step.label}
                                <span className="step-pulse animate-pulse" />
                              </span>
                            ) : (
                              <span className={`text-label-lg step-label ${step.status}`}>{step.label}</span>
                            )}
                            {step.pct && (
                              <span className={`text-code-md step-pct ${step.status} ${step.status === 'active' ? 'animate-pulse' : ''}`}>
                                {step.pct}
                              </span>
                            )}
                          </div>
                          <p className="text-body-sm step-desc">{step.desc}</p>
                          {step.status === 'active' && (
                            <div className="step-mini-bar">
                              <div className="step-mini-fill" style={{ width: `${progress}%` }} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Connector */}
                      {idx < STEPS.length - 1 && (
                        <div className={`step-connector ${step.status === 'done' ? 'done' : 'pending'}`} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Info notice */}
                <div className="info-notice">
                  <span className="material-symbols-outlined">info</span>
                  <p className="text-body-sm">
                    First-time indexing fetches captions and creates ChromaDB embeddings. Once indexed, subsequent questions will respond rapidly.
                  </p>
                </div>

                {/* Footer */}
                <div className="processing-card-footer">
                  <div className="engine-label text-code-md">
                    <span className="material-symbols-outlined">bolt</span>
                    <span>FastAPI LangGraph Service</span>
                  </div>
                  <button
                    className="cancel-btn text-label-md"
                    type="button"
                    onClick={onCancel}
                  >
                    <span className="material-symbols-outlined">close</span>
                    <span>Cancel extraction</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Disabled footer input */}
      <div className="loading-footer">
        {/* Status badge */}
        <div className="loading-status-badge text-label-sm">
          <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="var(--primary)" strokeWidth="4" style={{ opacity: 0.25 }} />
            <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="var(--primary)" style={{ opacity: 0.75 }} />
          </svg>
          <span>Indexing transcript... Input will unlock automatically once ready</span>
        </div>

        {/* Disabled input */}
        <div className="disabled-input-box">
          <div className="disabled-input-icon">
            <span className="material-symbols-outlined">movie_edit</span>
          </div>
          <input
            type="text"
            className="text-body-md disabled-input"
            placeholder="Ask anything about this video once ready..."
            disabled
          />
          <button className="disabled-send-btn" type="button" disabled title="Processing video context">
            <span className="material-symbols-outlined">arrow_upward</span>
          </button>
        </div>

        {/* Disclaimer */}
        <div className="loading-disclaimer text-body-sm">
          <span>Auto-sync Hindi / English recognition enabled</span>
          <span className="text-code-md">ChromaDB Vector Store</span>
        </div>
      </div>
    </div>
  );
}
