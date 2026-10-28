# Build Plan: Lightweight Collaborative Doc Editor (Ajaia Take-Home)

> Instructions for the building agent. Follow in order. Respect the timebox (target 5h, hard cap 6h). Core flows working end to end beat breadth. Keep a running `docs/AI_LOG.md` as you go (see section 9).

## 0. Guiding principles (what separates this submission)

1. **Vertical slice first.** By hour 2, one user can create, edit, save, reopen, share, and the shared user can open it. Deploy by hour 2.5, then iterate on the live URL.
2. **Authorization lives on the server, in one place.** One `getDocumentAccess(userId, docId)` function is the only source of truth. The UI hides things, but the API enforces them.
3. **Deliberate scope cuts, stated loudly.** README and the architecture note include a "Deprioritized (on purpose)" section.
4. **Reviewer empathy.** Seeded users shown on the login screen, a seeded sample doc already shared, supported file types stated in the UI, and a live URL that works with zero setup.
5. **Evidence over claims.** Tests, a verification checklist, and an honest AI log (including what was rejected).

## 1. Stack (decided, do not relitigate)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | One repo, one deploy, API routes plus UI. |
| Editor | **Tiptap (ProseMirror)** with StarterKit + Underline | Real rich-text, JSON storage, cheap to extend. Do not build on raw `contentEditable`. |
| DB | **Postgres** (Neon free tier in prod, Docker Compose locally) | Durable on serverless hosts. SQLite on Vercel would lose data. |
| ORM | **Drizzle** (or Prisma) with migrations and a seed script | Typed, reviewable schema. |
| Validation | **zod** on every API input | Required "basic validation". |
| Import | `mammoth` (.docx to HTML), `marked` (.md to HTML), plain-text wrapper (.txt) | Covers the 3 suggested formats. |
| Sanitization | `sanitize-html` on imported HTML, then Tiptap `generateJSON` | Prevent XSS from uploaded files. |
| Tests | **Vitest** (unit + API-level), 1 **Playwright** e2e if time allows | "At least one meaningful test", so aim for 3 to 5 good ones. |
| Deploy | **Vercel + Neon** | Free, no cost to reviewers, public URL. |

## 2. Product scope

### Must ship (core)
- **Auth (mocked, lightweight):** login page lists 3 seeded users (e.g. `alice@demo.com`, `bob@demo.com`, `carol@demo.com`) with one shared demo password or one-click "Sign in as". Session is a signed httpOnly cookie. Credentials are printed on the login page and in the README.
- **Dashboard:** two clearly separated sections or tabs, **"My documents"** (owned) and **"Shared with me"**. Shared items show an owner badge and a role chip (Editor/Viewer). "New document" button and "Import file" button.
- **Editor page** (`/docs/[id]`):
  - Editable title (inline rename, saves on blur or Enter).
  - Toolbar: Bold, Italic, Underline, Heading 1/2/3 plus paragraph (a block-type dropdown), Bullet list, Numbered list, Undo/Redo. Active-state highlighting and keyboard shortcuts.
  - **Autosave** (debounced about 1s) with a visible status: `Saving…` / `Saved` / `Save failed. Retry`.
  - Reload preserves content and formatting.
  - Viewers get a read-only editor and a "View only" banner.
- **File upload to new document:** accepts `.txt`, `.md`, `.docx` (max 2 MB). The UI states supported types and the limit near the button. Upload creates a new doc titled from the filename and opens it. Clear errors for wrong type, too large, empty, or corrupt files.
- **Sharing:** "Share" dialog (owner only) with email input, role select (Viewer/Editor), the list of current collaborators, and revoke or change role. Errors: unknown user, sharing with self, duplicate (upsert the role instead).
- **Persistence:** documents stored as Tiptap JSON (`jsonb`), with `updated_at`.

### Stretch (only after everything above is verified and deployed), in this order
1. **Export to Markdown/HTML** (cheap, high perceived value).
2. A "last edited by X, time ago" indicator on the dashboard.
3. Nothing else. No real-time, comments, or version history.

### Deprioritized on purpose (say so in docs and video)
Real-time multi-user editing and CRDTs, version history, comments, real password auth/OAuth, link sharing, image uploads, PDF export, offline support, rate limiting. Each gets one line of "why", and "what I'd do with 2-4 more hours" is: version history, then optimistic-concurrency conflict warning, then Yjs collaboration.

