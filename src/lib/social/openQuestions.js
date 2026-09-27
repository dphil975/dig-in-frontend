/* openQuestions.js — the "open questions" on the Discover page and in the
   community feed. App-authored prompts, honestly: they go to Ask Nova or the
   Table (real places to talk), never dressed up as a stranger's post.

   `to` is a page path, or 'ask-nova' to open Ask Nova with the question already
   typed in. */

export const OPEN_QUESTIONS = [
  { q: 'what do i do with half a fennel?', tags: ['#fridgeraid', '#useitup'], to: 'ask-nova' },
  { q: 'greek yogurt instead of sour cream — fine or not?', tags: ['#swaps'], to: 'ask-nova' },
  { q: "dinner from eggs, bread, and whatever's in the fridge door?", tags: ['#girldinner', '#brokebutfancy'], to: '/craving' },
  { q: 'my rice went mushy. can i still save it?', tags: ['#itriedmybest'], to: 'ask-nova' },
  { q: "what's everyone actually cooking tonight?", tags: ['#thetable'], to: '/table' },
];

/** Take someone to where a question is answered. */
export function goToQuestion(question, to, navigate) {
  if (to === 'ask-nova') {
    try { window.dispatchEvent(new CustomEvent('dig_in_open_nova', { detail: { question } })); } catch { /* ignore */ }
    return;
  }
  navigate(to);
}
