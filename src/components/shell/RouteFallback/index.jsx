import './RouteFallback.css';

/* What shows while a page chunk is on its way and there is nothing on screen yet
   (the first load, or a direct link). It stays invisible for a quarter of a second,
   so a fast load never flashes it. */
export default function RouteFallback() {
  return (
    <div className="rfb" role="status" aria-live="polite">
      <span className="rfb-dots" aria-hidden="true"><i /><i /><i /></span>
      <span className="rfb-sr">Loading</span>
    </div>
  );
}
