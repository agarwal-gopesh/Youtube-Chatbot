import { useTheme } from '../contexts/ThemeContext';
import { getThumbnailUrl } from '../services/api';

const TUBE_LOGO = 'https://lh3.googleusercontent.com/aida/AEtjO1XjCAoVn4dhqGRRqIGyjco-atHwWU-LsE1R-Vq9H9A-MyhJrBosIWvd6xM3vXQQu5Lllq4PjRz0eDsGPjBdAaNU9SW0GVTjrnrPS2uQW09lSpB9YHd-Na3McXwEUGaS1BqjBxxhBja7LAef1Lmqn6Y8eqjUHNT7srdkvGvcN0eHk1gTqEeltkSxO-VCAtHNevV1CDA1xTWGgJBt-M0UkZDTOzmmMF35nCnYZl7nrZ3XUJCvMdXQ87lfwwI';

export default function Sidebar({
  collapsed,
  onCollapse,
  mobileOpen,
  onCloseMobile,
  chats = [],
  currentChatId,
  onSelectChat,
  onNewChat,
  onOpenSettings,
  apiStatus = 'disconnected',
  apiUrl = '',
}) {
  const { theme, toggleTheme } = useTheme();

  // Shorten API URL for display
  const displayApiUrl = (() => {
    try {
      const u = new URL(apiUrl);
      return u.hostname;
    } catch {
      return apiUrl.replace(/^https?:\/\//, '').split('/')[0] || 'Configure API';
    }
  })();

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="sidebar-overlay active"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

          {/* Logo + Collapse / Mobile close */}
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <img src={TUBE_LOGO} alt="TubeChat Logo" />
              <span className="text-headline-sm sidebar-logo-text">TubeChat</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {/* Desktop collapse button */}
              <button
                className="sidebar-collapse-btn desktop-only"
                aria-label="Collapse sidebar"
                onClick={() => onCollapse(!collapsed)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>dock_to_right</span>
              </button>

              {/* Mobile close button */}
              <button
                className="sidebar-collapse-btn mobile-only"
                aria-label="Close sidebar"
                onClick={onCloseMobile}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>
          </div>

          {/* New Chat Button */}
          <div className="sidebar-new-chat">
            <button
              className="btn-new-chat text-label-lg"
              onClick={() => {
                onNewChat();
                onCloseMobile?.();
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add</span>
              <span>New Chat</span>
            </button>
          </div>

          {/* Recents header */}
          <div className="sidebar-recents-label text-label-sm">
            <span>Recents ({chats.length})</span>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>history</span>
          </div>

          {/* Navigation - Real Chats list */}
          <nav className="sidebar-nav">
            {chats.length === 0 ? (
              <div className="sidebar-empty text-body-sm">
                <span className="material-symbols-outlined" style={{ fontSize: 28, opacity: 0.5 }}>smart_display</span>
                <p>No video chats yet</p>
                <span style={{ fontSize: 11, opacity: 0.7 }}>Paste a YouTube URL to begin</span>
              </div>
            ) : (
              chats.map((chat) => {
                const isActive = currentChatId === chat.thread_id;
                const thumb = getThumbnailUrl(chat.video_id);

                return (
                  <div
                    key={chat.thread_id}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      onSelectChat(chat);
                      onCloseMobile?.();
                    }}
                    title={chat.title || 'Untitled video'}
                  >
                    <div className="nav-item-left" style={{ flex: 1 }}>
                      {/* Active indicator bar or thumbnail */}
                      {isActive ? (
                        <span style={{
                          width: 4, height: 26, borderRadius: 2,
                          background: 'var(--primary-container)', flexShrink: 0,
                        }} />
                      ) : null}

                      {/* Video Thumbnail */}
                      <div className="nav-item-thumb-box">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt=""
                            className="nav-item-thumb-img"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="nav-item-thumb-fallback">
                          <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--primary)' }}>
                            play_circle
                          </span>
                        </div>
                      </div>

                      {/* Video Title and info */}
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                        <span className="text-label-md truncate" style={{
                          color: isActive ? 'var(--on-surface)' : 'var(--on-surface-variant)',
                          fontWeight: isActive ? 600 : 500
                        }}>
                          {chat.title || `Video ${chat.video_id || ''}`}
                        </span>
                        <span className="text-code-md" style={{ fontSize: 10, opacity: 0.6 }}>
                          ID: {chat.video_id ? chat.video_id.substring(0, 10) : 'video'}
                        </span>
                      </div>
                    </div>

                    {/* Active play arrow indicator */}
                    {isActive && (
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--primary)', flexShrink: 0 }}>
                        play_arrow
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </nav>
        </div>

        {/* Footer with Theme Toggle, Shortcuts & Backend API status */}
        <div className="sidebar-footer">
          {/* API Backend connection banner */}
          <button
            type="button"
            className="sidebar-api-badge text-label-sm"
            onClick={onOpenSettings}
            title={`Backend: ${apiUrl || 'Click to set ngrok URL'}`}
          >
            <div className="api-badge-left">
              <span className={`status-dot ${apiStatus === 'connected' ? 'connected' : 'disconnected'}`} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 600, color: 'var(--on-surface)' }}>
                  {apiStatus === 'connected' ? 'Backend Connected' : 'Connect Ngrok API'}
                </span>
                <span className="text-code-md truncate" style={{ fontSize: 10, maxWidth: 140, color: 'var(--on-surface-variant)' }}>
                  {displayApiUrl}
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--on-surface-variant)' }}>
              tune
            </span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            {/* Theme toggle */}
            <div className="theme-toggle">
              <button
                className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                onClick={toggleTheme}
                aria-label="Light mode"
              >
                <span className="material-symbols-outlined">light_mode</span>
              </button>
              <button
                className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                onClick={toggleTheme}
                aria-label="Dark mode"
              >
                <span className="material-symbols-outlined">dark_mode</span>
              </button>
            </div>

            <button
              type="button"
              className="sidebar-shortcuts-link text-label-sm"
              onClick={onOpenSettings}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              <span className="material-symbols-outlined">settings</span>
              <span>API Settings</span>
            </button>
          </div>

          {/* AI status */}
          {/* <div className="ai-status">
            <div className="ai-status-indicator">
              <span className="status-dot animate-pulse connected" />
              <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>AI Engine Ready</span>
            </div>
            <span className="text-code-md" style={{ color: 'var(--on-surface-variant)' }}>FastAPI + Gemini</span>
          </div> */}
        </div>
      </aside>
    </>
  );
}
