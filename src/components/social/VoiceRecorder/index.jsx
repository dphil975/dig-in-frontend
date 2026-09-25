import { useRef, useState, useEffect, useCallback } from 'react';
import './VoiceRecorder.css';

/* VoiceRecorder — record a short voice answer in the browser (MediaRecorder),
   the literal version of "turn the mic on the public." Outputs a base64 data
   URL the same way the photo picker does, so it stores in the post's `audio`
   field with no new infra. Capped short so payloads stay reasonable.

   Honest about limits: if the browser can't record or mic permission is denied,
   it says so and gets out of the way — text and photo answers still work. */

const MAX_SECONDS = 60;
const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];

const supported = () =>
  typeof window !== 'undefined' && !!window.MediaRecorder && !!navigator.mediaDevices?.getUserMedia;

function pickMime() {
  for (const m of MIME_CANDIDATES) {
    try { if (window.MediaRecorder.isTypeSupported(m)) return m; } catch { /* ignore */ }
  }
  return '';
}

export default function VoiceRecorder({ value, onRecorded, onClear }) {
  const [status, setStatus] = useState('idle');   // idle | recording | error
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const recRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  const cleanup = useCallback(() => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const stop = useCallback(() => {
    try { recRef.current?.state === 'recording' && recRef.current.stop(); } catch { /* ignore */ }
    clearInterval(timerRef.current);
  }, []);

  const start = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMime();
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        cleanup();
        setStatus('idle');
        const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => onRecorded(String(reader.result || ''));
        reader.readAsDataURL(blob);
      };
      recRef.current = rec;
      rec.start();
      setStatus('recording');
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed((s) => {
          const next = s + 1;
          if (next >= MAX_SECONDS) stop();
          return next;
        });
      }, 1000);
    } catch {
      cleanup();
      setStatus('error');
      setError('Mic access was blocked — you can still answer with text or a photo.');
    }
  }, [cleanup, onRecorded, stop]);

  if (!supported()) return null;

  // Already recorded → preview + re-record / remove.
  if (value) {
    return (
      <div className="vr vr-done">
        <span className="vr-badge">🎙 Voice answer</span>
        <audio className="vr-audio" controls src={value} />
        <button type="button" className="vr-clear" onClick={onClear}>Remove</button>
      </div>
    );
  }

  return (
    <div className="vr">
      {status === 'recording' ? (
        <button type="button" className="vr-btn vr-stop" onClick={stop}>
          <span className="vr-dot" /> Stop · {elapsed}s
        </button>
      ) : (
        <button type="button" className="vr-btn" onClick={start}>
          🎙 Answer in your voice
        </button>
      )}
      {status === 'recording' && (
        <span className="vr-hint">recording… up to {MAX_SECONDS}s</span>
      )}
      {error && <span className="vr-error">{error}</span>}
    </div>
  );
}
