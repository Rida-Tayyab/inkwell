# Design Direction: "Quiet Editorial"

> For the building agent. This replaces the previous design file. Copy to `.kiro/steering/design.md`. Goal: simple, calm, confident. Looks like a well-made writing tool, not a template. Total polish budget: about 30 minutes in block H. Restraint is the design.

## Principles

1. **The document is the hero.** Chrome is quiet, content is large.
2. **One accent, used sparingly.** Color means "this is interactive or important".
3. **Space and type do the work.** No decoration, no ornaments, no effects.
4. **Consistency over cleverness.** A small set of tokens used everywhere.

## Palette (tokens only, no hard-coded hex in components)

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#FAFAF8` | App background |
| `--surface` | `#FFFFFF` | Editor sheet, cards, dialogs |
| `--text` | `#1C1C1A` | Primary text |
| `--text-muted` | `#6B6B66` | Secondary text, metadata |
| `--border` | `#E6E5E0` | Hairlines, card and input borders |
| `--accent` | `#1F6F5C` | Primary buttons, links, focus ring, active tool (deep green) |
| `--accent-soft` | `#E3F0EC` | Active toolbar button bg, hover tint, "Editor" chip |
| `--danger` | `#B3392F` | Errors, destructive actions |

No gradients, no purple, no pure black. Text on `--bg` and `--surface` must pass AA. The accent is the only saturated color on screen.

## Typography

- **UI:** `Geist` (or `DM Sans`) via `next/font`. Sizes: 13 (meta), 14 (UI), 16 (body), 20, 28, 36. Weights 400/500/600 only.
- **Document content:** `Source Serif 4` (or `Newsreader`) at 18px/1.7, comfortable measure (about 68 characters wide). Headings in the same serif: H1 34, H2 26, H3 20, weight 600, tight line height.
- **Document title:** serif, 36px, 600, borderless input.
- Dashboard page title and the login wordmark use the serif as well, so the product shares its voice with the document. Everything else stays sans.

## Shape and depth

- Radius: **8px** on cards, inputs, buttons and dialogs. Chips are fully rounded.
- Borders: 1px `--border`. Shadows: one subtle token only, `0 1px 2px rgba(28,28,26,.06), 0 4px 16px rgba(28,28,26,.04)`, used on the editor sheet and dialogs. Cards get a border and no shadow, with a border color darkening on hover.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64. Use nothing else.

## Layout

- **Top bar:** 56px, `--surface`, bottom hairline. Wordmark (serif) on the left, user menu on the right. Nothing else.
- **Dashboard:** centered container, max 880px. Heading row with the page title and two buttons (primary "New document", secondary "Import file"). Below that, two simple underlined tabs, **"My documents"** and **"Shared with me"**. Documents are a clean **list**, not a grid: each row has the title (500 weight), a muted "Edited 3 min ago", and a chip on the right. Shared rows add "from Alice". Row hover is a faint `--accent-soft`-tinted background. Lists are faster to scan and look more deliberate than card grids.
- **Editor:** `--bg` background with a centered white sheet (max-width 760px, generous 64px padding, the one shadow token). A slim toolbar sits sticky above the sheet, grouped by thin dividers: block type dropdown | B I U | bullet, numbered | undo, redo. The save status sits at the toolbar's right in muted 13px text. Back arrow and Share button in the top row.
- **Mobile (under 640px):** the sheet goes full-bleed with 20px padding, the toolbar scrolls horizontally, and no horizontal page scroll.

## Components (build these four first)

- **Button:** primary (accent fill, white text), secondary (white, border), ghost (no border). 36px height, 500 weight, 8px radius. Hover darkens slightly, focus shows the ring.
- **Chip:** Owner (text on `--border` tint), Editor (`--accent-soft` + accent text), Viewer (neutral). Small, 12px, medium weight, fully rounded.
- **Field:** label above, 1px border, accent focus ring, inline error in `--danger` below.
- **Dialog:** centered, 8px radius, the shadow token, dimmed `rgba(0,0,0,.35)` backdrop (no blur), focus trapped, Esc closes.

## States and details

- **Save status:** muted text, `Saving…` / `Saved` / `Couldn't save · Retry` (retry in `--danger`).
- **Share dialog:** email field plus role select on one row, then a clean list of collaborators with a chip and a "Remove" text button.
- **Import:** a plain dashed `--border` dropzone inside a dialog. Helper text: "Supports .txt, .md and .docx, up to 2 MB." Drag-over tints `--accent-soft`.
- **Empty states:** one short sentence and one button, centered, with a small line icon. No illustrations.
- **Login:** a centered card. Serif wordmark, one-line tagline, then the three seeded users as simple rows ("Sign in as Alice"), and the demo password in a muted mono line beneath.
- **View-only banner:** a slim `--accent-soft` bar above the sheet: "You have view-only access."

## Motion

150ms ease for hover and focus color changes, dialog fade (opacity only). Nothing else. Respect `prefers-reduced-motion`.

## Icons

`lucide-react`, 18px, stroke 1.75, muted color (accent when active). Icon-only buttons get an `aria-label`, a tooltip, and a visible focus ring (`2px solid var(--accent)`, offset 2px).

## Voice

Plain and short. "New document", "Untitled document", "Shared with you by Alice". Errors say what happened and what to do: "That file type isn't supported. Use .txt, .md or .docx." No exclamation marks, no emoji, no "Oops".

## Implementation notes

- Tokens in `app/globals.css` under `:root`, mapped into the Tailwind theme.
- Style Tiptap content with one scoped `.doc-content` class (headings, lists, blockquote with an accent left border, inline code in mono).
- Skip dark mode and say so in the architecture note.

## Avoid

Gradients, glows, blurs, glassmorphism, emoji as icons, heavy shadows, many accent colors, uniform three-column card grids, Inter or system fonts, decorative illustrations, and any hard-coded color or off-scale spacing.

## Visual QA checklist

- [ ] Only palette tokens, the type scale and the spacing scale are used.
- [ ] The accent appears only on primary actions, links, focus and active states.
- [ ] Dashboard, editor, share dialog, import dialog and login checked at 375, 768 and 1280px.
- [ ] Keyboard pass on the toolbar and dialogs. Focus ring always visible.
- [ ] AA contrast checked for `--text-muted` on `--bg`.
- [ ] Log one AI-suggested default you rejected (for example a gradient, a generic font or a heavy shadow) in `docs/AI_LOG.md`.