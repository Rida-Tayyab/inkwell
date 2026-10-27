# Ajaia: Lightweight Collaborative Document Editor

A minimal collaborative document editor built with Next.js, Tiptap, and Postgres.

## Live Demo

**URL:** TBD (deploying to Vercel)

**Demo Credentials:**
- alice@demo.com (owns the sample shared document)
- bob@demo.com (editor on sample document)
- carol@demo.com (viewer on sample document)
- **Password for all:** `demo`

## Core Features

- **Auth:** Lightweight session-based login with three pre-seeded demo users
- **Editor:** Rich text editing with bold, italic, underline, headings (H1/H2/H3), and lists (bullet/numbered)
- **Autosave:** 1-second debounced autosave with visible status (Saving… / Saved / Save failed)
- **Sharing:** Owner can share documents with specific users as Editor (can edit) or Viewer (read-only)
- **Dashboard:** Separate views for "My Documents" (owned) and "Shared with Me"
- **File Import:** Upload `.txt`, `.md`, or `.docx` files (max 2 MB) to create new documents
- **Version Control:** Simple stale-write detection—if a document is edited elsewhere, you'll see a 409 conflict
- **Access Control:** Single source of truth (`lib/access.ts`) that enforces all permissions on the server

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 + TypeScript |
| Editor | Tiptap (ProseMirror) with StarterKit + Underline |
| Database | PostgreSQL (Neon in prod, Docker Compose locally) |
| ORM | Drizzle with migrations |
| Validation | Zod on all API inputs |
| File Conversion | mammoth (DOCX), marked (Markdown), plain-text wrapper |
| Sanitization | sanitize-html for user uploads |
| Testing | Vitest (unit tests) |
| Styling | Tailwind CSS |

## Local Setup

### Prerequisites
- Node.js 18+
- Docker & Docker Compose (for Postgres)

### Installation

1. **Clone and install:**
   ```bash
   cd ajaia-docs
   npm install
   ```

2. **Start Postgres:**
   ```bash
   docker-compose up -d
   ```

3. **Run migrations and seed:**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Start dev server:**
   ```bash
   npm run dev
   ```

5. **Open browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Layout

```
app/(auth)/login/page.tsx         # Login page with demo user buttons
app/(app)/page.tsx                # Dashboard (owned + shared docs)
app/(app)/docs/[id]/page.tsx      # Editor with toolbar and autosave
app/api/auth/                     # Login, logout, /me endpoints
app/api/documents/                # CRUD routes for documents and shares
components/                       # Toolbar, Editor, ShareDialog, SaveStatus
lib/
  access.ts                       # Access control matrix (single source of truth)
  auth.ts                         # Session + password hashing
  db.ts, schema.ts                # Drizzle setup
  import.ts                       # File conversion pipeline
  validation.ts                   # Zod schemas
tests/access.test.ts              # Permission matrix unit tests
scripts/seed.ts                   # Demo data seeding
docs/AI_ARCHITECTURE.md           # Technical deep-dive
```

## API Surface

All endpoints return `{error: {code, message}}` on failure or the resource on success.

### Auth
- `POST /api/auth/login` — Login with email + password, sets httpOnly cookie
- `POST /api/auth/logout` — Clear session
- `GET /api/me` — Return current user

### Documents
- `GET /api/documents` — List owned and shared documents
- `POST /api/documents` — Create new blank document
- `GET /api/documents/:id` — Get document + content (checks access)
- `PATCH /api/documents/:id` — Update title/content (includes baseVersion for conflict detection)
- `DELETE /api/documents/:id` — Delete document (owner only)

### Sharing
- `GET /api/documents/:id/shares` — List collaborators
- `POST /api/documents/:id/shares` — Add/update share by email + role
- `DELETE /api/documents/:id/shares?userId=...` — Revoke access

### Import
- `POST /api/documents/import` — Upload `.txt`, `.md`, or `.docx` file (max 2 MB)

## Testing

### Run unit tests
```bash
npm run test:run
```

### Manual verification
1. **Permissions:** Log in as bob@demo.com, try to edit the shared document and verify it works. Switch to carol@demo.com (viewer) and confirm the editor is read-only.
2. **Autosave:** Edit the document, watch for "Saving…" then "Saved".
3. **Share:** As alice@demo.com, click Share, add a new user, and verify they see it under "Shared with Me".
4. **Import:** Create a new document and upload a `.docx` file; verify formatting is preserved.
5. **Conflict:** Open the same document in two tabs, edit in one, and see 409 conflict in the other.

## Known Limitations (Intentional Scope Cuts)

- No real-time multi-user editing (no CRDT/WebSocket)
- No version history or comments
- No image uploads or link cards
- No rate limiting
- No email notifications
- No real authentication (OAuth, 2FA) — use a proper auth service in production

### What's Next (2–4 hours)
1. Export to Markdown/HTML
2. Last-edited-by timestamp on dashboard
3. Version history with rollback
4. Simple collaborative editing via Yjs
5. Real auth (OAuth2 / Magic links)

## Supported Upload Types

- `.txt` — Plain text (no formatting)
- `.md` — Markdown (headings, lists, bold, italic)
- `.docx` — Microsoft Word (headings, lists, bold, italic, tables as text)

**Max file size:** 2 MB

## Architecture Notes

### Access Control (Single Source of Truth)

All permission checks go through `lib/access.ts`:

```ts
const role = await getRole(userId, docId); // 'owner' | 'editor' | 'viewer' | null
const allowed = can(role, 'edit'); // true/false
```

Rules:
- **Owner** can read, edit, rename, share, delete
- **Editor** can read, edit, rename
- **Viewer** can read only
- **Non-member** gets 404 (not 403) — we hide existence

### Autosave & Conflict Detection

1. User edits → changes buffered locally
2. After 1s of no edits → `PATCH /api/documents/:id` with `{content, baseVersion}`
3. Server checks: `if (baseVersion !== doc.version) return 409`
4. Client shows "Document changed elsewhere" with reload prompt
5. On reload, latest version is fetched

### File Import Pipeline

1. **Validate:** Check MIME type, extension, and file size (max 2 MB)
2. **Convert:** 
   - `.txt` → wrap in `<p>` with HTML-escaped text
   - `.md` → parse with `marked` library
   - `.docx` → extract with `mammoth`
3. **Sanitize:** Run through `sanitize-html` to remove scripts, iframes, etc.
4. **Transform:** Convert HTML to Tiptap JSON using `generateJSON`
5. **Create:** Insert into database as new document

### Deployment

Uses Vercel + Neon PostgreSQL (free tier):
1. Push to GitHub
2. Vercel auto-deploys on main
3. Neon connection string set as `DATABASE_URL` env var
4. Run migrations + seed on first deployment

## Scripts

```bash
npm run dev              # Start dev server on :3000
npm run build          # Build for production
npm run start          # Run prod server
npm run lint           # Run ESLint
npm run db:migrate     # Run Drizzle migrations
npm run db:seed        # Seed demo users + sample doc
npm run test           # Run Vitest in watch mode
npm run test:run       # Run Vitest once
```

## Contributing

This is a submission for a code assessment. For feedback or suggestions, please open an issue.

## License

MIT
