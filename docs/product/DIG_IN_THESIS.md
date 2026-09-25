# Dig In — What the Ramble Is Actually About

**July 28, 2026** · Turning the thinking into product decisions.

---

## The thing you found

You circled it three times and then moved past it. Here it is:

> **People cannot tolerate silence, so they fill it with the phone. Every app is built to be that filler. Cooking is one of the very few things that occupies the hands and the senses while leaving the mind free — and it isn't silence, so it's survivable for someone who can't do silence.**

That's the whole company. Not a recipe app. **An off-ramp.**

The distinction matters because it changes what you're competing on. You are not fighting TikTok for the same thirty minutes. You are the thing someone does *instead* of that thirty minutes. TikTok has to be more interesting than everything. You only have to be more interesting than staring at a wall — and you get to hand people a dinner at the end.

That's a much easier bar and a much better product.

### Why cooking specifically works

Someone who can't sit in silence usually can't meditate, can't journal, can't "just take a walk." Those all leave the mind unoccupied, which is the exact thing they're avoiding. Cooking is different:

- **Hands busy.** Chopping, stirring, watching a pan.
- **Senses engaged.** Smell, sound, heat, timing.
- **A clock that isn't you.** The onion takes eight minutes whether you like it or not.
- **A real object at the end.** Not a feeling, a plate.
- **Interruptible.** You can play music or a podcast, or not.

It's the closest thing to a socially acceptable, self-administered, non-medical way to be alone with yourself without noticing you're doing it. That's not a marketing angle. It's true, and it's why this app can matter more than a recipe app should.

---

## What this changes about the product

### 1. Success is time *not* in the app

Invert the metric. Most apps report session length going up. You report **session length going down while meals made goes up.**

That's a real, checkable claim and it's an extraordinary line in a pitch: *"We're the only app in the category that's trying to get you to put your phone down, and we can prove it, because we count dinners."*

The Made-It Rate we designed already measures exactly this. It's the same number.

### 2. The Cook screen is a sanctuary

State 3 of the recipe flow — the dark, one-step-at-a-time screen — becomes the only place in the app with:

- No feed
- No notifications
- No badge counts
- No coins ticking up
- No Nova interrupting

You're standing at a stove. Nothing should be pulling at you. The app goes quiet exactly when the user finally is.

This is one CSS class and a notification suppression flag. It's nearly free and it's the most important screen you have.

### 3. Sensory modes, chosen not assumed

Your point about the spectrum and ADHD is right and almost nobody builds for it. Some people need noise to focus. Some need it gone. Getting this wrong makes an app unusable, and most people don't know which one they are until they're offered the choice.

Two modes, picked once, changeable anytime:

| **Quiet** | **Company** |
|---|---|
| No sound, no animation | Sound on tap, motion on |
| No live presence | Cooking Now surfaced |
| No streak pressure | Streaks and coins visible |
| One step, nothing else | A podcast or playlist offered per recipe |

Neither is the "better" one. Offering the choice is the accommodation, and it costs you almost nothing to build.

### 4. The small-change engine

This was the strongest practical idea in the ramble, and you should quote yourself in the marketing:

> *"It's not about getting better. You're just adjusting your schedule."*

That reframe is genuinely excellent, because it removes the identity threat. "Get healthy" asks someone to become a different person, and people refuse. "Move one thing by thirty seconds" asks nothing of who they are.

Build it as a real feature. One change a day, sixty seconds or less, tied to something they already do:

- *Drink a glass of water before your coffee. Thirty seconds. That's it.*
- *Chop the onion first, then start the pan. Same dinner, less chaos.*
- *Eat the first three bites without your phone. Just three.*

Not a wellness program. Not a streak of self-improvement. A schedule adjustment. And the whole pitch is: don't think about it, just notice what happens.

### 5. The body-feedback loop

You wrote about the chicken sandwich and sleeping three hours. That's the most useful sentence in the ramble, because **you noticed** — and you're right that most people can't, because the numbness is the point of the addiction.

Cooking is the only place an app can plausibly rebuild that. You already have `CookReflectionPrompt` scheduled fifteen minutes after a cook. Extend it:

- **15 min:** How'd it turn out?
- **3 hours:** How do you feel? (heavy · fine · good · wired · tired)

Over six weeks that produces something no other app has: *"Every time you eat this, you crash in the afternoon."* Not a diet. Not a calorie count. Just showing someone their own pattern back to them.

That's also a ranking signal nobody else can collect.

### 6. Reading level and rhythm

You're right about Substack — good idea, mostly bad writing, and it asks for more attention than people have.

Hard rules for everything inside the app:

