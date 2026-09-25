/* podcastApi.js — thin client for /api/podcast. Backend is real and already
   mounted (node/routes/podcast.js), but its POST /episodes endpoint has zero
   auth — anyone could publish an episode. So this client only wires up the
   read side (browsing); no public "submit an episode" UI ships alongside it.
   Same graceful-degrade-to-[]/null shape as every other API client in this
   app (circlesApi.js, journalApi.js, etc.). */

async function asJson(res) {
  try { return await res.json(); } catch { return null; }
}

/** List published episodes, optionally filtered to one tag (the backend's
    own containment filter — see node/routes/podcast.js). */
export async function listEpisodes({ tag } = {}) {
  try {
    const qs = tag ? `?tag=${encodeURIComponent(tag)}` : '';
    const res = await fetch(`/api/podcast/episodes${qs}`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await asJson(res);
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

export async function getEpisode(id) {
  try {
    const res = await fetch(`/api/podcast/episodes/${id}`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return await asJson(res);
  } catch { return null; }
}
