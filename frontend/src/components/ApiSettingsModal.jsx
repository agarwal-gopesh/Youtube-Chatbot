import { useState, useEffect } from 'react';
import { getApiBaseUrl, setApiBaseUrl, testConnection } from '../services/api';

export default function ApiSettingsModal({ isOpen, onClose, onConnected }) {
  const [url, setUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { ok: bool, message: string }

  useEffect(() => {
    if (isOpen) {
      setUrl(getApiBaseUrl());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleTest() {
    if (!url.trim()) return;
    setTesting(true);
    setTestResult(null);
    const result = await testConnection(url.trim());
    setTesting(false);
    if (result.ok) {
      const chatCount = Array.isArray(result.data) ? result.data.length : 0;
      setTestResult({
        ok: true,
        message: `Successfully connected! (${chatCount} active chats on server)`,
      });
    } else {
      setTestResult({
        ok: false,
        message: `Connection failed: ${result.error || 'Server unreachable'}. Verify your ngrok URL and ensure the Python backend is running.`,
      });
    }
  }

  function handleSave(e) {
    e.preventDefault();
    const savedUrl = setApiBaseUrl(url.trim());
    onConnected?.(savedUrl);
    onClose();
  }

  return (
    <div className="modal-backdrop active" onClick={onClose}>
      <div className="api-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="api-modal-header">
          <div className="api-modal-header-left">
            <div className="api-modal-icon">
              <span className="material-symbols-outlined">settings_ethernet</span>
            </div>
            <div>
              <h2 className="text-headline-sm" style={{ color: 'var(--on-surface)' }}>Backend API Connection</h2>
              <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
                Connect to Python API via ngrok or local network
              </p>
            </div>
          </div>
          <button className="api-modal-close" onClick={onClose} aria-label="Close dialog">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="api-modal-body">
          <div className="api-input-group">
            <label className="text-label-md" htmlFor="ngrok-url-input" style={{ color: 'var(--on-surface)' }}>
              Python Backend URL (ngrok or LAN)
            </label>
            <div className="api-input-row">
              <span className="material-symbols-outlined api-url-icon">link</span>
              <input
                id="ngrok-url-input"
                type="url"
                className="api-input text-body-md"
                placeholder="https://xxxx-xx-xx.ngrok-free.app or http://localhost:8000"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setTestResult(null);
                }}
                required
                autoFocus
                spellCheck={false}
              />
            </div>
            <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginTop: 4 }}>
              💡 On the laptop running Python, run <code className="text-code-md code-pill">ngrok http 8000</code> and paste the forwarding HTTPS URL here.
            </span>
          </div>

          {/* Test Status feedback */}
          {testResult && (
            <div className={`api-test-badge ${testResult.ok ? 'success' : 'error'}`}>
              <span className="material-symbols-outlined">
                {testResult.ok ? 'check_circle' : 'error'}
              </span>
              <span className="text-body-sm">{testResult.message}</span>
            </div>
          )}

          {/* Actions */}
          <div className="api-modal-actions">
            <button
              type="button"
              className="btn-test-conn text-label-md"
              onClick={handleTest}
              disabled={testing || !url.trim()}
            >
              {testing ? (
                <>
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: 16 }}>sync</span>
                  <span>Testing...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>sensors</span>
                  <span>Test Connection</span>
                </>
              )}
            </button>

            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <button
                type="button"
                className="btn-modal-cancel text-label-md"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-modal-save text-label-md"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>
                <span>Save & Connect</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