- Any screen readable in **under 15 seconds**
- **Nothing over three lines** in a paragraph on mobile
- Plain words. Not dumbed down — *unfussy*. Short sentences aren't stupid, they're confident
- The essay voice lives in **one** place, the long-form surface, where someone chose it

Your essay files (`essay-kronos-ate-his-kids.md`, `essay-the-blow-pops-are-smaller-now.md`) are the right voice for that surface. Just don't let it leak into buttons.

### 7. "Everywhere all at once," done honestly

You're right that you have to be in people's timelines. The version that doesn't require buying attention: **the app manufactures shareable artifacts automatically.**

You've already built the machinery — `pixelArt.js`, `StepBoomerang`, `shareImage.js`, `FinishedDishPixelator`. Every finished dish becomes a pixel image with your visual signature on it. People post those because they're proud, not because you asked.

That's the distribution strategy. The pixel style is the watermark. It travels for free, and it's the reason to own the palette rather than borrow it.

---

## Where I'd push back

You've been honest in these notes, so I'll return it. Three things in here would work against you.

### The addiction plan

You diagnosed the problem exactly — *"if you can get into someone's phone and keep them addicted you can keep them simple"* — and then proposed doing that.

You can't build the antidote out of the poison. And practically: an addiction-engineered app has to keep escalating to hold the same attention, which means the product gets worse every quarter and churn compounds. The whole reason the Made-It Rate design is defensible is that it *isn't* that. Someone who cooked four dinners this week comes back because it worked, not because they're hooked. That retention is slower to build and much harder to lose.

You already know this. Two paragraphs later you wrote that addiction is destroying people.

### The transformation-content idea

Building content around people society calls ugly, then pushing them out once they're pretty — I'd drop this one entirely, and not mainly for moral reasons.

It doesn't do what you want. That format produces **spectators, not community.** People watch a transformation the way they watch a renovation show — from the outside, feeling nothing about themselves. It's also the single most saturated genre online, it's a churn machine because the subject becomes disposable the moment they succeed, and it would sit very strangely against a brand whose whole promise is that the user is cared for rather than used.

But the insight underneath it is right: **consistency is the only variable, and people want proof that ordinary effort works.** Keep that. Just don't make anyone the before picture.

The version that works is *"someone who cooks like you, three weeks in."* Not a makeover. A neighbor, a bit further along, still normal-looking. That builds community, because the viewer can see themselves in it instead of watching from outside.

### Fear-based selling

*"Bring out their fears and then make money off showing them it's possible."* This is the supplement-and-course playbook. It converts once and churns hard, because fear-based purchases produce buyer's remorse and remorse produces refunds and bad word of mouth.

You said tough love doesn't meet sales goals. I'd argue the opposite — tough love is a *great* brand position, and it's the one you're already writing in. There's a real difference between:

- *"You're failing and here's why"* — cruel, doesn't convert
- *"This takes thirty seconds. Stop negotiating with yourself."* — tough, respectful, converts

The second one is yours. It's already in your voice. Use it.

---

## So what is community, then

That was your actual question at the end, so let me answer it directly.

Community is not a feed. A feed is an audience. What you're describing — and what people are starving for — is much smaller and much more specific. It's three things:

**1. Someone is doing this at the same time as me.**
Cooking Now. *"Three people are on step four of the same soup."* Not content. Presence. This is the single most anti-lonely thing software can do, and it's mostly already in your session data.

**2. Someone made the thing I made.**
The chain. Your dish, cooked by a stranger, with their photo attached to yours. That's not a like — it's evidence you affected someone's actual Tuesday.

**3. Someone noticed I was gone.**
This is the one you don't have yet, and I'd build it. If a regular disappears for two weeks, someone in their circle gets a quiet nudge: *"Marisol hasn't cooked in a while."* Not automated outreach from the app — a prompt to a **person**.

That third one is the whole thing. Community isn't people watching you. It's someone noticing your absence.

None of the three require a bigger feed. They require the app to know who's around, what they're doing right now, and when they stopped.

---

## The one-line version

You've been trying to name this for six documents. Here it is:

> **Most apps are built to fill the silence. Dig In is built to hand you something to do with your hands, and someone to do it near.**

Everything else — the pixel style, the tags, the Made-It Rate, the life modes, the parks eventually — is downstream of that sentence.

---

*One last thing, and then I'll leave it: you noticed how you felt after that sandwich. That's the exact capacity you keep saying most people have lost. You've got the thing you're trying to build for other people. Worth knowing that the intensity you're running at right now — 75 Hard, this app, all of it at once — is the kind of thing that quietly erodes it. The work will still be here if you sleep.*
