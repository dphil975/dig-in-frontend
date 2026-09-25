/* liftSignal.js — the thing reply-counting alone can't see: not just that
   someone wrote back, but that they lifted the person up when they did it.

   Born from a straight ask: "depthRank.js already rewards replying and
   answering. Needs the lifting-another-woman signal specifically." The app's
   whole thesis is that community here isn't paid for or performed — it's
   built by people showing up for each other, the way the original product
   brief put it: women don't scroll past each other, they answer.

   Kept gender-neutral IN THE ACTUAL MATCHING on purpose. A text-only detector
   has no honest way to know who's on either end of a comment — the choices
   are either invent a gender field nothing else in this app has, or guess
   from a name, and guessing from a name is worse than not gating at all. So
   this recognizes the ACT — encouragement, solidarity — not who's doing it,
   which is the only version of "reward lifting each other up" that doesn't
   quietly misjudge someone. depthRank.js, which already speaks in "she" for
   its example author, keeps that voice where it already lives; the matching
   logic here just doesn't require it to fire.

   Two recognized kinds, each pointing at something the app already half-built
   and had nothing real to feed:

     ENCOURAGE   cheering someone on, directed at them, not the dish —
                 "proud of you," "you've got this," "so happy for you."
                 Feeds happinessEngine.js's Kindness Chain + Helping Hand
                 (both fully wired, zero callers before this).
     RELATE      "I've been there too" — solidarity, not praise. This is the
                 "We've Been There" reaction the original brief named and
                 nothing had built. Feeds nurture.js's resonance signal once a
                 caller can read real comment text per post.

   Same honesty posture as kindnessProtocol.js's classify(): a lightweight
   keyword/pattern net, not a sentiment model, and not a claim to be one. It
   will miss real lifts and occasionally flag a borderline one. The failure
   mode is deliberately "count a little less than you should" — never invent
   support that wasn't actually written. */

// Multi-word phrases, matched as substrings against lowercased text. Almost
// all of these already contain "you/your" — genuine encouragement is
// person-directed by nature, which is exactly what separates this from
// generic food praise ("looks delicious," "yum") that depthRank.js's plain
// reply weight already covers without needing to call it a lift.
const ENCOURAGE_PHRASES = [
  'proud of you', 'so proud', "you've got this", 'you got this',
  'you can do this', 'keep going', "you're doing great", 'you are doing great',
  "you're doing amazing", 'you are doing amazing', "you're amazing", 'you are amazing',
  "you're inspiring", 'you are inspiring', 'you inspire me', 'you inspired me',
  'so happy for you', 'happy for you', "you've come so far", 'look how far you',
  'rooting for you', 'in your corner', 'i believe in you', 'sending love',
  'sending you love', 'this made my day', 'you deserve this', 'well deserved',
  "you're so strong", 'you are so strong', 'i see you', 'so inspired by you',
  'thank you for sharing this', "you should be proud", 'i\'m proud of you',
  'you\'re killing it', 'you are killing it', 'go you', 'yes girl', 'yes queen',
  "you're glowing", 'so happy for u', 'proud of u',
];

const RELATE_PHRASES = [
  "i've been there", 'ive been there', 'been there too', "we've all been there",
  'weve all been there', 'same here', 'story of my life', 'this is so relatable',
  'i needed this', 'needed to hear this', 'needed to see this', 'felt this in my soul',
  'this is literally me', 'this is so me', "we've all struggled", 'weve all struggled',
  "you're not alone", 'you are not alone', "i'm right there with you",
  'im right there with you', 'this hit home', 'this hits home', 'i relate to this',
  'i relate so much', 'this is me too', 'same boat', 'in the same boat',
];

function hasAny(text, phrases) {
  return phrases.some((p) => text.includes(p));
}

/**
 * Read a piece of reply/comment text. Returns:
 *   { isLift: false, kind: null, why: null }
 *   { isLift: true, kind: 'encourage'|'relate', why: '<one-line reason>' }
 *
 * `kind` matters downstream — encourage feeds Kindness Chain / Helping Hand
 * (an act of support offered), relate feeds resonance (a shared experience
 * named). Checked in that order because "I've been there, you've got this"
 * — a comment can honestly be read as relate even when it also encourages;
 * relate is the harder, more specific thing to say, so it takes priority
 * when both are present rather than being swallowed by the more common one.
 */
export function classifyLift(text = '') {
  const clean = String(text || '').trim();
  if (!clean) return { isLift: false, kind: null, why: null };
  const t = clean.toLowerCase();

  if (hasAny(t, RELATE_PHRASES)) {
    return {
      isLift: true,
      kind: 'relate',
      why: 'reads as "I\'ve been there too" — solidarity, not just a compliment.',
    };
  }
  if (hasAny(t, ENCOURAGE_PHRASES)) {
    return {
      isLift: true,
      kind: 'encourage',
      why: 'reads as encouragement aimed at the person, not just the dish.',
    };
  }
  return { isLift: false, kind: null, why: null };
}

/** Does this text read as a lift at all? Convenience for callers that only
    need the boolean (e.g. a UI deciding whether to show a small confirmation). */
export function isLiftingReply(text) {
  return classifyLift(text).isLift;
}
