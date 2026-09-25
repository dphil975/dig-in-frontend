import { useState, useRef, useEffect } from 'react';
import {
  isCameraSupported, openCamera, closeCamera,
  grabSquareFrame, waitForVideoReady, boomerangOrder,
} from '../../../lib/boomerangCapture';
import { pixelateFrames, encodeGif, blobToDataUrl } from '../../../lib/pixelBoomerang';
import './StepBoomerang.css';

const FRAME_COUNT = 8;
const INTERVAL_MS = 110;

/* StepBoomerang — prompts the cook, when they finish a step, to record a
   quick camera burst that gets pixelated and stitched into a looping
   forward↔reverse GIF (Instagram-Boomerang style) of that step, done. */
export default function StepBoomerang({ stepLabel, onSave, onSkip }) {
  const [phase, setPhase]       = useState('prompt'); // prompt | live | processing | done | error
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState(null);
  const [errorMsg, setErrorMsg]   = useState('');
  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  // Bumped only when the user starts a NEW recording — the capture effect
  // below calls setPhase() itself mid-flight (live → processing → done),
  // so keying the effect on `phase` would make its own transitions cancel
  // itself. This id only changes on a genuine (re)start, not on internal
  // phase changes, so a run is never cancelled out from under itself.
  const [recordingId, setRecordingId] = useState(0);

  useEffect(() => () => closeCamera(streamRef.current), []);

  function startRecording() {
    if (!isCameraSupported()) {
      setErrorMsg("Your browser doesn't support camera capture here.");
      setPhase('error');
      return;
    }
    setPhase('live');
    setRecordingId(id => id + 1);
  }

  useEffect(() => {
    if (recordingId === 0) return;
    let cancelled = false;

    (async () => {
      try {
        const stream = await openCamera();
        if (cancelled) { closeCamera(stream); return; }
        streamRef.current = stream;
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();
        await waitForVideoReady(video);

        const frames = [];
        for (let n = 0; n < FRAME_COUNT; n++) {
          if (cancelled) return;
          frames.push(grabSquareFrame(video));
          setProgress((n + 1) / FRAME_COUNT);
          if (n < FRAME_COUNT - 1) await new Promise(r => setTimeout(r, INTERVAL_MS));
        }
        closeCamera(stream);
        streamRef.current = null;
        if (cancelled) return;

        setPhase('processing');
        const ordered = boomerangOrder(frames);
        const pixelFrames = pixelateFrames(ordered, { bitDepth: 64, paletteMode: 'harvest', outputSize: 192 });
        const blob = await encodeGif(pixelFrames, { delay: 90 });
        const dataUrl = await blobToDataUrl(blob);
        if (cancelled) return;

        setResultUrl(dataUrl);
        setPhase('done');
      } catch (err) {
        if (cancelled) return;
        closeCamera(streamRef.current);
        streamRef.current = null;
        setErrorMsg(err?.name === 'NotAllowedError'
          ? 'Camera access denied — check your browser/device permissions.'
          : "Couldn't capture that — try again.");
        setPhase('error');
      }
    })();

    return () => { cancelled = true; };
  }, [recordingId]);

  return (
    <div className="sbm-overlay" role="dialog" aria-modal="true" aria-label="Capture a step boomerang">
      <div className="sbm-card">
        {phase === 'prompt' && (
          <>
            <div className="sbm-icon">⟲</div>
            <h3 className="sbm-title">Capture a boomerang?</h3>
            <p className="sbm-body">Show off this step with a looping pixel-art clip: “{stepLabel}”</p>
            <div className="sbm-actions">
              <button type="button" className="sbm-btn sbm-btn-primary" onClick={startRecording}>
                Record Boomerang
              </button>
              <button type="button" className="sbm-btn" onClick={onSkip}>Skip</button>
            </div>
          </>
        )}

        {phase === 'live' && (
          <>
            <video ref={videoRef} className="sbm-video" muted playsInline />
            <div className="sbm-progress-bar"><span style={{ width: `${progress * 100}%` }} /></div>
            <p className="sbm-hint">Hold steady — capturing…</p>
          </>
        )}

        {phase === 'processing' && (
          <>
            <div className="sbm-spinner" aria-hidden="true" />
            <p className="sbm-hint">Pixelating your boomerang…</p>
          </>
        )}

        {phase === 'done' && resultUrl && (
          <>
            <img src={resultUrl} alt="Your pixel-art boomerang" className="sbm-result" />
            <div className="sbm-actions">
              <button type="button" className="sbm-btn sbm-btn-primary" onClick={() => onSave(resultUrl)}>Save &amp; Continue</button>
              <button type="button" className="sbm-btn" onClick={startRecording}>Retake</button>
              <button type="button" className="sbm-btn" onClick={onSkip}>Discard</button>
            </div>
          </>
        )}

        {phase === 'error' && (
          <>
            <p className="sbm-error">{errorMsg}</p>
            <div className="sbm-actions">
              <button type="button" className="sbm-btn sbm-btn-primary" onClick={startRecording}>Try Again</button>
              <button type="button" className="sbm-btn" onClick={onSkip}>Skip</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
