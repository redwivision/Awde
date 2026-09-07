# Awde — Business Guide

Where the product, the market, and the money meet. Written so **you**, the
owner, know the decisions being weighed, the trade-offs behind each one, and
which ones are still open. Read this before pricing anything or taking the
first payment.

---

## 0. The Current Reality

Awde is a working product with no revenue yet:

- Bilingual (EN/Amharic) AI study tool: mind-maps, Socratic Feynman tutor
  ("Rooty"), concept cards, quizzes, workspace sync.
- Accounts work (Better Auth: Google OAuth + email magic-link), progress syncs
  cross-device, SMTP live.
- AI stack falls back OpenRouter → Groq → NVIDIA → offline templates, so it
  never hard-fails — but **every chat call costs real money** on the live
  providers.
- Hosted free-tier on Render. All code is closed, in one repo, owned by you.
- Built as a web app; mobile-aware UI, but no native app / Play Store build yet.
- MVP plan (see `docs/MVP_PLAN.md`) already asks the "will a student use this
  daily" question; this guide asks "who pays us".

The spread of markets matters more than the product alone:

- Ethiopian students: ~$100–200/yr purchasing power, mobile-money (telebirr,
  CBE Birr, Chapa, Arifpay), Android + low bandwidth, high price sensitivity.
- Ethiopian diaspora (parents): far higher purchasing power, familiar with
  cards, cares about their kids' success back home.
- Schools / tutoring centers / publishers: the real institutional budget.

---

## 1. Decisions Made (with the trade-offs we accepted)

### 1.1 Sell the **tool**, not the **textbooks**

