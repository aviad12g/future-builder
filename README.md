# Future Builder

[Open the public app](https://future-builder.aviadcoh.chatgpt.site) · Sign in to save your own progress.

A personal application for energy-aware focus, SAT study, serious engineering work, and university preparation. Built with React 19, TypeScript, Vinext, Cloudflare D1, and the Sites authentication boundary.

## Run and verify

Use Node 24 (or a compatible recent Node version with TypeScript stripping).

```sh
npm ci
npm run dev
npm run typecheck
npm test
npm run build
```

The generated Drizzle migration in `drizzle/` must be applied to local D1 before saving records locally. Sites applies it during deployment. Use the local Sites sign-in link in the demo banner; production identity is supplied by Sites. The preview uses example data until a signed-in visitor explicitly starts a personal journey. Example actions remain in memory and do not contaminate personal progress.

## Working features

- Energy and available-time-based suggestions, 1–3 tasks; a seven-day restart plan with rest days.
- Task-aware focus mode: engineering milestones open a structured mentor workspace; due SAT review tasks contain the exact assigned mistake IDs and render active recall in place; new SAT practice opens its question workflow. Shared timer, notes, distraction capture, ambience, and session saving remain available as supporting tools.
- Server-persisted sessions, evidence-backed milestone completion, skill stages, university checklists, reflections, saved resources, and preferences. Revision checks prevent stale tabs from overwriting new state. Session IDs make retrying a save idempotent.
- Question-based SAT practice sessions with editable screenshot extraction, multiple-choice and open-response answers, automatic statistics, and direct linkage of every wrong question to the canonical FSRS Mistake Notebook. Legacy aggregate practice records remain readable.
- Twenty-four substantial project definitions, eight ordered milestones each, project-fit scoring, engineering notes, repository links, and ten design-defense questions per project.
- Skill constellation, evidence-driven roadmap, 12-week activity heatmap, achievements tied to real actions, weekly/monthly evidence reviews, and JSON export.
- Curated learning library and SAT practice room with provider links, saved shelves, focus actions, and copyable tutoring prompts. Includes Khan Academy, Bluebook, Student Question Bank, Schoolhouse, Gemini SAT practice, MIT, OSTEP, Beej, Docker, Kubernetes, AWS Educate, fast.ai, Google ML Crash Course, RDKit, OpenStax, EducationUSA, and open-source/community guides.
- Light, dusk, and blue-hour themes, accent choices, compact layout, reduced-motion support, keyboard navigation, and mobile layouts.

## SAT content and open-source reuse

The installed review scheduler is `ts-fsrs@5.4.2` (MIT), a maintained implementation of Free Spaced Repetition Scheduler. It persists the full card state and an append-only review history on each saved mistake. Its requested recall retention is 0.9 with fuzz disabled; these defaults are not learner-specific fitted parameters or a guarantee of retention.

No College Board, Khan SAT, or Princeton Review question bank is copied into this app. They are available through clearly labeled external practice destinations. Gemini's provider-linked SAT practice is based on Princeton Review content; it is distinct from official College Board tests. Question access on a public website is not an open content license.

A maintained open-source renderer, Khan Perseus, was considered but not forced into this React 19 application: its inspected peer requirements were React 18 and multiple Wonder Blocks packages. Khan's archived `khan-exercises` framework is MIT but the exercises are CC BY-NC-SA; that old corpus is not included or described as state of the art. A trustworthy openly licensed complete digital-SAT bank was not established.

The app uses the learner's own saved questions/summaries and verified explanations for local mistake review. It does not administer a calibrated adaptive SAT, automatically grade admission prospects, infer mastery from dependencies, or produce predicted SAT scores. External results must be logged by the learner; no external account contents are silently imported.

## Enable SAT screenshot extraction

Configure these hosted environment values through Sites:

- `OPENAI_API_KEY`: a server-side API key. It is never returned to the browser or stored in AppState.
- `OPENAI_VISION_MODEL`: optional; defaults to `gpt-5.4-mini`.

The `/api/sat/extract` route accepts an authenticated PNG, JPEG, WebP, or GIF of at most 8 MB and sends it to the OpenAI Responses API with a strict structured-output schema. The learner must review and edit every extraction before saving. Source images needed for graphs, diagrams, charts, or tables are stored privately in the `SAT_IMAGES` R2 binding and fetched through an authenticated owner-scoped route; base64 image data is never added to the D1 AppState document. Sites provisions the R2 binding declared in `.openai/hosting.json` during deployment.

## Enable GitHub OAuth

Create a GitHub OAuth application for this site. Register:

- Homepage: `https://future-builder.aviadcoh.chatgpt.site`
- Callback: `https://future-builder.aviadcoh.chatgpt.site/api/github/callback`

Configure these as hosted environment values through Sites, never in client code or Git:

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `TOKEN_ENCRYPTION_KEY`: a securely generated random secret of at least 32 characters.
- `APP_ORIGIN`: the exact HTTPS site origin.

The flow uses PKCE, random single-use state tied to the signed-in site account, a secure HttpOnly SameSite cookie, a ten-minute state expiry, and AES-GCM encrypted stored tokens. Default scope is `read:user`; no repository-write scope is requested. Only owned public repositories are synchronized. Private repositories are intentionally outside the configured scope.

Sync reads up to 20 recently active repositories, their root files, languages, bounded README, up to ten recent commits and pull requests, available CI metadata, and latest release. README-keyword/readiness signals require manual verification. They are not code quality or mastery judgments. With no credentials configured, the app explains the pending connection instead of simulating authorization.

The callback now performs the initial profile and owned-public-repository synchronization before reporting success, persists the encrypted token and updated state together, and reports distinct actionable failures for denial, state/PKCE, exchange, encryption, persistence, revocation, rate limiting, and synchronization. GitHub OAuth, live GitHub data, and encrypted-token round trips have still not been end-to-end verified against a real user account in this build.

## Enable market snapshots

In Make it yours, add public source identifiers such as `greenhouse:company` and `lever:company` (up to eight). Use actual company board identifiers. Refresh in Market radar.

The collector uses provider HTTP endpoints, filters internship/junior/new-grad roles and the chosen location, extracts bounded explicit skill keywords, and saves each dated snapshot in its own D1 row. It does not overwrite older evidence. A zero-match snapshot is real filter output, not a claim of zero market demand. Every refresh must finish all configured sources successfully before the snapshot is saved. A skill needs three positive-sample observations spanning at least 28 days before a trend label is assigned.

For unattended weekly collection, set `CRON_SECRET` to a random secret, then configure your scheduler to send a POST request to `/api/jobs/market` with an `Authorization: Bearer <secret>` header. The endpoint skips accounts refreshed within seven days. Scheduler setup is required; no background schedule was enabled during this build. The endpoint is bounded for this personal application (up to ten saved accounts). Historical snapshots support monthly comparisons.

The collector has not been validated with a user-selected live set of job boards. Its keyword/location filters are explicitly approximate. Project-fit scores use neutral market relevance until matching snapshots exist; other fit dimensions are transparent editorial planning heuristics.

## Privacy and operational boundaries

Sites owns authentication and site access. Every data endpoint checks the signed-in user. A private deployment starts owner-only; give another person access explicitly using Sites controls before they can use the hosted app. Accounts keep separate D1 state. External providers receive nothing until the learner opens or authorizes the corresponding service. Disconnect deletes the stored GitHub token; revoke the grant on GitHub as well if desired.

Storage is authoritative in D1, not localStorage. Focus sessions in progress remain in memory; leaving the page prompts a warning after recorded effort, but a browser/process crash can lose an unfinished session. Finish and save a session to persist it. A full JSON export is available in Settings. The personal state document is limited to approximately 1.5 MB; a long-running multi-user product would need normalized session/history tables and archival.

No emails, applications, payments, assessed work, GitHub writes, or messages are sent by this build. Universities and personal SAT baselines start empty.

## Verification evidence

- Production build and TypeScript check passed.
- Twenty-one model and domain tests passed, including all project milestone guidance, exact due-mistake task IDs, bare-minimum selection, screenshot extraction contracts, multiple-choice and open-response grading, automatic session statistics, the full question-to-Mistake-to-Focus-to-FSRS loop, legacy state hydration, and OAuth/PKCE/encryption helpers.
- Local HTTP checks passed: unauthenticated rejection, persisted account state, stale revision conflicts, cross-origin rejection, JSON round-trip saves, and invalid observation rejection. Only a marked synthetic development record was created and removed.
- A real local browser walkthrough verified engineering task guidance, editable question entry, distinct learner/correct answers, automatic incorrect grading, canonical Mistake creation, due recommendation selection, active-recall review inside Focus, the shared FSRS rating, and the completion summary.

## Architecture

`lib/model.ts` defines the versioned AppState, discriminated task union, structured SAT sessions/questions, validation, immutable action reduction, and recommendations. `lib/milestone-guides.ts` supplies reusable milestone guidance across the engineering library. `lib/spaced-review.ts` remains the single FSRS adapter. `lib/server.ts` provides identity, prepared D1 access, bounded request handling, revision-safe writes, and token encryption; `lib/oauth.ts` contains testable origin/state/PKCE/encryption primitives and `lib/github.ts` owns GitHub synchronization. SAT screenshots live in R2 while structured questions and their canonical Mistake links live in the versioned D1 state document. `lib/market.ts` owns ingestion. `components/` contains the working surfaces. `db/schema.ts` and generated Drizzle migrations own schema changes.

The homepage loads a light overview and loads deeper sections on demand. The GitHub and scheduled-job paths fail closed when their secrets are absent.
