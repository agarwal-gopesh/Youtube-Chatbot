/**
 * API Service for TubeChat
 * Connects to the Python FastAPI backend (locally or via ngrok tunnel)
 */

const STORAGE_KEY = 'tubechat_api_url';
const DEFAULT_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Get the currently configured backend API URL
 */
export function getApiBaseUrl() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && saved.trim()) {
    return saved.trim().replace(/\/+$/, '');
  }
  return DEFAULT_URL.replace(/\/+$/, '');
}

/**
 * Set and persist a new backend API URL (e.g., from ngrok)
 */
export function setApiBaseUrl(url) {
  if (!url || !url.trim()) {
    localStorage.removeItem(STORAGE_KEY);
    return DEFAULT_URL;
  }
  const cleanUrl = url.trim().replace(/\/+$/, '');
  localStorage.setItem(STORAGE_KEY, cleanUrl);
  return cleanUrl;
}

/**
 * Common fetch wrapper with ngrok bypass header and error handling
 */
async function apiRequest(endpoint, options = {}) {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    // Bypass ngrok free warning page for API calls
    'ngrok-skip-browser-warning': 'true',
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let detail = `Server returned status ${res.status}`;
      try {
        const errorJson = await res.json();
        if (errorJson.detail) {
          detail = typeof errorJson.detail === 'string' 
            ? errorJson.detail 
            : JSON.stringify(errorJson.detail);
        }
      } catch {
        const text = await res.text();
        if (text) detail = text;
      }
      throw new Error(detail);
    }

    return await res.json();
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error(`Cannot connect to backend at ${baseUrl}. Please check your ngrok URL or ensure the Python API is running.`);
    }
    throw err;
  }
}

/**
 * Test connectivity to the backend
 */
export async function testConnection(customUrl) {
  const baseUrl = (customUrl || getApiBaseUrl()).replace(/\/+$/, '');
  try {
    const res = await fetch(`${baseUrl}/chats`, {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
    });
    if (res.ok) {
      const data = await res.json();
      return { ok: true, data };
    }
    return { ok: false, error: `HTTP ${res.status}: ${res.statusText}` };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Create a new chat from a YouTube URL
 * POST /chats -> { thread_id, video_id, title, url }
 */
export async function createChat(videoUrl) {
  return await apiRequest('/chats', {
    method: 'POST',
    body: JSON.stringify({ url: videoUrl }),
  });
}

/**
 * List all existing chats
 * GET /chats -> [{ thread_id, video_id, title, url }]
 */
export async function listChats() {
  return await apiRequest('/chats', {
    method: 'GET',
  });
}

/**
 * Get message history for a specific chat thread
 * GET /chats/{thread_id}/messages -> [{ role, content }]
 */
export async function getChatMessages(threadId) {
  return await apiRequest(`/chats/${threadId}/messages`, {
    method: 'GET',
  });
}

/**
 * Send a message / question to a chat thread (standard full response)
 * POST /chats/{thread_id}/messages -> { answer: string }
 */
export async function sendChatMessage(threadId, question) {
  return await apiRequest(`/chats/${threadId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ question }),
  });
}

/**
 * Stream answer chunk-by-chunk / line-by-line from the backend
 * POST /chats/{thread_id}/messages/stream -> SSE stream { token: string }
 * @param {string} threadId
 * @param {string} question
 * @param {(token: string) => void} onChunk
 */
export async function streamChatMessage(threadId, question, onChunk) {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/chats/${threadId}/messages/stream`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    body: JSON.stringify({ question }),
  });

  if (!res.ok) {
    let errorDetail = `Server error ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson.detail) errorDetail = errJson.detail;
    } catch {
      const text = await res.text();
      if (text) errorDetail = text;
    }
    throw new Error(errorDetail);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep partial line

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;

      const jsonStr = trimmed.slice(5).trim();
      if (!jsonStr) continue;

      try {
        const payload = JSON.parse(jsonStr);
        if (payload.token) {
          onChunk(payload.token);
        }
        if (payload.done) {
          return;
        }
      } catch {
        // Fallback if plain text was sent
        onChunk(jsonStr);
      }
    }
  }

  // Flush remaining buffer
  if (buffer.trim().startsWith('data:')) {
    const jsonStr = buffer.trim().slice(5).trim();
    try {
      const payload = JSON.parse(jsonStr);
      if (payload.token) onChunk(payload.token);
    } catch {
      if (jsonStr) onChunk(jsonStr);
    }
  }
}

/**
 * Helper to extract YouTube video ID from various URL formats
 */
export function extractVideoId(url) {
  if (!url) return null;
  const match = url.match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([A-Za-z0-9_-]{11})/);
  if (match) return match[1];
  if (/^[A-Za-z0-9_-]{11}$/.test(url.trim())) return url.trim();
  return null;
}

/**
 * Get standard YouTube thumbnail URL
 */
export function getThumbnailUrl(videoId) {
  if (!videoId) return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80';
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}
