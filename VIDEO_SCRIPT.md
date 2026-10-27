# Video Walkthrough Script - Inkwell

**Target: 4:30 | Hard Limit: 5:00**  
**Pace: ~140 words/minute | Total: ~620 words**

---

## Pre-Recording Checklist (10 min)

- [ ] Deploy to live URL (Vercel + Neon)
- [ ] Run seed script to reset demo data
- [ ] Open two browsers: Normal (Alice) + Incognito (Bob)
- [ ] Prepare files:
  - ✅ `meeting-notes.docx` with heading, bullets, bold text
  - ✅ `bad-file.pdf` for error demo
- [ ] Open tabs:
  - Live URL login page
  - `lib/access.ts` in editor
  - `docs/AI_LOG.md`
- [ ] Browser zoom 110-125%
- [ ] Close notifications, unrelated tabs
- [ ] Test audio + screen recording (1080p)
- [ ] **DRY RUN ONCE**

---

## Script

### 0:00-0:25 | Hook and Scope
*[Show login page]*

"Hi, I'm **[YOUR NAME]**. This is **Inkwell**, a lightweight collaborative document editor I built for the Ajaia assessment. The brief was deliberately open-ended, so I picked a vertical slice: create and edit rich-text documents, import files, share with specific roles, and have it all persist and deployed. I'll show the main flow, the key decisions, what I cut on purpose, and how I used AI."

---

### 0:25-1:05 | Login and Dashboard (40s)
*[Click "Sign in as Alice" button. Dashboard appears]*

"To keep scope reasonable, I used pre-seeded demo accounts with lightweight auth: Alice, Bob, and Carol. The credentials are right here on the login page and in the README."

*[Point at dashboard sections]*

"Alice's dashboard has two sections: 'On my desk' for documents she owns, and 'Passed to me' for shared documents. Each has a role stamp showing whether she's the owner, an editor, or just a viewer."

*[Hover over a stamp, then click "New page"]*

---

### 1:05-2:05 | Create, Edit, Format, Rename, Persist (60s)
*[Editor opens. Click title field, type "Q4 Planning Notes", press Enter]*

"The title is inline and saves on blur or Enter."

*[Type a heading, select it, click "H1". Type a few lines. Bold one phrase with Ctrl+B, italicize another, underline one. Create a bulleted list with 2-3 items, then a numbered list]*

"The editor is Tiptap, built on ProseMirror, so I get real rich-text with keyboard shortcuts. I support bold, italic, underline, three heading levels, bullets and numbered lists."

*[Point at toolbar save status]*

"Notice the save status in the toolbar—it autosaves with a one-second debounce and shows: 'Saving…' then 'Saved' with a timestamp, or 'Not saved' with retry."

*[Wait for "SAVED 14:23". Hit browser refresh]*

"Refresh, and everything's back—including formatting. Content is stored as Tiptap JSON in Postgres, not raw HTML, which keeps formatting reliable and makes import safer."

---

### 2:05-2:45 | File Upload (40s)
*[Back to dashboard. Click import dropzone area]*

"File import converts an upload into a new editable document. I support .txt, .md, and .docx up to 2 MB—and the UI states that up front."

*[Drag or select `meeting-notes.docx`. New doc opens with heading and list intact]*

"The docx is converted with mammoth, sanitized with sanitize-html, then transformed to Tiptap JSON. Headings and lists survive."

*[Back to dashboard. Try uploading `bad-file.pdf`. Error appears]*

"Unsupported types or oversized files show a clear error—validated server-side, not just in the browser."

---

### 2:45-3:35 | Sharing - The Main Proof (50s)
*[Open "Q4 Planning Notes". Click "Share" button. ShareDialog opens]*

"Sharing is owner-only. Alice can grant Bob access by email with a role—either Editor or Viewer."

*[Type `bob@demo.com`, select "Editor", click "Share Document". Success message appears]*

*[Switch to incognito window. Sign in as Bob. Show "Passed to me" section with the doc and Editor stamp. Click to open it. Type a sentence]*

