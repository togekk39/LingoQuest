# Online prototype verification record

[Español (Latinoamérica)](VERIFICATION_ONLINE_PROTOTYPE.es-419.md)

The checks on 2026-11-08 ran locally with Node.js 24, system Chromium, and PostgreSQL 16.

| Check                                        | Result                                                     |
| -------------------------------------------- | ---------------------------------------------------------- |
| Strict TypeScript and ESLint                 | Passed.                                                    |
| Fastify API and security integration tests   | 17 passed.                                                 |
| Playwright desktop and 390 px mobile browser | 12 passed.                                                 |
| PostgreSQL migrations and RLS isolation      | Passed with a minimal Supabase Auth stub.                  |
| Expo web production export                   | Passed.                                                    |
| Expo Android Hermes bundle export            | Passed. APK and physical-device verification are separate. |
| Prettier                                     | Passed.                                                    |

Browser tests covered completing a lesson with every answer wrong, skipping speaking, persistent progress, offline downloads and XP credited once on reconnect, isolation when account changes overlap with sync, preserving other accounts' queues during logout and deletion, offline cold start, 40 pronunciation drills, a 12-question assessment, the airport scenario, access to 13 challenge levels, an independent reading time budget, learning progress preserved after failure, and heart deductions applied only once when retrying after a lost response.

Backend tests covered all 320 exercises and 32 lessons, server time, idempotency, JWT and cross-account isolation, 13 levels, private question-pool snapshots, data deletion and export, and unassisted production across days.

RLS tests ran in a disposable PostgreSQL container without connecting to Hosted Supabase. The checks used no paid APIs or cloud deployment. Human curriculum review and educational outcomes were outside their scope. See the [production setup instructions](PRODUCTION_SETUP.md).
