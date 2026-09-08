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

## 2a. Optional study groups (teacher/community dashboards)

Awde's **Groups** tab lets students learn together voluntarily — and is built so
that sharing can never be turned into authority. The rules:

- **Opt-in consent is the join action.** A student joins a group by entering the
  owner's short code **and picking a display name**. Until they join, nobody can
  see any of their activity. Joining shares only aggregated, anonymous stats for
  that group: total study events, quiz average, mastery, focus minutes, and
  day-streak.
- **No real identity is ever exposed.** The group owner (and the roster
  endpoint) only ever sees the display names members chose. Your real name,
  email, and the explanations you type to Rooty are never shown to the group.
- **Anyone can create a group.** Any signed-in user can own one — friend study
  groups are equally valid as classroom groups. There is no privileged "teacher
  role" that can force or see beyond what students opt into.
- **Leave any time; data leaves with you.** Leaving deletes your membership row,
  so your aggregated stats instantly stop being included in that group's roster
  and insights.
- **Group insights are fully anonymous.** The owner's "curriculum insights" are
  group-wide trends at the concept level (which units students as a whole found
  harder). They are computed from aggregated scores and can never single out an
  individual student — a deliberate design choice so schools can improve
  curricula without gaining leverage over students.

## 3. A note for parents & guardians

- Awde is intended for students **13 and older**, or any age with a parent or
  guardian's permission. The app asks the student to confirm this before first
  use (the age gate), and records only that local confirmation.
- Without an account, **nothing leaves the device**.
- With an account, the only personally-identifying data we store is your email
  (plus, if you log in with Google, the name your Google account provides);
  everything else is learning content used for personalization.

## 4. Accounts & login

Two optional ways to log in (both only when server accounts are enabled):

- **Email magic link** — passwordless: you request a one-time link to your email
  and tap it. We never ask for or store your password. Login links expire after
  15 minutes; sessions last 30 days.
- **Google "Continue with Google"** — standard Google OAuth. You share only the
  Google name and email your Google account provides; we do not receive, store,
  or access anything else from Google (no contacts, no Drive, no mail). Logging
  in with the same email you used for a magic-link account merges the two, so
  your progress follows the same account.

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