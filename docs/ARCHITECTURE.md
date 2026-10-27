# Architecture: Ajaia Document Editor

## Overview

Ajaia is a lightweight collaborative document editor prioritizing **vertical slices** over breadth. By hour 2, one user can create, edit, save, reload, and share a document. Authorization is centralized in a single `getRole()` function, and data persistence uses version-based conflict detection instead of real-time collaboration.

## Technology Choices

| Component | Choice | Why |
|-----------|--------|-----|
| **Framework** | Next.js 16 + TypeScript | One repo, one deploy (App Router for API routes + UI) |
| **Editor** | Tiptap (ProseMirror) | Real rich-text, JSON storage, extends cheaply |
| **Database** | PostgreSQL | Survives serverless restarts; Neon free tier works on Vercel |
| **ORM** | Drizzle | Typed schema + migrations, reviewable SQL |
| **Validation** | Zod | Parse and validate all inputs upfront |
| **Conversion** | mammoth (DOCX), marked (MD), custom (TXT) | Converts to HTML, then sanitized + Tiptap JSON |
| **Tests** | Vitest | Fast unit tests; access matrix in CI |

## Data Model

```
users (id, email unique, name, password_hash, created_at)

documents (id, owner_id → users,
           title, content jsonb, version int,
           created_at, updated_at)

document_shares (document_id → documents, user_id → users, role enum,
                 primary key (document_id, user_id))
```

**Indexes:** `documents.owner_id`, `document_shares.user_id`

**Why `version`?**
- Each save increments `version`
- Client sends `baseVersion` on PATCH
- If `baseVersion != current version`, return 409 Conflict
- Simple, cheap stale-write detection without CRDTs

## Authorization (Single Source of Truth)

All permission checks are routed through **`lib/access.ts`**:

```ts
const role = await getRole(userId, docId)  // 'owner' | 'editor' | 'viewer' | null
const can = can(role, 'edit')             // boolean
```

**Why one file?**
- Forces all logic to one place
- Easy to audit permissions
- No scattered checks in middleware/routes

**Rules:**

| Role | read | edit | rename | share | delete |
|------|------|------|--------|-------|--------|
| Owner | ✓ | ✓ | ✓ | ✓ | ✓ |
| Editor | ✓ | ✓ | ✓ | ✗ | ✗ |
| Viewer | ✓ | ✗ | ✗ | ✗ | ✗ |
| None | ✗ | ✗ | ✗ | ✗ | ✗ |

**Security pattern:**
- Non-members always get **404** (not 403)
- This hides document existence from strangers
- Every route calls `getRole()` + `can()`; no UI hiding alone

## API Surface

All routes:
1. Call `getCurrentUserId()` → return 401 if missing
2. Call `getRole(userId, docId)` → check permission with `can()`
3. Return 404 if denied (hiding existence)

**Response format:**
```json
{
  "error": { "code": "FORBIDDEN", "message": "..." }
}
// or
{
  "id": "...", "title": "...", ...
}
```

### Endpoints

**Auth:**
- `POST /api/auth/login` — Validate email + password, set httpOnly cookie
- `POST /api/auth/logout` — Clear session
- `GET /api/me` — Return current user

**Documents:**
- `GET /api/documents` — Fetch owned + shared (no access check needed; only your own)
- `POST /api/documents` — Create new (authenticated only)
- `GET /api/documents/:id` — Fetch with access check
- `PATCH /api/documents/:id` — Update with baseVersion conflict check
- `DELETE /api/documents/:id` — Delete (owner only)

**Sharing:**
- `GET /api/documents/:id/shares` — List collaborators (read access required)
- `POST /api/documents/:id/shares` — Add/update share (owner only)
- `DELETE /api/documents/:id/shares?userId=X` — Revoke (owner only)

**Import:**
- `POST /api/documents/import` — Upload file, create new document

## Autosave & Conflict Detection

**Flow:**

1. **Edit:** User types → React state updates → Tiptap onUpdate fires
2. **Debounce:** 1-second timeout after last edit
3. **Send:** `PATCH /api/documents/:id { content, baseVersion }`
4. **Server:**
   - Loads current document
   - Checks `if (baseVersion !== doc.version) return 409`
   - Increments `version`, saves content, updates `updated_at`
5. **Client:**
   - Success → show "Saved" for 2s
   - 409 → show "Document changed elsewhere. Reload."
   - Error → show "Save failed. Retry."
6. **beforeunload:** If `saveState === 'saving' || 'error'`, warn "Unsaved changes"

**Why not real-time?**
- Takes 2–4 hours to build properly (Yjs, WebSocket, presence)
- Simple conflict detection is cheaper and sufficient for async editing
- Can add later with Yjs + awareness

## File Import Pipeline

**Goals:**
- Convert `.txt`, `.md`, `.docx` to Tiptap JSON
- Sanitize to prevent XSS from uploaded files
- Preserve basic formatting (headings, lists, bold/italic)

**Flow:**

1. **Validate:**
   - Check MIME type (if provided)
   - Check file extension
   - Check file size (max 2 MB)

2. **Convert to HTML:**
   ```
   .txt → <p>escaped text</p>
   .md → marked(markdown) → HTML
   .docx → mammoth.convertToHtml(buffer) → HTML
   ```