We will NOT resell copyrighted textbooks as the product (the "Notion template
curated textbooks" idea was considered and rejected).

- **Option rejected:** Curate/bundle copyrighted textbooks and sell access.
- **Why rejected:** High legal risk (copyright + platform-policy risk with
  Stripe/PayPal), not defensible, and it would block every reputable payment
  and partner route.
- **Trade-off accepted:** We give up the easiest "instant catalog" path and must
  build value on the tooling + original/teacher content instead. Slower content
  story, but a business we can defend.

### 1.2 Closed source (open-core possible later)

- **Decision:** Keep the code closed.
- **Trade-offs accepted:** No community contributions, no OSS goodwill, no
  GitHub-driven hiring/credibility signal.
- **What we avoided:** Supporting strangers on CI/issues, competitors forking
  our engine for free, and content licensing conflicts (a publisher says "our
  content ships inside your GPL app").
- **Revisit when:** The "generic engine shell" (mind-map canvas, reader) is
  extracted and could go source-available as marketing while the content, sync,
  AI, and auth stay closed.

### 1.3 AI is both the product and a cost — it must be tied to a paid tier

- **Decision:** AI tutoring/personalization lives in the premium tier. The free
  tier must be capped so its AI spend stays solvent.
- **Trade-off accepted:** Free users get a visibly smaller product; the
  acquisition funnel gets weaker, but the unit economics stay sane.
- **Counter-trade-off we declined:** Making AI the free hook to grow fast.
  Would convert users but burn money first — untenable on a free-tier budget.

### 1.4 Web-first today, revisit Android-first for the Ethiopian market

- **Decision:** Keep shipping the web app.
- **Trade-off accepted:** Most Ethiopian students are on Android with limited
  bandwidth; a PWA is installable but the Play Store + offline story is weaker
  than a native app. We defer native until the paid tier proves out.
- **What we get now:** One codebase, fastest iteration, no store fees/approval.

### 1.5 Accounts are the spine — don't sell them, own them

- **Decision:** Free accounts + sync stay free for everyone.
- **Trade-off accepted:** We don't monetize what was hard to build (auth,
  cross-device progress).
- **Rationale:** Accounts are the trust layer and the upsell surface. Charging
  for them now would strangle the funnel before the premium tier exists.

---

## 2. The Recommended Model (the one to build toward)

A **three-layer model**, in order of money:

1. **Freemium subscription (B2C)** — free: limited library + core study tools.
   Premium (monthly/yearly): unlimited workspaces, AI tutoring (Rooty),
   advanced study methods, priority processing. Priced per-market.
2. **B2B licensing (the real revenue)** — private schools, tutoring centers,
   publishers buy bulk seats or institutional licenses. Ethiopian institutions
   have budget; students mostly don't.
3. **Teacher-authored marketplace (v2)** — original, teacher-created content
   (exam prep, supplementary units) with rev-share, instead of copyrighted
   textbooks. Becomes the moat and the content engine.

Each layer de-risks the next: freemium grows the audience, B2B pays the bills,
the marketplace makes us hard to clone.

---

## 3. Open Decisions (decide these before pricing)

### D1. Payments — which rails?
Ethiopia runs on **mobile money**, not cards. Stripe doesn't work there at
scale.

| Option | Trade-off |
|---|---|
| **Chapa (recommended start)** | Works in Ethiopia + accepts international cards; one integration covers domestic + diaspora; newer, smaller brand. |
| **telebirr / CBE Birr direct** | Ubiquitous locally; more integration work, still needs an international card path for diaspora. |
| **Stripe only (diaspora)** | Easiest for diaspora/London users; Ethiopian students can't pay at all. |

**Decision to make:** Pick a PSP; register with them (KYC) so payments aren't a
surprise blocker.

### D2. Currency & price anchoring
One product, wildly different buyers.

- Ethiopian students: ~$…/month in birr (small absolute number, local rail).
- Diaspora parents: ~10–20x that on cards.
- **Decision to make:** Two price points per market? What's the birr anchor?

### D3. Legal entity & jurisdiction
- Question answered by a lawyer/business partner, not code: where to register,
  what type, and how Ethiopia's rules on foreign-owned online services
  (residency/local-partner requirements) apply before taking payments.
- **Decision to make:** Entity setup and where money legally lands.

### D4. Free tier cap & AI cost ceiling
- Need the number: **cost per free user per month** (server + AI tokens on the
  live providers). Until it's measured, the free cap and the premium price are
  guesses.
- **Decision to make:** The exact free-tier limits (workspaces, AI calls/hr).

### D5. Content rights — the single most important decision
- Original content we own? Licensed from a publisher? UGC marketplace?
- Who has rights to what's distributed, in writing? This determines the whole
  content strategy and whether publishers, UGC, or licensed curriculum is the
  path.
- **Decision to make:** Content path + at least one signed/first deal.

### D6. Which is the acquisition hook — AI or study tools?
- Free study tools + paid AI? (sane economics, weaker hook)
- Free/cheap AI + paid tools? (stronger draw, higher COGS)
- **Decision to make:** Pick one; it drives the COGS ceiling and the funnel.

---

## 4. Smart Questions to Keep Asking

1. **What is the moat?** If someone clones the UI in a month, what keeps users?
   (Answer should be: content/community/offline network effects — not React
   code.)
2. **Who is the first paying customer?** One school contract or 10 diaspora
   parents matters more than 100k free users.
3. **What does one free user cost per month?** Measure it before pricing.
4. **Android-first or web-first at growth?** Watch the current Ethiopian
   segment's device/bandwidth reality.
5. **What's the compliance surface?** Ethiopian data-protection regime for
   collecting students' data; the Privacy & Terms UI we already ship must match
   real obligations.
6. **Reference customers:** Which school/teacher/tutor would validate this in
   the first 90 days?

---

## 5. The One-Line Summary

> **Own the tool and the content pipeline, sell access to Ethiopian students
> cheap via mobile money, license bulk seats to institutions, charge diaspora
> parents premium prices, keep the code closed, cap the free AI tier — and
> never ship textbook content you don't have the rights to.**

The next move is not the subscription UI: it's **D5 (content rights)** and
**D1 (payment rails)**. Everything follows.