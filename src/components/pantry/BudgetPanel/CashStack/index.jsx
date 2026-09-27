import { cashBreakdown, cashInWords } from '../../../../lib/appSkins';
import './CashStack.css';

/* CashStack — an amount, drawn as bills and coins you can count.

   This exists because a numeral is easy to not feel. Two findings back it:
   parting with cash is measurably more painful than tapping a card (which is
   exactly why people spend less with it), and the DENOMINATION EFFECT
   (Raghubir & Srivastava, 2009) — the same sum is less likely to be spent
   when it's held as one large bill than as many small ones. Form changes the
   decision, so drawing the form is doing real work, not decoration.

   Deliberately drawn with CSS rectangles, not currency imagery: this must
   read as play money, the way Monopoly money does. Something that looked
   like a photographed dollar would be both legally dumb and psychologically
   wrong — the point is a countable token, not a convincing banknote.

   Accessibility: the stack is aria-hidden and a single spoken sentence
   ("a fifty, a five, a one and two quarters") carries the whole meaning, so a
   screen reader gets the amount as money rather than as sixteen unlabeled
   divs. Bills also carry their value as TEXT, never as color alone. */

const MAX_PER_STACK = 6;   // beyond this, draw a few and say "×N"

export default function CashStack({ amount, size = 'md', label = null }) {
  const { stacks, negative } = cashBreakdown(amount);
  const words = cashInWords(amount);

  if (!stacks.length) {
    return (
      <p className={`cash cash-${size} cash-empty`}>
        <span aria-hidden="true">—</span>
        <span className="sr-only">nothing left</span>
      </p>
    );
  }

  return (
    <div className={`cash cash-${size}${negative ? ' cash-negative' : ''}`}>
      <div className="cash-rows" aria-hidden="true">
        {stacks.map(s => (
          <div className="cash-row" key={s.value}>
            <div className="cash-pile">
              {Array.from({ length: Math.min(s.count, MAX_PER_STACK) }).map((_, i) => (
                <span
                  key={i}
                  className={`cash-note cash-${s.kind} cash-d${String(s.value).replace('.', '')}`}
                  style={{ '--i': i }}
                >
                  {s.label}
                </span>
              ))}
            </div>
            {/* Only count what needs counting. "×1" beside a single visible
                bill is noise restating what the eye already did — the number
                earns its place at two or more, where the pile overlaps. */}
            {s.count > 1 && <span className="cash-count">×{s.count}</span>}
          </div>
        ))}
      </div>
      <p className="sr-only">{label ? `${label}: ` : ''}{words}</p>
    </div>
  );
}
