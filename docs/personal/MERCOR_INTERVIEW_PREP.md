# Mercor Domain Expert — Interview Prep

**For: Olive Phillips** · Prepared Aug 6, 2026

---

## Read this part first

### 1. Hard requirement: MacBook with an M-series chip

The posting says it twice, and it's a disqualifier, not a preference:

> *All experts on this project must have a Macbook device with an 'M' series chip.* Apple Silicon (ARM) Mac — M-series MacBook Pro, or MacBook Air running **macOS 15 or higher**.

Check now:  → **Apple menu → About This Mac.** You need to see "Apple M1/M2/M3/M4" (not "Intel"), and macOS 15 (Sequoia) or newer.

If you have it, say so unprompted in the interview — it's a screening box and confirming it early removes friction. If you don't, don't bluff it; the assessment task runs on the device.

### 2. That script you were given has invented numbers in it. Don't use them.

I checked every figure against your actual resume. These are **not on it** and were made up by the previous tool:

| In the script | Reality |
|---|---|
| "95% accuracy rate on our test suite" | Not on your resume. Invented. |
| "improved the model's performance by over 20% in two weeks" | Invented. |
| "a suite of 50+ test cases" | Invented. |
| "it once suggested raw chicken in a salad" | Invented anecdote. |
| "leadership approved a fix within 24 hours / praised me" | Invented. |
| The Bank of America "data entry error pattern" story | Invented specifics. |

Two reasons this matters more here than at a normal company:

**The AI interviewer asks follow-ups.** If you say "95% on my test suite," the natural next question is *"how did you define the denominator?"* or *"what was the baseline?"* Invented numbers have no second layer, and the stall is audible.

**There's a paid assessment right after.** The posting says so. That assessment tests whether you can actually write research questions and evaluation materials. If the interview oversells and the assessment underdelivers, that gap is the thing that fails you.

**Your real metrics are already strong and they're on the page:** 87% of trainees certified within 90 days, 12% above target. 94% CSAT. 34% reduction in escalations. 25% engagement lift. 18% shrink reduction. Use those. They're true, and you can answer follow-ups about them.

### 3. This is not a behavioral interview

The script prepped you for a 45-minute STAR recruiter screen. That's not what you're getting:

> *A brief (15-minute) conversation with our AI interviewer to assess **research and reasoning skills**.*

Fifteen minutes. Research and reasoning. That means **maybe five questions**, and they're mostly not "tell me about a time when." STAR is still useful for the one or two背景 questions, but if you STAR everything you'll run out of clock and never show the thing they're measuring.

---

## What they're actually hiring for

Read the job description literally:

> *Creating high-quality **research questions, answers, and evaluation materials** to train advanced language models.*

You will be handed a subject and asked to write questions that are **hard for a model but verifiable by a human**, produce a defensible correct answer with sources, and explain precisely why a wrong answer is wrong.

So the interview is checking three things:

1. **Can you find and judge sources?** (research)
2. **Can you reason out loud, in order, without hand-waving?** (reasoning)
3. **Can you write precisely?** (communication)

Everything below serves those three.

---

## The single most important technique

**Narrate your reasoning, don't just deliver conclusions.**

This is what "reasoning skills" means to an evaluator, and it's the difference between passing and not. A model-graded interview can't see your thinking unless you say it.

Weak: *"I'd research it from multiple sources and write it up clearly."*

Strong: *"First I'd figure out whether the question has one right answer or a contested one, because that changes everything downstream. If it's contested, I'd find the two or three main positions and who holds them. If it's factual, I'd go to the primary source — the actual filing, the actual study — not coverage of it. Then I'd look for one source that disagrees, specifically to see if I've missed something. If I can't find disagreement, that's usually a sign I haven't looked hard enough."*

Same substance. The second one shows the machinery. Do that every time.

---

## The five questions you're most likely to get

### Q1 — "Tell me about your background." (60–90 seconds, no longer)

Fifteen-minute interview. Don't spend four minutes here.

> "I've got about five years across content development, data analysis, and customer operations — and what connects all of it is taking something complicated and making it clear and correct for someone else. At Bank of America I was analyzing financial data for regulatory compliance and writing it up for leadership. At AT&T I was the escalation point for complex technical issues, and I built the knowledge-sharing materials that cut escalations 34%. At Starbucks I designed the training program — 87% of trainees certified within 90 days, 12% above target.
>
> For the past year I've been building an AI-powered food app as founder, and that's where the AI work is real: designing prompts and system instructions for an in-app cooking assistant, and building the evaluation materials to check its answers for accuracy and safety. That's the piece that made this role jump out at me — it's the same work, at a much better scale."

Ends on the relevant thing. Every number in it is true.

### Q2 — "Walk me through how you research a topic you know nothing about."

