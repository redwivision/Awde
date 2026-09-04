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

We do **not** collect your name, address, phone number, photos, or device
fingerprint. We do not sell or share personal data with advertisers.

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

Awde uses a hosted AI model (e.g. Gemini) to explain concepts, grade Feynman
explanations, and generate quizzes. Free-text you type is sent to the AI
provider to get an answer. Awde runs both an automated content-safety filter
and a strict safety instruction on the model, but **no automated filter is
perfect** — we recommend using the app together with a young student.

## 6. Deleting your data

- **Local-only data:** clearing your browser storage (or using "Clear site
  data") removes everything from the device.
- **Account data:** in the app, open **Account → Delete my account and data**.
  This permanently erases your profile, synced books, study history, sessions,
  and login tokens from the server. You can also email us at any time to
  request deletion.

## 7. Contact

Privacy questions or deletion requests: email the address listed on Awde's
landing page. We aim to respond within 30 days.