"Bob sees it under 'Passed to me', with his role stamped. As an editor, he can edit."

*[Switch back to Alice. In ShareDialog, change Bob to Viewer. Remove or click update]*

*[In Bob's window, reload page. Show "View only" banner. Try typing—nothing happens]*

"Now as a viewer, it's read-only. And this isn't just a hidden button—the server enforces it through a single access control function."

---

### 3:35-4:05 | Key Implementation Decisions (30s)
*[Show `lib/access.ts` briefly, scrolling slowly. Then show ARCHITECTURE.md]*

"Three decisions I want to call out:

**First**, one access function—`getRole` and `can`—is the single source of truth. Every API route calls it. Non-members get a 404 so document existence isn't leaked. I unit-tested the full permission matrix.

**Second**, saves include a version number. If another user edited the doc, you get a 409 conflict instead of silently overwriting.

**Third**, I chose Postgres on Neon with Vercel, because SQLite on serverless would lose data on cold starts."

---

### 4:05-4:25 | What I Deprioritized (20s)

"On purpose, I did **not** build real-time collaboration, version history, comments, or OAuth. Those are real features, but each would've cost depth in the core flow. With another 2-4 hours, I'd add version history first, then conflict merge UI, then real-time with Yjs."

---

### 4:25-4:55 | How AI Supported the Workflow (30s)
*[Show `docs/AI_LOG.md`, scroll past 2-3 entries]*

"I used **Kiro** with Claude. I wrote the architecture plan and constraints, then worked block by block using file edits and verification. AI sped up:
- Schema design and migrations
- Tiptap toolbar wiring
- Test scaffolding
- Import pipeline setup

**What I changed or rejected:**
- AI suggested raw `contentEditable`—I insisted on Tiptap for production quality
- AI proposed SQLite for Vercel—I chose Postgres for persistence
- AI scattered permission checks—I centralized them in `lib/access.ts`

I verified with unit tests, a two-browser walkthrough, and API-level permission bypass attempts."

---

### 4:55-5:00 | Close (5s)

"That's the walkthrough. The live link, credentials, and docs are in the submission. Thanks for watching!"

---

## If You Run Long, Cut In This Order:

1. The `bad-file.pdf` error demo (keep one sentence)
2. The `lib/access.ts` screen scroll (just say it)
3. The numbered list creation
4. The "Sign in as Alice" narration detail

**NEVER CUT:**
- Sharing section (Bob viewer/editor switch)
- Refresh persistence moment
- Version conflict explanation
- AI rejection examples

---

## Recording Tips

1. **Record in sections** (0-1min, 1-2min, etc.) and stitch
2. **Move mouse slowly** - pause 1 second after each click
3. **Say before doing** - "I'll click Share" then click
4. **Be specific on AI** - Name actual suggestions you rejected
5. **Test the link** in incognito before submitting

---

## Final Checklist

- [ ] Recorded on live URL with fresh seed data
- [ ] All sections covered: flow, decisions, cuts, AI
- [ ] Under 5:00
- [ ] Audio clear, screen readable at 1080p
- [ ] Link works while logged out
- [ ] Nothing contradicts README/SUBMISSION.md
- [ ] Video uploaded and link in `VIDEO_URL.txt`

---

## Quick Talking Points Reference

**Core Flow:** Login → Create → Edit/Format → Persist → Import → Share → Role enforcement

**Key Decisions:**
1. Single access function (`lib/access.ts`)
2. Version-based conflict detection
3. Postgres on Neon for persistence

**Intentional Cuts:**
- Real-time collaboration
- Version history
- Comments
- OAuth/real auth

**AI Usage:**
- ✅ Used for: Schema, toolbar, tests, boilerplate
- ❌ Rejected: SQLite, raw contentEditable, scattered permissions
- ✔ Verified: Unit tests + manual walkthrough + API bypass attempts

**Next Steps (2-4 hours):**
1. Version history
2. Conflict merge UI
3. Yjs real-time collaboration