This is the highest-value question in the interview. It's directly the job.

> "I start by figuring out what kind of question it is, because that decides the method. A settled factual question, a contested one, and a definitional one all need different sourcing.
>
> Then I go for primary sources first — the actual paper, the filing, the standard, the documentation — not an article about it. Secondary coverage introduces errors and I'd rather see what it was before the telephone game.
>
> I use three to five sources minimum, and I specifically look for one that disagrees. If everything I find agrees, I usually haven't looked hard enough, or I've landed inside one community that shares an assumption.
>
> Then I outline before I write, because the outline is where I find out whether I actually understand it. If I can't structure it, I don't know it yet.
>
> And I mark my uncertainty explicitly. If something is contested or I couldn't verify it, I say so rather than smoothing it over — especially for this kind of work, where a confident wrong answer is worse than a flagged gap."

That last paragraph is the one that will score. Calibration is exactly what an AI lab wants in a data contributor.

### Q3 — "How do you evaluate whether a source is reliable?"

> "I look at four things. Who produced it and what they gain from the conclusion. Whether they show their method or just their result — a number with no methodology isn't evidence. How old it is relative to how fast the field moves, since five years is fine in history and useless in AI. And whether it's actually the source or a summary of one, because a lot of what looks like a citation is a link to someone else's paraphrase.
>
> When sources conflict I don't average them. I try to find out *why* they disagree — different data, different definitions, different time windows. Usually the disagreement is the interesting part."

### Q4 — "How would you write a good question to test an AI model?" *(or: what makes an evaluation item good)*

This is the role itself. Have a real answer.

> "A good test question has one verifiable answer, and it's hard for a reason you can name.
>
> The failure mode I'd avoid is a question that's just obscure — trivia doesn't tell you much about reasoning. The better questions are ones where the model has to combine two things it knows, or where the obvious answer is wrong, or where the question contains a false premise it should push back on rather than answer.
>
> And I'd write the grading criteria at the same time as the question, not after. If I can't say in advance what makes an answer correct, complete, and wrong-in-a-specific-way, the question isn't finished. In my own app I did a version of this for the cooking assistant — I cared about accuracy, safety, and tone separately, because an answer can be friendly and still unsafe, and if you grade them as one score you can't see that."

Truthful, specific, and it demonstrates the actual skill.

### Q5 — "Why this role?"

> "Two reasons. The work is what I already do — research, synthesis, and precise writing — but pointed at something that compounds instead of disappearing. And selfishly, I've been on the other side of it this year, building AI features and being frustrated by how the models fail. Being part of the input rather than just the output is the part I want.
>
> The format also fits me — I've worked remote and self-directed for most of my career, so a part-time contract on my own schedule is how I already operate."

---

## Two things on your resume to be ready for

**The order isn't reverse-chronological.** IAPWE (Feb 2019–Mar 2020) sits above Bank of America (Jan 2021). If the interview hasn't happened yet and you can still re-upload, fix it — it's a two-minute change and detail-orientation is literally the first line of the job posting. If it's already submitted, don't raise it.

**Your recent timeline has a jump.** Starbucks ran Jun 2025–Apr 2026 in Houston; the startup is 2025–present; you're now listing New York City. If asked, keep it simple and don't apologize:

> "I was in Houston through this spring — supervising at Starbucks while building the app on the side. I moved to New York a few months ago and I've been full-time on the app since. This role is the right fit alongside it: part-time, remote, on my own schedule."

That's clean, true, and it explains the geography without a story.

---

## Fifteen-minute mechanics

- **Answer in 60–90 seconds.** Not 3 minutes. You'll get maybe five questions; leaving room for follow-ups is how you get the good ones.
- **Answer the question first, then support it.** Don't build to the point.
- **Say "I don't know" if you don't.** Then say how you'd find out. On a *reasoning* assessment this scores well — bluffing scores badly, and it's the exact failure mode they're hiring people to catch in models.
- **Quiet room, wired earbuds if you have them.** It's transcribed. Audio quality affects your evaluation whether or not that's fair.
- **Slightly slower than feels natural.** Transcription errors read as incoherence.
- **Don't read from a script.** Read from bullets. Read-aloud is obvious and flat.

## Your one question at the end

> "What separates the experts whose work actually gets used from the ones who wash out on these projects?"

It's a real question, the answer is useful to you, and it signals that you're thinking about doing the work well rather than just getting hired.

---

## The honest read

You're a strong fit for this and you don't need to embellish. Their bar is 2–3 years of relevant experience plus a bachelor's; you have five-plus years, a BBA, and — unusually for this applicant pool — you've actually shipped an application with LLM features in it and had to decide whether the model's output was good enough. Most people applying have used ChatGPT. You've had to grade it.

Lead with that. It's true, it's rare, and it's exactly the job.
