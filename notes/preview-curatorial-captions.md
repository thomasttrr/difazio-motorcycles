# Preview: curatorial captions on machine cards
**Branch:** `design/2026-10-16-curatorial-captions`  
**Date:** Fri 16 Oct 2026, Phase 2 overnight  
**Status:** Preview only — do **not** merge without Tom OK.

## Rationale
Museum / heritage collection UIs often treat each object as a wall label: short year line + title over the image on close looking, while the body copy below stays the longer story. Peers (Cleveland MoA “interface steps back”, Type SB “plates in a book”, MFAH standardised ratios) reinforce photo-first cards with restrained chrome.

Difazio already has year · type tags and titles below the image. This preview adds a **fine-pointer-only** caption overlay on the card media that repeats those existing facts (no new historical claims) so desktop/iPad-with-trackpad hover feels curatorial. Mobile / coarse pointer keeps the clean card (overlay `display:none`) so the carousel is not cluttered.

## What changed
- Wrapped each `#models` card image / placeholder in `.media`.
- Added `.curate` (aria-hidden) with the existing tag + h3 text.
- Hover / focus-within reveals the caption; mild image scale on fine pointer only.
- `prefers-reduced-motion`: no scale / no caption transition.
- SW cache `difazio-v17-curate` (preview branch only).

## What did not change
- No factual copy edits.
- No new photos.
- `design/glass-depth` untouched.

## Screenshots
- `notes/phase2-2026-10-16-curate-mobile.png` (~440×956)
- `notes/phase2-2026-10-16-curate-ipad.png` (~820×1180)
- `notes/phase2-2026-10-16-curate-desktop.png` (~1280×900)
- `notes/phase2-2026-10-16-curate-desktop-hover.png` (desktop with hover on first card)

## Review ask
Approve if the overlay feels museum-quiet and readable on brass/graphite; reject or ask for softer gradient / smaller type if it feels salesy or busy over placeholders.
