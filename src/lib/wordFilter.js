/**
 * Content blocklist for usernames and passwords.
 *
 * Client-side moderation is a first line only — it is trivially bypassable and
 * MUST be backed by server-side enforcement (a Postgres trigger / Edge Function
 * that re-checks the username on the `profiles` table). Keep the authoritative
 * list on the backend; this mirror just gives instant feedback in the form.
 *
 * Matching is done on a normalized string (lowercased, leetspeak folded, and
 * separators stripped) so "sh!t", "b_i_t_c_h", "f4ggot" are all caught.
 */

// Roots to block. Kept intentionally short here; the real, maintained list
// lives server-side. Covers common profanity + slur categories.
const BANNED_ROOTS = [
  // profanity
  'fuck', 'shit', 'bitch', 'cunt', 'asshole', 'bastard', 'dick', 'cock',
  'pussy', 'whore', 'slut', 'wank', 'bollock', 'motherfucker', 'jackass',
  // slurs (racial / homophobic / ableist / antisemitic / misogynistic)
  'nigger', 'nigga', 'faggot', 'fag', 'retard', 'tranny', 'kike', 'spic',
  'chink', 'gook', 'wetback', 'coon', 'dyke', 'paki', 'raghead', 'beaner',
];

const LEET_MAP = {
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's',
  '7': 't', '8': 'b', '9': 'g', '@': 'a', '$': 's', '!': 'i',
};

/** Fold leetspeak, drop anything that isn't a letter, lowercase. */
export function normalizeForFilter(input) {
  return String(input || '')
    .toLowerCase()
    .split('')
    .map(ch => LEET_MAP[ch] ?? ch)
    .join('')
    .replace(/[^a-z]/g, '');
}

/**
 * True if the text contains a blocked root once normalized. Substring match is
 * deliberate so decorated variants ("x_faggot_x") are still caught; server-side
 * moderation should refine edge cases (the classic "Scunthorpe" false positives).
 */
export function containsBannedWord(text) {
  const normalized = normalizeForFilter(text);
  if (!normalized) return false;
  return BANNED_ROOTS.some(root => normalized.includes(root));
}
