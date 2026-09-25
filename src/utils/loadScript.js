/* loadScriptOnce — append a legacy /public <script> exactly once per document.

   Most of the legacy scripts under /public declare their API with top-level
   `const`/`class` (e.g. `class DigInAnalytics`, `const SUBSTITUTIONS`). Executing
   one of those a second time throws "Identifier '…' has already been declared".

   A naive `document.body.appendChild(script)` inside a useEffect runs twice in
   React 19 StrictMode (dev double-invoke) and again every time you navigate back
   to the page — each run re-executes the script. Removing the <script> node on
   cleanup does NOT undo the globals it defined, so that doesn't help and actually
   triggers the re-execution.

   This helper keys on the src: the script is appended at most once, kept for the
   life of the document, and any onReady callback fires immediately if it already
   loaded. Pass the same src from as many components as you like — it's a no-op
   after the first call. */

const registry = new Map(); // src -> { el, ready, callbacks }

export function loadScriptOnce(src, onReady) {
  let entry = registry.get(src);

  if (!entry) {
    const el = document.createElement('script');
    el.src = src;
    el.async = true;
    el.dataset.loadOnce = src;
    entry = { el, ready: false, callbacks: [] };
    registry.set(src, entry);

    el.addEventListener('load', () => {
      entry.ready = true;
      const callbacks = entry.callbacks;
      entry.callbacks = [];
      callbacks.forEach(cb => { try { cb(); } catch (e) { console.error(e); } });
    });
    el.addEventListener('error', () => {
      // Let a future call retry if the resource failed (e.g. transient 404).
      registry.delete(src);
    });

    document.body.appendChild(el);
  }

  if (typeof onReady === 'function') {
    if (entry.ready) { try { onReady(); } catch (e) { console.error(e); } }
    else entry.callbacks.push(onReady);
  }

  return entry.el;
}
