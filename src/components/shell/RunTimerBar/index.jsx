import { useState, useEffect, lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';

/* RunTimerBar — the store-run clock, on every page.

   This file is the always-mounted gate and is deliberately tiny: the bar and the
   store-run engine behind it (Bar.jsx → lib/pantry/storeRun, over 1,000 lines
   plus the pantry tools) are only loaded when a run is actually open, so
   everyone who isn't mid-shop doesn't download them. The check is a raw read of
   the same localStorage key the engine writes (`dig_in_store_run`). */

const Bar = lazy(() => import('./Bar'));

function runIsOpen() {
  try {
    const r = JSON.parse(localStorage.getItem('dig_in_store_run') || 'null');
    return !!(r && r.startedAt);
  } catch { return false; }
}

export default function RunTimerBar() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(runIsOpen);

  // A run may have been started or finished on another page.
  useEffect(() => { setOpen(runIsOpen()); }, [pathname]);

  if (!open) return null;
  return <Suspense fallback={null}><Bar /></Suspense>;
}
