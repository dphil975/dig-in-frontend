/* circlesApi.js — thin client for /api/circles.

   The one backend surface that authorizes by the caller's REAL Supabase
   access token (node/routes/circles.js verifies it server-side and forwards
   it to PostgREST so RLS's auth.uid() policies apply) rather than a
   client-supplied user_id — so every call here attaches the current
   session's token, not getUserId(). */

import { supabase } from './supabase';

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function asJson(res) {
  try { return await res.json(); } catch { return null; }
}

export async function listCircles() {
  try {
    const res = await fetch('/api/circles', { headers: await authHeaders(), signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await asJson(res);
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

export async function createCircle({ name, description }) {
  const res = await fetch('/api/circles', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ name, description }),
    signal: AbortSignal.timeout(8000),
  });
  const data = await asJson(res);
  if (!res.ok) throw new Error(data?.error || 'Failed to create circle.');
  return data;
}

export async function joinCircle(id) {
  try {
    const res = await fetch(`/api/circles/${id}/join`, {
      method: 'POST', headers: await authHeaders(), signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch { return false; }
}

export async function listMembers(id) {
  try {
    const res = await fetch(`/api/circles/${id}/members`, { headers: await authHeaders(), signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await asJson(res);
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

export async function listPosts(id) {
  try {
    const res = await fetch(`/api/circles/${id}/posts`, { headers: await authHeaders(), signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await asJson(res);
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

/** Returns { ok, post } on success, or { ok: false, error, rung, held } — the
    Kindness Filter's warn/mute/ban responses carry the same copy the Nest's
    kindnessProtocol.js demo already shows, surfaced here for a real post.
    `sharePublic` (default false) lets the author opt this answer into the public
    weekly Issue; the server stores it defensively so posting works pre-migration. */
export async function createPost(id, { text, image, audio, sharePublic = false }) {
  const res = await fetch(`/api/circles/${id}/posts`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ text, image: image || '', audio: audio || '', share_public: !!sharePublic }),
    signal: AbortSignal.timeout(12000),
  });
  const data = await asJson(res);
  if (!res.ok) return { ok: false, error: data?.error || 'Failed to post.', rung: data?.rung, held: data?.held };
  return { ok: true, post: data };
}

/** This week's PUBLIC answers — the ones authors chose to share — for the
    weekly Issue. Anonymized (no user_id). Empty until migration 010 has run. */
export async function getPublicIssue() {
  try {
    const res = await fetch('/api/circles/public-issue', { headers: await authHeaders(), signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await asJson(res);
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}
