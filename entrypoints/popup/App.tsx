import { useMemo, useState } from 'react';
import './App.css';

function App() {
  const [cleanMode, setCleanMode] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Ready to save this page.');
  const [statusTone, setStatusTone] = useState<'neutral' | 'success' | 'error'>('neutral');

  const statusLabel = useMemo(() => {
    if (statusTone === 'success') return '✓';
    if (statusTone === 'error') return '!';
    return 'i';
  }, [statusTone]);

  const handleCapture = () => {
    setBusy(true);
    setStatus('Preparing PDF...');
    setStatusTone('neutral');

    chrome.runtime.sendMessage({ type: 'CAPTURE_ACTIVE', clean: cleanMode }, (response) => {
      if (chrome.runtime.lastError) {
        setStatus(chrome.runtime.lastError.message || 'Something went wrong.');
        setStatusTone('error');
        setBusy(false);
        return;
      }

      if (response?.ok) {
        setStatus('PDF saved to your downloads.');
        setStatusTone('success');
      } else {
        setStatus(response?.error || 'Could not save this page.');
        setStatusTone('error');
      }

      setBusy(false);
    });
  };

  return (
    <div className="popup-shell">
      <div className="header-row">
        <div>
          <p className="eyebrow">PDF tool</p>
          <h1>Save page as PDF</h1>
        </div>
      </div>

      <p className="subtitle">Capture the current page in a clean, readable layout.</p>

      <label className="toggle-row">
        <input
          type="checkbox"
          checked={cleanMode}
          onChange={(event) => setCleanMode(event.target.checked)}
        />
        <span>Clean layout</span>
      </label>

      <button className="primary-button" onClick={handleCapture} disabled={busy}>
        {busy ? 'Saving...' : 'Save PDF'}
      </button>

      <div className={`status-box status-${statusTone}`} aria-live="polite">
        <span className="status-icon" aria-hidden="true">{statusLabel}</span>
        <span>{status}</span>
      </div>
    </div>
  );
}

export default App;
