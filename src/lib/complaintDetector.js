/* complaintDetector.js — does this message sound like frustration/venting,
   not just a plain question? A small deterministic keyword/punctuation
   heuristic, same style as novaKnowledge.js's classify() — not a model, not
   sentiment AI. Lets Ask Nova lead with empathy before the technical fix. */

const FRUSTRATED_WORDS = [
  'ruined', 'wasted', 'trash', 'garbage', 'hate', 'stupid', 'worst',
  'never works', "won't work", 'terrible', 'awful', 'furious', 'so mad',
  'sick of', 'done with', 'give up', "can't believe",
];

const MILD_WORDS = [
  'broke', 'broken', 'burnt', 'burned', 'wrong', 'messed up', 'screwed up',
  'failed', 'flopped', 'annoying', 'annoyed', 'frustrated', 'ugh', 'why won\'t',
  'why does', 'again', 'disappointed', 'upset', 'sucks',
];

/** Rough complaint intensity from message text: 'none' | 'mild' | 'frustrated'. */
export function complaintLevel(text) {
  const q = String(text || '').toLowerCase();
  if (!q.trim()) return 'none';

  let score = 0;
  for (const w of FRUSTRATED_WORDS) if (q.includes(w)) score += 2;
  for (const w of MILD_WORDS) if (q.includes(w)) score += 1;

  // Punctuation signals: repeated "!" or "?", or ALL CAPS words (3+ letters).
  if (/!{2,}/.test(text)) score += 2;
  if (/\?{2,}/.test(text)) score += 1;
  if (/\b[A-Z]{3,}\b/.test(String(text || ''))) score += 1;

  if (score >= 3) return 'frustrated';
  if (score >= 1) return 'mild';
  return 'none';
}

export function isComplaint(text) {
  return complaintLevel(text) !== 'none';
}
