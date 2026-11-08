# Deferred online prototype — not required by offline 1.2

**This document is historical reference for the earlier Fastify/Supabase online prototype. The current product is the offline edition described in [OFFLINE_EDITION.md](OFFLINE_EDITION.md).** Do not follow the cloud, account, API, speech-provider or deployment setup below to run the current App. Those integrations are intentionally disconnected and await a separate future design.

Current commands are `npm run dev` for Expo only and `npm run build:web` followed by `npm run preview` for a pure static preview. No API server, login, cloud database or paid-provider credentials are needed. `apps/api` and `supabase` remain archived research code, not active runtime dependencies.

---

# Production setup and release gates

LingoQuest is runnable locally with the Expo client and the Fastify/SQLite API.
It does not require OpenAI, Azure or Supabase credentials to run the implemented
learning, practice challenge, account and review flows. No cloud deployment or
external account changes were performed.

The local backend and the Supabase SQL are separate persistence implementations.
The API currently uses SQLite; supplying Supabase environment variables does not
switch it to PostgreSQL. A Supabase repository/Auth adapter is still required
before a hosted Supabase release.

## Local installation

Use Node.js 24 and npm. From the repository root:

```sh
npm ci
npm run dev
```

Use `npm run android` with Android Studio/emulator or an Android device configured
for Expo development. The mobile API URL must point to an address reachable from
the device; `localhost` on a phone refers to the phone. Expo's web target is also
available through the development server and can be exported using
`npm run build:web`.

The local API issues its own short-lived, revocable bearer sessions and hashes
passwords with salted scrypt. These are local application accounts, not Supabase
Auth accounts. Persistent SQLite data includes accounts and learning history.
Protect its directory and back it up as personal data. Account deletion removes
the application's records and revokes its sessions; backups require a separate
retention/deletion policy.

## Before any internet-facing deployment

1. Run `npm run check`, `npm test`, `npm run build:web`, and the SQL security job.
   Run device tests on a low-end Android phone, screen reader and slow network.
2. Serve the client and API over HTTPS. Use a restrictive production CORS origin
   allowlist and rate limits at both the edge and API. Preserve server-side
   validation, token verification, session revocation and body-size limits.
3. Use a dedicated production database volume and a strong, stable server-only
   session signing secret. Keep credentials outside source control and outside
   all `EXPO_PUBLIC_*` variables. The signing secret must not be shared with
   unrelated applications. Rotate it with a planned session revocation process.
4. Add verified email ownership, account recovery, operational monitoring,
   encrypted backups, abuse handling and a documented data retention policy.
   The local email/password flow does not send verification or recovery emails.
5. Have a Spanish-speaking teacher review every published lesson, accepted-answer
   set, explanation, placement item and challenge passage. Original generated
   demo content is marked as draft; its presence is not proof of human review.
6. Complete usability and learning outcome evaluation. A lesson completion or XP
   total is not a claim of long-term mastery. Beta metrics and pronunciation
   fairness require participant studies, not only software tests.

## Supabase staging integration

Create a separate staging project and provide server credentials through the
deployment secret manager. Never paste service-role, OpenAI or Azure secrets into
chat, client configuration or a repository.

Apply these migrations in order using an owner migration connection:

- `supabase/migrations/0001_initial.sql`: supplied learning schema, unchanged.
- `supabase/migrations/0002_dual_mode.sql`: supplied dual-mode schema, unchanged.
- `supabase/migrations/0003_security_and_content_versions.sql`: explicit backend
  privileges, preference-only profile writes, published-parent filters, immutable
  answer archives and same-owner run/submission constraints.

Do not run `supabase/tests/bootstrap.sql` on Supabase. It creates minimal stub
roles and Auth objects solely for disposable PostgreSQL CI. The rollback-only
`isolation.sql` test uses fixture users and also belongs in a disposable test
database, never in a live user project.

The current SQL suite passed on PostgreSQL 16 with the minimal Auth stub. It
checks cross-user reads, forbidden progress/XP writes, private key visibility,
unpublished parent visibility, required backend grants, immutable key versions
and mismatched run ownership. This is not a hosted Supabase integration test.

Before switching the API to Supabase:

- Implement the repository and authentication adapters. Validate real Supabase
  JWT signature, issuer, audience, expiry and revoked/deleted account behavior.
  Derive the user ID from the verified identity on every request.
- Test both real project users against PostgREST and the API. Include exercises,
  completion, mastery, XP, review queues, speech, dialogue and challenge rows.
- Keep `private` out of exposed API schemas. Do not grant clients writes to
  attempts, completions, mastery, XP, runs, submissions or answer archives.
- Prefer a dedicated server database role with only required object privileges.
  Supabase's service-role credential bypasses RLS project-wide; the migration's
  explicit grants do not turn that credential into a narrowly scoped token.
- Use database transactions/row locks for challenge submissions and settlement.
  Preserve idempotency body fingerprints, order checks, run snapshots and
  server-clock deadlines. Select historical answer keys by exact content version.
- Retain immutable prompt/content snapshots as well as answer archives. Publish
  prompt edits as new IDs; never silently mutate questions already used in runs.
- Add an additive migration/adapter representation for relaxed practice with no
  deadline: the supplied `challenge_runs.deadline_at` is currently `NOT NULL`.
  Validate migration behavior against an existing staging dataset before release.
- Import only reviewed, versioned content and keep unpublished rows invisible.
  A published lesson must have a published unit; a published exercise must have
  a published lesson and unit.

## Challenge publication

The implemented demo challenge is explicitly **practice**, not an official
ranked result. All 13 levels can be explored with server scoring and, where
selected, server timing. Practice cannot grant official badges, modify core
learning XP/mastery, or claim a verified ranked unlock.

Before enabling an official track, human-review a sufficiently varied, original
question pool for every level and question type. Verify completion of every
published lesson in the required unit, with at least one required lesson. Then
enforce previous-level passes, fixed rules, separate reading/cloze time budgets,
stable run snapshots and idempotent server-side settlement. Repeated IDs with
different bodies must fail instead of changing the prior event.

No cloud flag should silently label draft content as reviewed. Formal publication
is a content and security release decision that needs explicit implementation
and review, not a client-side toggle.

## Voice and AI providers

The app can use device speech playback and optional recording/replay. The default
speech assessment provider returns an explicit unscorable/not-configured result;
it never invents a pronunciation score or phoneme error.

For Azure Speech Assessment, obtain approval for the paid service and cost cap,
add server-only credentials, disclose third-party processing, validate supported
audio formats and map provider evidence into the shared schema. Do not use ASR
transcripts as pronunciation scores. Silent, noisy or low-confidence recordings
must remain retryable and optional. Do not retain raw voice by default.

The airport/job missions use bounded authored interactions. If an OpenAI feedback
provider is added, set server-side budgets, rate limits, timeouts and structured
output validation; retain deterministic fallback. AI-generated content must not
be auto-published. No paid provider was called for the delivered implementation.
