const TUBE_LOGO = 'https://lh3.googleusercontent.com/aida/AEtjO1XjCAoVn4dhqGRRqIGyjco-atHwWU-LsE1R-Vq9H9A-MyhJrBosIWvd6xM3vXQQu5Lllq4PjRz0eDsGPjBdAaNU9SW0GVTjrnrPS2uQW09lSpB9YHd-Na3McXwEUGaS1BqjBxxhBja7LAef1Lmqn6Y8eqjUHNT7srdkvGvcN0eHk1gTqEeltkSxO-VCAtHNevV1CDA1xTWGgJBt-M0UkZDTOzmmMF35nCnYZl7nrZ3XUJCvMdXQ87lfwwI';

/**
 * Shared AppHeader — used across all screens.
 */
export default function AppHeader({
  sidebarHidden,
  onMenuToggle,
  videoTitle,
  videoDuration,
  videoChannel,
  videoLang,
  onOpenYouTube,
  onShare,
  onClearChat,
  onOpenSettings,
  apiConnected,
}) {
  return (
    <header className={`app-header ${sidebarHidden ? 'sidebar-hidden' : ''}`}>
      <div className="header-left">
        {/* Mobile hamburger menu toggle */}
        <button className="mobile-menu-btn" onClick={onMenuToggle} aria-label="Open menu">
          <span className="material-symbols-outlined">menu</span>
        </button>

        {/* Logo + video info */}
        <div className="header-video-info">
          <img src={TUBE_LOGO} alt="TubeChat Logo" style={{ height: 32, width: 'auto', objectFit: 'contain' }} />
          {videoTitle ? (
            <>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 20 }}>
                play_circle
              </span>
              <span className="text-headline-sm header-video-title truncate">{videoTitle}</span>
            </>
          ) : (
            <span className="text-headline-sm" style={{ color: 'var(--on-surface)' }}>TubeChat</span>
          )}
        </div>

        {/* Chips: duration / channel / lang */}
        {(videoDuration || videoChannel || videoLang) && (
          <div className="header-chips">
            {videoDuration && (
              <span className="chip chip-surface text-code-md">{videoDuration}</span>
            )}
            {videoChannel && (
              <span className="chip chip-surface text-label-sm">{videoChannel}</span>
            )}
            {videoLang && (
              <span className="chip chip-tertiary text-label-sm" style={{ textTransform: 'uppercase' }}>
                {videoLang}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="header-right">
        {onOpenYouTube && (
          <button className="header-btn text-label-md" onClick={onOpenYouTube}>
            <span className="material-symbols-outlined">open_in_new</span>
            <span className="hide-mobile">Open on YouTube</span>
          </button>
        )}
        {onShare && (
          <button className="header-icon-btn" aria-label="Share context" onClick={onShare}>
            <span className="material-symbols-outlined">share</span>
          </button>
        )}
        {onClearChat && (
          <button className="header-icon-btn" aria-label="Clear chat history" onClick={onClearChat}>
            <span className="material-symbols-outlined">delete_sweep</span>
          </button>
        )}

        {/* API Settings Quick Toggle */}
        {onOpenSettings && (
          <button
            className="header-icon-btn api-settings-trigger"
            aria-label="API Settings"
            onClick={onOpenSettings}
            title={apiConnected ? 'Remote API Connected' : 'Configure Ngrok Backend URL'}
          >
            <span
              className="material-symbols-outlined"
              style={{ color: apiConnected ? 'var(--tertiary)' : 'var(--primary-container)' }}
            >
              tune
            </span>
          </button>
        )}

        <button className="avatar-btn" aria-label="Profile">
          <span className="material-symbols-outlined">person</span>
        </button>
      </div>
    </header>
  );
}
