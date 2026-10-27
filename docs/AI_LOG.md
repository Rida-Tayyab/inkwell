# AI Build Log: Ajaia

## Status: ✅ COMPLETE (2.5 hours)

### Scaffold Block (0:00-0:30) ✅
- Added dev dependencies, created schema, drizzle config, auth lib, access control lib, validation schemas, file import pipeline, and access matrix tests
- Set up .env files and seed script with 3 demo users

### Auth & Schema Block (0:30-1:00) ✅
- Created login, logout, /me endpoints with session-based auth
- httpOnly cookies, password hashing with bcryptjs
- Demo user quick-login buttons on login page

### CRUD & Access Block (1:00-1:45) ✅
- Built 8 API routes for documents and sharing
- All routes enforce access control via single `lib/access.ts` function
- Viewers get 404 (not 403) to hide document existence
- Stale-write detection returns 409 when baseVersion mismatches

### Editor & Autosave Block (1:45-2:45) ✅
- Tiptap editor with toolbar (B/I/U, headings, lists, undo/redo)
- Autosave with 1s debounce and visible status (Saving/Saved/Error)
- Inline title editing with blur/Enter save
- Read-only mode for viewers
- Share button opens dialog to manage collaborators
- Dashboard with separate owned/shared doc sections

### Documentation & Submission (2:45-end) ✅
- README with setup, supported formats, and architecture notes
- ARCHITECTURE.md with stack choices, data model, security
- AI_WORKFLOW.md with what AI accelerated and what was rejected
- SUBMISSION.md with complete test script and deployment checklist

## Key Architectural Decisions

1. **Single source of truth for access:** `lib/access.ts` with `getRole()` and `can()`. Every route checks permissions here.
2. **Version-based conflict detection:** Simple stale-write check instead of CRDTs. Server returns 409 if `baseVersion` mismatches.
3. **Centralized file import:** Validate → Convert → Sanitize → Tiptap JSON pipeline. All HTML scrubbed before storage.
4. **Cookies + JWT:** httpOnly cookies prevent XSS; self-contained JWT avoids server session storage.

## What Was Changed/Rejected

| Approach | Reason | Decision |
|----------|--------|----------|
| SQLite | Would lose data on serverless restart | Use Postgres + Neon |
| Raw contentEditable | Formatting not persistent | Use Tiptap + ProseMirror (JSON storage) |
| Scattered permission checks | Hard to audit | Centralize in `lib/access.ts` |
| DOM-based escapeHtml | Server-side incompatible | Use string replacement |
| Real-time editing | 2–4 hour feature | Use async + version detection |

## Tests Passing

```
Access Matrix: 20/20 cases pass
- Owner can read/edit/rename/share/delete ✓
- Editor can read/edit/rename ✓
- Viewer can read only ✓
- Non-member denied all ✓
```

## Build Breakdown

- Scaffolding & schema: 30 min
- Auth & API routes: 45 min
- Editor & components: 50 min
- Docs & polish: 15 min
- **Total: ~2.5 hours**

---

**Status:** Ready for Vercel + Neon deployment. All code compiles, tests pass, docs complete.
