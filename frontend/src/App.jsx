import { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Sidebar from './components/Sidebar';
import AppHeader from './components/AppHeader';
import WelcomeScreen from './screens/WelcomeScreen';
import ChatScreen from './screens/ChatScreen';
import LoadingScreen from './screens/LoadingScreen';
import ApiSettingsModal from './components/ApiSettingsModal';
import {
  listChats,
  createChat,
  extractVideoId,
  testConnection,
  getApiBaseUrl,
} from './services/api';
import './index.css';

/**
 * App — Root component for TubeChat.
 * Fully wired to remote Python FastAPI backend via ngrok or local network.
 */
export default function App() {
  const [screen, setScreen] = useState('welcome'); // 'welcome' | 'loading' | 'chat'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Real backend chat states
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [loadingVideo, setLoadingVideo] = useState({ url: '', videoId: '', title: '' });
  const [loadingError, setLoadingError] = useState(null);
  const [welcomeError, setWelcomeError] = useState(null);

  // Backend API connection status
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const [apiStatus, setApiStatus] = useState('checking'); // 'connected' | 'disconnected' | 'checking'
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Check backend health and fetch chats
  const refreshChats = useCallback(async () => {
    try {
      const res = await testConnection();
      if (res.ok) {
        setApiStatus('connected');
        const chatList = await listChats();
        if (Array.isArray(chatList)) {
          setChats(chatList);
        }
      } else {
        setApiStatus('disconnected');
      }
    } catch {
      setApiStatus('disconnected');
    }
  }, []);

  useEffect(() => {
    refreshChats();
  }, [refreshChats]);

  // Navigate between screens
  function navigate(targetScreen) {
    setScreen(targetScreen);
    setMobileSidebarOpen(false);
  }

  // Handle URL submission from WelcomeScreen
  async function handleSubmitVideoUrl(url) {
    const videoId = extractVideoId(url);
    setLoadingVideo({
      url,
      videoId: videoId || '',
      title: videoId ? `Video ${videoId}` : 'YouTube Video',
    });
    setLoadingError(null);
    setWelcomeError(null);
    navigate('loading');

    try {
      // Call remote Python FastAPI: POST /chats { url }
      const newChat = await createChat(url);
      setCurrentChat(newChat);
      // Refresh chat list to include new session in sidebar
      await refreshChats();
      // Automatically transition to Chat screen once indexed
      navigate('chat');
    } catch (err) {
      console.error('Video ingestion failed:', err);
      setLoadingError(err.message || 'Failed to process video transcript. Ensure the video has captions enabled.');
    }
  }

  // Handle selecting a chat from recents
  function handleSelectChat(chat) {
    setCurrentChat(chat);
    navigate('chat');
  }

  // Handle New Chat button
  function handleNewChat() {
    setCurrentChat(null);
    setLoadingError(null);
    setWelcomeError(null);
    navigate('welcome');
  }

  // Header props per screen
  const headerProps = (() => {
    if (screen === 'chat' && currentChat) {
      return {
        videoTitle: currentChat.title || (currentChat.video_id ? `Video ${currentChat.video_id}` : 'YouTube Chat'),
        videoDuration: 'Full',
        videoChannel: 'YouTube',
        videoLang: 'HI / EN',
        onOpenYouTube: currentChat.url ? () => window.open(currentChat.url, '_blank') : null,
        onShare: () => {
          if (currentChat.url) {
            navigator.clipboard?.writeText?.(currentChat.url);
            alert('Video URL copied to clipboard!');
          }
        },
        onClearChat: () => {
          if (confirm('Clear current chat view?')) {
            handleNewChat();
          }
        },
      };
    }
    if (screen === 'loading') {
      return {
        videoTitle: loadingVideo.title || 'Ingesting Video Stream...',
        videoDuration: null,
        videoChannel: 'YouTube',
        videoLang: 'HI / EN',
        onOpenYouTube: loadingVideo.url ? () => window.open(loadingVideo.url, '_blank') : null,
      };
    }
    return { videoTitle: null };
  })();

  return (
    <ThemeProvider>
      <div className="app-shell">
        {/* Dynamic Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onCollapse={(val) => setSidebarCollapsed(val)}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          chats={chats}
          currentChatId={currentChat?.thread_id}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          onOpenSettings={() => setIsSettingsOpen(true)}
          apiStatus={apiStatus}
          apiUrl={apiUrl}
        />

        {/* Main Workspace Area */}
        <div className={`main-area ${sidebarCollapsed ? 'sidebar-hidden' : ''}`}>
          {/* Header */}
          <AppHeader
            sidebarHidden={sidebarCollapsed}
            onMenuToggle={() => setMobileSidebarOpen((v) => !v)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            apiConnected={apiStatus === 'connected'}
            {...headerProps}
          />

          {/* Active Screen */}
          <main className="page-main">
            {screen === 'welcome' && (
              <WelcomeScreen
                onSubmitUrl={handleSubmitVideoUrl}
                errorMessage={welcomeError}
                onClearError={() => setWelcomeError(null)}
                onOpenSettings={() => setIsSettingsOpen(true)}
                apiStatus={apiStatus}
                apiUrl={apiUrl}
              />
            )}

            {screen === 'loading' && (
              <LoadingScreen
                videoUrl={loadingVideo.url}
                videoId={loadingVideo.videoId}
                videoTitle={loadingVideo.title}
                error={loadingError}
                onCancel={() => navigate('welcome')}
                onRetry={() => handleSubmitVideoUrl(loadingVideo.url)}
              />
            )}

            {screen === 'chat' && (
              <ChatScreen
                chat={currentChat}
                sidebarCollapsed={sidebarCollapsed}
              />
            )}
          </main>
        </div>
      </div>

      {/* API Ngrok Connection Settings Modal */}
      <ApiSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConnected={(newUrl) => {
          setApiUrl(newUrl);
          refreshChats();
        }}
      />
    </ThemeProvider>
  );
}
