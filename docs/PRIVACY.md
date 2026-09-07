# Awde Privacy Policy

_Last updated: September 2026_

> **Users see this policy inside the app** — there is a "Privacy & Terms" link
> in the landing-page footer, at the bottom of the Account modal, and on the
> first-use consent gate. This file is the source-of-truth copy; the in-app
> modal (`src/components/PrivacyModal.tsx`) is the public-facing version. Keep
> both in sync.

Awde is a study app made for students (including minors). This policy is short
on purpose and written to be honest: **Awde collects as little personal data as
possible — and no learning data without an account.**

## 1. What we collect

| Situation | Data we store | Where |
|---|---|---|
| Using the app with no account (default) | All of your books, mastery scores, quiz results, Feynman sessions, flashcards | Your own device (`localStorage`) — never sent to a server |
| Creating an account (+ syncing) | Your **email** (only to log you in), plus your books and study events (so they follow you across devices) | Our database (e.g. Neon) |
| Asking the AI for help | The question/explanation you type (sent to the AI model to answer it) | Transmitted to the AI provider; learned content may sync if logged in |
| Generating a mind-map or quiz | Generated study content only — **not** your typed recall/chat text | Cached server-side (see §5a) so repeat requests cost nothing |

We do **not** collect your name, address, phone number, photos, or device
fingerprint. We do not sell or share personal data with advertisers.

## 5a. The study-content cache

When a database is configured, the mind-maps and quizzes Awde generates are
**cached server-side keyed by a hash** of the topic + textbook text + options
(`generated_units`). Benefits: two students studying the same topic get the
same high-quality unit, and repeat requests are served instantly with zero AI
cost. This cache stores **only generated study content** — never your typed
recall/chat text (the most private data) and no personally-identifying
information. Each stored unit records a coarse, non-identifying fingerprint of
who first generated it (for curation only). You can request its removal with
§7.

## 2. Learning data & personalization

Awde's goal is to adapt to each student's personal "learning spot" — pacing,
harder-easier material, and which study methods stick. To do that, when you are
**signed in** we may use your learning activity (quiz results, mastery scores,
Feynman sessions, time studied, study events) to:

- tune future content to your pace and strengths
- recommend what to review next
- shape how explanations are phrased

This is **learning data, not identity data** — it is tied to your email address
only so it can follow you across devices, and it is never sold or shared with
advertisers. No account → no learning data leaves the device at all.

## 3. A note for parents & guardians

- Awde is intended for students **13 and older**, or any age with a parent or
  guardian's permission. The app asks the student to confirm this before first
  use (the age gate), and records only that local confirmation.
- Without an account, **nothing leaves the device**.
- With an account, the only personally-identifying data we store is the email
  used to log in; everything else is learning content used for personalization.

## 4. Accounts & magic links

Logging in is passwordless: you request a one-time link to your email and tap
it. We never ask for or store your password. Login links expire after 15
minutes; sessions last 30 days.

## 5. The AI

Awde uses a hosted AI model (via OpenRouter, with Groq/NVIDIA as fallbacks) to explain concepts, grade Feynman
explanations, and generate quizzes. Free-text you type is sent to the AI
provider to get an answer. Awde runs both an automated content-safety filter
and a strict safety instruction on the model, but **no automated filter is
perfect** — we recommend using the app together with a young student.

## 6. Deleting your data

- **Local-only data:** clearing your browser storage (or using "Clear site
  data") removes everything from the device.
- **Account data:** in the app, open **Account → Delete my account and data**.
  This permanently erases your profile, synced books, study history, sessions,
  and login tokens from the server. You can also use the in-app **Contact us**
  form (or email `lewikb13@gmail.com`) at any time to request deletion.

## 7. Contact

Privacy questions, feedback, or deletion requests: use the in-app **Contact
us** form (landing-page footer, or **Account → Contact us**), or email
`lewikb13@gmail.com` — the same address shown in the app. We aim to respond
within 30 days.