3. **Sanitize:**
   ```ts
   sanitizeHtml(html, {
     allowedTags: ['p', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', ...],
     allowedAttributes: {},
   })
   ```

4. **To Tiptap JSON:**
   ```ts
   generateJSON(sanitized, [StarterKit, Underline])
   ```

5. **Create Document:**
   ```ts
   INSERT INTO documents (owner_id, title, content)
   VALUES (:userId, :filename, :json)
   ```

**Why this order?**
- Size check first (cheap)
- Parse next (can fail)
- Sanitize before storing (security)
- Tiptap JSON last (app-native format)

## Session & Authentication

**Flow:**

1. `POST /api/auth/login { email, password }`
2. Look up user, compare password hash with bcryptjs
3. Generate JWT signed with `SESSION_SECRET` (HS256, 7-day expiry)
4. Set httpOnly cookie: `session=<jwt>`
5. Client routes check via `getCurrentUserId()` which reads the cookie

**Why cookies + JWT?**
- httpOnly prevents XSS exfiltration
- Self-contained (no server session store)
- Refresh on every request via `getCurrentUserId()`

**Why no OAuth?**
- Demo project; demo password is printed in login UI
- OAuth adds 30+ min setup (Google/GitHub, env vars, redirects)
- Can swap with a real auth service later

## Testing Strategy

**What's tested:**

1. **Access matrix (unit):** Owner/editor/viewer permissions for all actions
2. **Import (unit):** Markdown headings convert correctly, docx fixture works, oversize/invalid types rejected
3. **API (integration):** Viewer PATCH returns 404, editor PATCH succeeds, stale `baseVersion` returns 409
4. **E2E (optional):** Alice creates doc, shares with Bob, Bob opens and edits, Alice sees it updated

**Minimum bar:**
- Access tests pass (guards against auth bypass)
- Viewer cannot write (PATCH rejected)
- Stale writes are detected (409 returned)
- At least one file conversion works

## Deliberate Scope Cuts

**Why NOT included:**

| Feature | Why Skipped | Next 2–4 hours |
|---------|------------|---|
| Real-time editing | CRDT + WebSocket = 2–3 hours | Add Yjs + presences |
| Version history | DB + UI overhead | Add `document_versions` table, Timeline UI |
| Comments | Complex state + notifications | Add comment threads |
| OAuth/2FA | Not needed for demo | Use Auth0 or Clerk |
| Rate limiting | Low traffic | Add redis-based counter |
| Image uploads | Blob storage needed | Add S3 + presigned URLs |
| PDF export | Requires headless browser | Use html2pdf or pdfkit |
| Mobile UI | Responsive works for now | Better touch-friendly toolbar |

## Deployment

**Setup:**

1. Create Neon PostgreSQL (free tier)
2. Create Vercel project, connect GitHub
3. Set `DATABASE_URL` env var to Neon connection string
4. Set `SESSION_SECRET` to a random 32+ char string
5. Deploy: `git push origin main`

**On deployment:**
- Vercel runs `npm run build` (Next.js compiles routes)
- Add a post-deploy hook to run:
  ```
  npm run db:migrate && npm run db:seed
  ```

**What works on Vercel:**
- Next.js API routes ✓
- Postgres queries ✓
- File uploads (body parsing) ✓
- Cookies ✓

**What doesn't:**
- Background jobs (use AWS Lambda or cron jobs)
- Long-polling (use Next.js Streaming or WebSocket alternatives)
- Large file uploads > 4.5 MB

## Performance Considerations

- **Autosave debounce:** 1 second (not 500ms) to reduce DB load
- **Document list:** No pagination (assumes < 100 docs per user initially)
- **Indexes:** `owner_id` and `shares.user_id` for dashboard queries
- **Sanitization:** Done on import only, not on every save
- **Tiptap:** Lazy-loaded in browser; syntax highlighting skipped for MVP

## Security Checklist

- [x] **Auth:** Passwords hashed with bcryptjs, httpOnly cookies
- [x] **Access:** All routes enforce `getRole()` + `can()` server-side
- [x] **Input:** Zod validation on every API input
- [x] **File uploads:** Extension, MIME, size checks + sanitization
- [x] **XSS:** Uploaded HTML sanitized before storing
- [x] **CSRF:** httpOnly + SameSite cookies, no GET mutations
- [x] **SQL injection:** Drizzle parameterized queries only
- [ ] **Rate limiting:** Not implemented; add if needed
- [ ] **2FA:** Not implemented; not needed for demo

## Future Improvements

1. **Collaborative editing:** Integrate Yjs for real-time multi-user
2. **Version history:** `document_versions` table + rollback UI
3. **Comments:** Inline comments with threads and notifications
4. **Export:** Markdown, HTML, PDF (headless browser)
5. **Search:** Full-text search across documents
6. **OAuth:** Replace demo auth with Auth0/Clerk
7. **Analytics:** Track usage, engagement
8. **Mobile app:** React Native or PWA

---

**Build time:** 5–5.5 hours  
**Lines of code:** ~1500 (routes + components + tests)  
**Complexity:** Low; every function fits on one screen
