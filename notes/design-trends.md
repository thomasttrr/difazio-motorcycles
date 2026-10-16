# Design trends research — Difazio Motorcycles
**Date:** Thu 15 Oct 2026, ~4:25–5:00 AM ET (Phase 2 overnight pass)
**Site context:** warm graphite (`#2b2d31` family) + brass accent (`#e2ad5b`); Fraunces + Inter; editorial archive, not a sales site; outstanding mobile/iPad UX already.

## Sources checked tonight
### Articles / trend roundups
- [Figma — Top Web Design Trends for 2026](https://www.figma.com/resource-library/web-design-trends/) — 3D/immersive, bold type, dark mode as baseline, restrained motion, sustainable/accessible builds.
- [the PRSD — Museum Web Design (2026)](https://www.theprsd.co.uk/2026/05/07/great-museum-websites/) — practical visitor UX, WCAG, mobile-first pathways, descriptive media text, performance as part of the visit.
- [Carbon UI — Immersive cultural / heritage UI](https://www.carbon-ui.com/designing-immersive/) — media-first layouts, dark canvases for historical photography, timelines, accessible modals, generous whitespace.
- [OWDT — MFAH redesign case](https://owdt.com/portfolio/mfah/) — editorial serif + geometric sans, whitespace as curatorial space, subdued cinematic micro-interactions, standardised image ratios.
- [Max Digital Edge — Atrium museum template notes](https://maxdigitaledge.com/website-designs/atrium-museum) — gallery-led scroll stories, ochre/plaster/black, Inter body + display serif, hover-zoom on collection pieces, sticky visit rail (less relevant for an archive).
- [wolfcode — luxury automotive landing (APEX)](https://www.wolfcode.studio/en/case-studies/how-we-designed-a-luxury-automotive-landing-page-that-feels-like-a-flagship-showroom/) — near-black + single gold accent used structurally; thin display serif vs tracked condensed sans.
- [Palate — automotive references](https://palatemcp.com/gallery/vertical/automotive) — Gunther Werks (graphite + warm bronze CTA), Automobili Amos (UI disappears over full-bleed photo), Alfaholics (heritage restorer as marque museum).
- [Apex Drive template notes](https://pagesmith.ai/templates/blog/apex-drive/) — dark cinematic automotive journal; massive romantic serif vs clinical grotesk; no scroll-hijacking.

### Refero MCP
- **Unavailable tonight:** `NO_SUBSCRIPTION` / expired (`https://refero.design/mcp/upgrade`). Could not pull live screen/style references. Re-run Refero searches when the subscription is active: museum collection grids, editorial dark heritage, motorcycle marque archives.

### Exa MCP
- Rate-limited (429) during this pass; used WebSearch / WebFetch instead.

## What peers are doing (museum / heritage / editorial / auto)
| Pattern | Who / where | Fit for Difazio? |
|---|---|---|
| Serif display + quiet sans for UI | MFAH, Atrium, APEX auto | **Already have** (Fraunces + Inter). Keep; do not swap fonts casually. |
| Dark / graphite canvas so photos dominate | Carbon UI heritage notes, Gunther Werks, Apex Drive | **Already have.** Difazio is “darker but not dark-mode” — stay warm graphite, not Vantablack. |
| Single warm metal accent (brass/bronze/gold) used sparingly | APEX gold, Gunther bronze | **Already have** brass. Do not add neon or second accent colours. |
| Whitespace / spacing as curation | MFAH | Small spacing polish OK; avoid sparse “luxury void” that fights the dense archive story. |
| Gallery hover-zoom / lift on collection tiles | Atrium, museum cards generally | **Partial** — cards already lift on fine-pointer hover. Shipped tonight: focus-within + lightbox/bnav/tl-nav hover/focus. |
| Immersive 3D / WebGL | Figma 2026 trend #1 | **Already have** hub explainer. Measure real-device FPS before adding more 3D (audit §4). |
| Experimental / radial nav | Figma trend #2 | **Poor fit** — keep bottom nav + timeline chips; archive readers need orientation. |
| Maximalism / neo-brutalism / collage | Figma 2026 | **Reject** for this site. |
| Sustainable / lean assets | Figma trend #13, museum perf advice | Aligns with existing WebP srcsets + SW strategy. Keep image/GLB versioning discipline. |
| Descriptive alt text & accessible modals | PRSD museum, Carbon UI | **Shipped tonight** — six card alts rewritten to match gallery captions. |
| Machine/collection registry as structured data | heritage archives generally | Draft JSON advanced tonight; **do not** switch live rendering until CLS/lazy-srcset proven. |

## What fits Difazio specifically
Difazio should stay a **warm editorial archive**: graphite workshop walls, brass as a single structural accent, Fraunces for story heads, Inter for navigation and body. Peers that feel closest are museum collection pages and restrained automotive heritage (Gunther Werks bronze-on-graphite, Alfaholics-as-marque-museum) — not fashion maximalism and not ultra-black “luxury void” dealership pages.

Strengths to protect:
- Mobile / iPad bottom nav and timeline chips
- Gallery lightbox with real captions and credits
- Prefer-reduced-motion already wired in CSS, `app.js`, `hub3d.js`
- High Lighthouse a11y/SEO scores (audit: 100 / 100)

Gaps peers highlight that we still have:
1. Six machine cards without photos read as “holes” in a collection grid.
2. Card alts were generic (fixed tonight).
3. No structured machine registry on the client yet (draft only).
4. Refero screen board not refreshed (subscription).

## Concrete next steps for Tom
### Ship-ready (small, non-factual) — done or trivial
- [x] Descriptive card image alts (Phase 2, main).
- [x] Hover/focus consistency on `.bnav`, `.tl-nav`, lightbox controls, card `focus-within`.
- [ ] Optional later: slightly larger mobile card gap (18→20px) if Phase 3 feels tight — only after a real-phone glance.

### Preview branch (needs your OK before merge)
- **Empty-image card placeholders** (`design/2026-10-15-card-placeholders`): dashed brass frame + muted “Photo to come” label for the six cards without images, so the Notable machines grid feels intentional rather than incomplete. No new historical photos.
- **Optional later previews (not started tonight):**
  - Curatorial caption overlay on card hover (museum-style) — risk of clutter on mobile.
  - JSON-driven `#models` render from `machines-registry-draft.json` — only after a no-CLS prototype.
  - Soft light theme toggle — low priority; warm graphite is the brand.

### Do not chase
- Font swaps, second accent colours, hero redesign, React migration, scroll-hijacking, AI chatbots, collage/maximalism.

## Phase 2 implementation note
Safe polish landed on `main` with SW cache bump `difazio-v13` → `difazio-v14`. Larger visual experiments go only on `design/2026-10-15-*` preview branches.

---

# Design trends delta — Fri 16 Oct 2026 (~4:25 AM ET, Phase 2)
**Context:** Same Difazio look (warm graphite `#2b2d31` + brass `#e2ad5b`, Fraunces + Inter). Card placeholders already live on main. `design/glass-depth` remains a separate large preview (not merged).

## Sources checked tonight
### Articles / case notes (new or re-checked)
- [Envato Elements — Web design trends 2026](https://elements.envato.com/learn/web-design-trends) — mature glassmorphism as hierarchy (not decoration); purposeful micro-interactions; reject decorative motion.
- [Tubik — 7 UI trends 2026](https://tubikstudio.com/blog/ui-design-trends-2026/) — “purposeful motion”; **anti-Liquid Glass** when blur fights legibility; craft over spectacle.
- [Rajesh R Nair — UI trends 2026 (shipping vs portfolio)](https://rajeshrnair.com/blog/design/ui-ux/ui-design-trends-2026-bento-grids-glassmorphism.html) — restrained glass for sticky chrome / short labels only; avoid on dense text; `backdrop-filter` cost on mid-range phones.
- [The Plus Addons — Web design trends 2026](https://theplusaddons.com/blog/web-design-trends-2026/) — glass sticky headers as durable pattern; restraint as the durable “trend”.
- [PRSD — Museum web design (May 2026)](https://www.theprsd.co.uk/2026/05/07/great-museum-websites/) — re-checked: digital front door, storytelling journeys, a11y-from-start, mobile-first clarity, SEO for collections.
- [Museable — Connecting collections, content, audiences](https://museable.com/museum-website-collections-content-audiences/) — visitors land on deep pages; connect object → story → related records (fits our #models ↔ timeline ↔ sources intent).
- [Daniel Macedo — Designing art experience (Cleveland MoA)](https://danielmacedo.com.br/bside/designing-art-experience) — interface steps back when the artwork enters; system language for accessibility; rhythm per content type.
- Automotive / marque heritage: [Palate automotive refs](https://palatemcp.com/gallery/vertical/automotive) (Gunther Werks bronze-on-graphite, Alfaholics-as-museum, Amos full-bleed); [Type SB / Corelo](https://corelo.co.uk/work/type-sb) (near-black + bronze, collection index as plates in a book); [Norton redesign notes](https://www.onething.design/projects/norton) (heritage storytelling + clean IA — conversion-heavy, so take storytelling only); Harley CR38 concept (editorial treatment of machines, not SKUs).

### Refero MCP
- **Still unavailable:** `NO_SUBSCRIPTION` / expired (`https://refero.design/mcp/upgrade`). No live screen board tonight. Same retry list as 15 Oct: museum collection grids, editorial dark heritage, motorcycle marque archives.

### Exa MCP
- Not relied on tonight (prior 429s); WebSearch / WebFetch used instead.

## Delta vs 15 Oct — what still fits Difazio
| Pattern | 15 Oct take | 16 Oct delta |
|---|---|---|
| Serif + quiet sans | Keep Fraunces + Inter | Unchanged. Type SB / museum catalogues reinforce display serif for “plates”, Inter for chrome. |
| Warm graphite + single brass accent | Protect | Unchanged. Gunther / Type SB bronze-on-near-black still the closest auto peers. |
| Glass / frosted depth | Optional preview (`design/glass-depth`) | 2026 consensus: glass OK for **chrome / short labels**, bad for long copy; anti-Liquid Glass if blur hurts contrast. **Do not merge glass-depth blindly**; if revisiting, narrow to sticky nav / caption chips, not full panels over body text. |
| Purposeful motion | Prefer-reduced-motion already calm | Stronger industry signal: motion must explain. Keep card lift / lightbox zoom; no kinetic type, no scroll-hijack, no decorative loops. |
| Collection cards as curatorial objects | Placeholders shipped; hover lift live | **New fit:** museum wall-label / curatorial caption on **fine-pointer hover only** (overlay year · name on image). Mobile stays clean (no overlay on coarse pointer). Preview branch tonight. |
| Object ↔ story linking | Partial (timeline + cards + sources) | Museable reinforces connecting machine cards to timeline/sources; no structural change overnight — note for Tom. |
| Bento / broken grids / maximalism | Reject | Still reject for this archive. |
| More WebGL / 3D | Hub explainer only | Unchanged — measure FPS before adding. |

## Concrete actions from this pass
### Shipped (or shipping) to main — small, non-factual
- Mobile/desktop `.cards` grid gap **18 → 20px** (15 Oct leftover; breathing room around placeholders).
- SW cache bump **difazio-v16 → difazio-v17** with that CSS touch.

### Preview only (needs Tom OK)
- **`design/2026-10-16-curatorial-captions`:** museum-style caption overlay on `#models` card media (fine pointer + keyboard focus-within). Reuses existing year/name facts; no new copy claims. Mobile/coarse: overlay hidden.
- Existing **`design/glass-depth`:** leave alone; latest branch alias still deploying as `https://difazio-motorcycles-git-design-332f8f-thomas-projects-4bf17056.vercel.app` (SSO protection may apply).

### Still do not chase
- Font swaps, second accent, hero redesign, React migration, scroll-hijacking, AI chat, collage/maximalism, merging glass-depth without a narrowed brief.

## Phase 2 implementation note (16 Oct)
Safe spacing polish on `main` with SW `difazio-v17`. Curatorial caption experiment only on `design/2026-10-16-curatorial-captions`.