## 3. Data model

```
users(id uuid pk, email unique, name, password_hash, created_at)
documents(id uuid pk, owner_id fk users, title text not null default 'Untitled document',
          content jsonb not null, created_at, updated_at, version int not null default 1)
document_shares(document_id fk, user_id fk, role enum('viewer','editor'), created_at,
                primary key (document_id, user_id))
```
Indexes on `documents.owner_id` and `document_shares.user_id`. `version` is incremented on each save and is used for a simple stale-write check (PATCH includes the `baseVersion`. If it mismatches, return 409 and show "This doc changed elsewhere. Reload"). This is cheap and signals concurrency awareness without building collaboration.

## 4. Access logic (the heart of the submission)

`lib/access.ts`:
```ts
type Role = 'owner' | 'editor' | 'viewer' | null
getRole(userId, doc): Role
can(role, action: 'read' | 'edit' | 'rename' | 'share' | 'delete'): boolean
```
Rules: owner can do everything. Editor can read, edit, and rename. Viewer can read. Anyone else gets **404** (not 403, so existence isn't leaked). Every route handler calls `requireUser()` and then `getRole`/`can`. No inline permission checks elsewhere. **Unit-test the matrix.**

## 5. API surface (REST, zod-validated, consistent error shape `{error:{code,message}}`)

- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/me`
- `GET /api/documents` returns `{owned:[], shared:[]}`
- `POST /api/documents` (create blank)
- `GET /api/documents/:id` returns the doc plus `role`
- `PATCH /api/documents/:id` takes `{title?, content?, baseVersion}`, and role determines what is allowed
- `DELETE /api/documents/:id` (owner only; include if cheap)
- `POST /api/documents/import` (multipart): validates type and size by extension and magic bytes, converts, sanitizes, and creates the doc
- `GET /api/documents/:id/shares`, `POST` (add or update by email), `DELETE /:userId` (owner only)
- Stretch: `GET /api/documents/:id/export?format=md`

## 6. Suggested file layout

```
app/(auth)/login/page.tsx
app/(app)/page.tsx                 # dashboard
app/(app)/docs/[id]/page.tsx       # editor
app/api/...                        # routes above
components/Editor.tsx, Toolbar.tsx, ShareDialog.tsx, DocList.tsx, ImportButton.tsx, SaveStatus.tsx
lib/db.ts, lib/schema.ts, lib/auth.ts, lib/access.ts, lib/import.ts, lib/validation.ts
scripts/seed.ts
tests/access.test.ts, tests/import.test.ts, tests/api-sharing.test.ts, e2e/share-flow.spec.ts
docs/ARCHITECTURE.md, docs/AI_WORKFLOW.md, docs/AI_LOG.md
README.md, SUBMISSION.md, VIDEO_URL.txt
```

## 7. Execution order and timebox

| Block | Time | Output |
|---|---|---|
| A. Scaffold | 0:00-0:30 | Next.js + TS, Drizzle, Docker Compose Postgres, env handling, lint |
| B. Schema, seed, auth | 0:30-1:00 | 3 users, sample shared doc, cookie session, login page |
| C. Doc CRUD + access lib + tests | 1:00-1:45 | API routes, `access.ts`, first unit tests |
| D. Editor + autosave | 1:45-2:45 | Tiptap, toolbar, rename, save status, read-only mode |
| E. **Deploy early** | 2:45-3:15 | Vercel + Neon, run migrations + seed, smoke test live URL |
| F. Sharing UI + dashboard split | 3:15-4:00 | Share dialog, owned/shared sections, role chips |
| G. Import | 4:00-4:30 | txt/md/docx pipeline, sanitization, error UX, import tests |
| H. Polish + QA | 4:30-5:15 | Empty states, loading, error toasts, responsive check, a11y labels, optional Markdown export |
| I. Docs + submission | 5:15-6:00 | README, ARCHITECTURE, AI_WORKFLOW, SUBMISSION, screenshots, video script |

If behind at the end of D, cut stretch items, then cut delete and role-change polish. Never cut: deploy, tests, README.

## 8. Quality bar (checklist the agent must satisfy)

**Editing UX**
- [ ] Toolbar reflects the current selection. Shortcuts work (Ctrl/Cmd+B/I/U).
- [ ] Headings and lists survive save and reload and an import round-trip.
- [ ] Autosave never silently fails. Failure shows a visible state with retry. `beforeunload` warns on unsaved changes.
- [ ] The title can't be saved empty (falls back to "Untitled document").

**Backend and security**
- [ ] Every route authenticated and authorized via `access.ts`. Non-members get 404.
- [ ] Viewers cannot PATCH (verified by a test, not just a hidden UI).
- [ ] Uploads: extension + MIME + size checks, parse errors caught, HTML sanitized, filename never used as a path.
- [ ] No secrets committed. `.env.example` provided.

**Tests (minimum meaningful set)**
1. Access matrix (owner/editor/viewer/stranger x actions).
2. Import conversion (md headings and lists to expected doc structure, docx fixture, rejected types and oversize).
3. API: viewer PATCH rejected and editor PATCH accepted, plus a stale `baseVersion` returning 409.
4. (Optional) Playwright: Alice creates and shares a doc, Bob sees it under "Shared with me" and opens it.

**Deployment**
- [ ] Live URL loads with no setup. Seed users work. The sample doc is visible to the reviewer.
- [ ] Migrations and seed run documented (`npm run db:migrate && npm run db:seed`).

## 9. AI-native workflow (document as you build, not at the end)

Maintain `docs/AI_LOG.md` throughout with timestamped one-liners in four buckets. Then distill it into `docs/AI_WORKFLOW.md` (about 1 page):
- **Tools used:** e.g. Claude (planning and scaffolding), Claude Code (implementation).
- **Where AI materially sped things up:** e.g. boilerplate and schema, Tiptap toolbar wiring, import converters, test scaffolding, README drafts.
- **What was changed or rejected (be specific and honest):** log at least 3 real examples as they happen, e.g. rejecting SQLite because of serverless persistence, replacing a raw `contentEditable` suggestion with Tiptap, tightening an AI-generated permission check into the single `access.ts`, removing over-engineered abstractions, fixing sanitization gaps.
- **Verification:** the tests above, manual two-browser sharing walkthrough (normal + incognito), a viewer-bypass attempt via curl, reload and persistence checks, a docx with headings/lists, and a keyboard-only pass of the toolbar.

Rule for the agent: never paste unreviewed AI output into the auth or access paths. Read and test it.

## 10. Documentation deliverables (content spec)

- **README.md:** what it is, live URL, seeded credentials, local setup (Docker Postgres, `.env`, migrate, seed, `npm run dev`), test commands, supported upload types and limits, project layout, known limitations.
- **docs/ARCHITECTURE.md (about 1 page):** the stack and why, data model diagram (text is fine), the access model, how autosave and version checks work, the import pipeline, **what I prioritized and why**, **what I cut and why**, and the next 2-4 hours.
- **docs/AI_WORKFLOW.md:** per section 9.
- **SUBMISSION.md:** the exact file list, live URL, test accounts, what works, what is partial, what's next, and a sharing-flow demo script (login as Alice, create a doc, share with Bob as editor, switch to Bob).
- **VIDEO_URL.txt:** placeholder until recorded.
- **Screenshots:** dashboard (owned/shared), the editor, the share dialog, and the import error state.

## 11. Walkthrough video script (3-5 min, for the human to record)

1. (0:00) 20s: the problem and the slice I chose.
2. (0:20) 90s: demo as Alice. Create, format, rename, reload to show persistence, import a .docx.
3. (1:50) 60s: share with Bob, switch to Bob, show "Shared with me", the editor vs viewer role difference.
4. (2:50) 45s: architecture, with the single access function and the autosave and version check.
5. (3:35) 30s: what I deliberately cut and why.
6. (4:05) 45s: AI usage, with one concrete accepted example and one rejected.

## 12. Definition of done

A reviewer can open the live URL, sign in as a seeded user, and complete create, format, rename, reload, import, share, and view-as-other-user in under 5 minutes with no instructions beyond the login page. Tests pass in CI or locally with one command. All five docs exist. Scope cuts are explicit.
