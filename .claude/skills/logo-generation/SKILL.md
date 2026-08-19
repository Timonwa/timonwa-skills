---
name: logo-generation
description: Use when creating or regenerating a brand's logo and icon assets — any of the seven logo types (wordmark, lettermark, pictorial, abstract, mascot, combination, emblem), the standalone brand icon, favicons, PWA/maskable icons, and apple-touch icons. Owns the production standards; outlined type, platform safe zones (maskable 40%-radius circle, Android adaptive 66/72/108dp, Apple's no-alpha and no-pre-rounding rules), the minimal modern favicon set, and the WCAG logotype exemption. Usage rules (clear space, minimum size, don't distort) → `branding`; diagrams and UI icons → `svg-generation`; file names → `naming`.
metadata:
  version: 2.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# Logo generation

Producing the brand's own marks. This is a different job from drawing an icon or a diagram: a logo is an **exportable asset** that has to survive leaving the codebase — into Figma, a press kit, a social template, someone else's slide deck — and an **installable asset** that has to survive every platform's mask, crop, and theme.

> **This skill produces the assets; `branding` governs how they're used** (clear space, minimum render size, which variant on which background, never distort or recolour). Drawing UI icons, diagrams and illustrations → `svg-generation`. Palette and type come from the project (`tailwind-css`, `frontend-design`). File naming → `naming`.

## First: which of the seven logo types is this?

"Logo" is not one shape of asset. The industry taxonomy is seven types — two built from text, three from imagery, two blended — and **the type decides which assets exist at all**, so settle it before drawing anything.

| Type | Built from | Examples | Survives 16px? |
| --- | --- | --- | --- |
| **Wordmark** (logotype) | the full name, as type | Google, FedEx | No — needs a derived mark for icon slots |
| **Lettermark** (monogram) | initials, as drawn letterforms | IBM, HP, Netflix "N" | Yes — it *is* the icon |
| **Pictorial mark** | a literal, nameable image | Apple, Target | Yes, if simple |
| **Abstract mark** | non-literal geometry | Nike, Mastercard | Yes, if simple |
| **Mascot** | a character | Michelin Man | Rarely — derive a simplified head/silhouette |
| **Combination mark** | mark + wordmark in a lockup | most startups | The mark detaches and serves alone |
| **Emblem** | name locked inside a shape/badge | Starbucks, crests | No — least scalable type; draw a separate simplified icon |

Choosing, when the owner hasn't: short distinctive name → wordmark; long name → lettermark; established brand → pictorial or abstract; personality → mascot; heritage/institutional → emblem; new brand or unsure → **combination mark**, because the mark detaches cleanly for every icon slot and the name rides along everywhere else.

Two consequences people miss:

- **Every brand needs a square icon; not every brand needs a lockup.** A pictorial-mark brand may never ship a wordmark asset. A wordmark brand still must derive a mark (usually a lettermark) because full names die at 16px.
- **A lettermark is a mark, not text.** Netflix's "N" is a drawn shape that happens to be a letter. It follows the icon rules below, not the wordmark rules.

## Ask before drawing

Never infer a brand. Gather in one batch:

- **Which of the seven types** the brand is — or, for a new brand, present 2–3 type-appropriate directions and let the owner choose.
- **Whether a mark already exists** that the icon must be derived from, or whether one must be designed.
- **Brand colour** — the exact value, and where it lives (a token, a committed constant, a hex in the brand guide). If the project has one, use it; never invent a hex.
- **The default variant** — which background is the logo's "home", light or dark.
- **Which variants are needed** — light, dark, monochrome (single-colour for stamps/embroidery/Android themed icons), and any inverted or knockout version.
- **Where it will be used** — favicon and web app icons only, or also a native app (pulls in Apple's and Android's store rules below), social cards, README headers, merch, print (pulls in CMYK and mono).
- **The font** — the wordmark's typeface, its weights, and whether its licence permits outlining (below).

Offer options and let the owner choose; a logo is a subjective call and the owner's taste outranks yours. Show real renders, not descriptions.

## The deliverables, and don't conflate them

| Artifact | Contains | Used for |
| --- | --- | --- |
| **Primary logo** | whichever of the seven types the brand is | site header, README, press, decks |
| **Lockup variants** | combination brands: horizontal and, if needed, stacked | wide headers vs. square-ish placements |
| **Brand icon** | the mark alone — derived for wordmark brands, simplified for emblems/mascots | favicon, app icon, avatar, notification badge |
| **Favicon / app icon set** | rasterised brand icon at platform sizes and safe zones | browser tab, home screen, install surfaces |

The most common mistake is building the lockup as live HTML text next to an SVG. That is a **header composition**, not a logo: it inherits the site font, so a font change silently changes the brand, and it can't be exported at all.

## Outline the type — always

The wordmark must ship as `<path>` data, never `<text font-family="…">`.

- `<text>` renders with whatever font the *viewer* has. Outside your site that is the wrong font or a fallback.
- Outlined paths render identically everywhere, with no font to install and no `@font-face` to embed.
- The trade: the text is no longer editable or selectable, and it won't be found by search or screen readers — so give the root an accessible name (below) and keep the source font noted for future edits.

**Check the licence first.** Outlining redistributes the glyph outlines. OFL and Apache-2.0 fonts permit it; many commercial licences restrict embedding or modification. If the licence forbids it, either license the font properly, or draw a custom wordmark.

### Workflow

Fonts loaded via `next/font/google` (or any CDN) leave no file in the repo — fetch the actual file the service serves, then outline it. Install the tooling **outside the project** so a one-off asset build never lands in `package.json`:

```bash
# 1. Find the real font file behind the CSS
curl -s "https://fonts.googleapis.com/css2?family=Geist:wght@400;700" \
  -H "User-Agent: Mozilla/5.0" | grep -oE "https://[^)]+\.(ttf|woff2)"

# 2. Fetch the weights the wordmark uses
curl -s -o /tmp/font-700.ttf "https://fonts.gstatic.com/…"

# 3. Outliner in a scratch dir, not the project
mkdir -p /tmp/fonttool && cd /tmp/fonttool && npm install opentype.js
```

Generate with `getPath().toPathData()`, and take advance widths from the font so the layout is measured rather than guessed:

```js
const opentype = require("opentype.js");
const fs = require("fs");
const bold = opentype.parse(fs.readFileSync("/tmp/font-700.ttf").buffer);

const size = 34;
const d = (font, text, x, y) => font.getPath(text, x, y, size).toPathData(2);
const w = (font, text) => font.getAdvanceWidth(text, size);
```

`opentype.loadSync()` is deprecated — use `parse(readFileSync(path).buffer)`.

Delete the scratch dir afterwards. Keep the generator script with the assets if the logo will be regenerated (a colour change, a new variant); otherwise discard it and note the font and sizes in a comment.

## Brand colour must not be a themeable token

If the project themes `--primary` per route, per tenant, or per product area, the brand mark **cannot** use it — the logo would change colour depending on where it appears, which is the one thing a logo may never do.

Give the brand its own token, set once and never overridden:

```css
--primary: oklch(0.555 0.18 265); /* themeable — sections may override */
--brand: oklch(0.555 0.18 265); /* the logo's colour — never overridden */
```

Check for existing overrides before assuming: grep the stylesheets for `--primary` and look for scoped redefinitions.

## Derive every number — never invent one

The failure mode is picking sizes that "look about right" and shipping a mark that is subtly, permanently wrong. Every dimension comes from either a measurement or an established ratio.

### Optical overshoot: circles must be bigger than squares

A circle inscribed in a box fills only π/4 ≈ **78.5%** of it; a square fills ~100%. Give them the same nominal size and the circle reads as smaller. Round shapes therefore **overshoot** their keyline.

Material's icon keylines codify the amount — on a 24dp grid the square keyline is 18×18 while the circle is **Ø20**, an ~11% overshoot. Apply the same idea:

| Sibling shapes | Overshoot |
| --- | --- |
| circle beside a hard-edged square | ~10–11% |
| circle beside a **rounded** square | ~6–8% (the rounding already removes area) |
| pointed shapes (triangle, diamond) | more again — they fill least |

A mark whose round and square elements share identical bounding boxes has this bug. Check it by rendering large with keyline rectangles drawn over both shapes.

### Optical, not mathematical, centring

- Centre a glyph on its **visual mass**, not its bounding box. Asymmetric marks (a play triangle, a lone descender) need nudging.
- Align a mark to the wordmark's **cap height** or optical centre, never to its box, which includes ascender and descender space the eye doesn't see.
- Overshoot deliberately breaks mathematical symmetry. That's correct: optics win.

### Proportional type scale

- A secondary line ("by <Creator>", a tagline) sits at roughly **0.5–0.6×** the wordmark's size. Below ~0.45× it stops reading as part of the lockup and starts looking like a mistake.
- WCAG formally exempts logotype text from contrast minimums (below), but treat **4.5:1 as the design floor** for any secondary line anyway — a light grey that "looks subtle" at 40px is illegible at 16px, and an unreadable tagline shouldn't exist.
- Derive the lockup's own dimensions from font metrics: `getBoundingBox()` for ink extents, `getAdvanceWidth()` for widths. Then the mark's height can be set **equal to the measured text block**, so the two stay aligned if the type size ever changes.

### Keep proportions relative

Express the tile's corner radius and the inner glyph's scale as ratios of the tile size, so resizing preserves the design instead of distorting it:

```js
const r = (ICON * 11) / 48; // corner radius keeps its ratio
const k = ICON / 48;        // inner glyph scales with the tile
```

Baked-in rounding is for surfaces that apply no mask of their own (README, in-app rendering, avatars you control). Platform icon slots mask for you — see the safe-zone rules below before rounding anything.

## Design for the smallest size first

A mark lives at 16px in a browser tab far more often than at 512px. Detail that dies below ~24px is detail that doesn't exist.

- Test at **16, 20, 24, 32** before considering the design settled. Concepts that need fine detail (a fanned multi-tool, a detailed animal, lettering inside a shape) reliably fail here.
- Build a throwaway preview harness — an HTML page rendering each candidate at every size, on light **and** dark backgrounds — and screenshot it. Judging a logo from source or at one size is guessing.
- Prefer simple geometry with one idea. A mark that encodes the name beats a generic one.

## Composing the lockup

- Measure, don't eyeball: derive the SVG's `viewBox` width from the outlined text's advance widths plus the mark and the gap.
- Align the wordmark's baseline to the mark's optical centre, not its bounding box.
- A "by <Creator>" line is set smaller, in a muted tone, and aligned to one edge of the wordmark — usually right-aligned under it, so the lockup stays a tidy rectangle.
- Keep the mark's own geometry identical between the lockup and the standalone icon. Two slightly different marks is the drift this skill exists to prevent.

If the header renders the logo as live text for responsive reasons, accept it as a *second* implementation of the same design and keep it visually identical — or point the header at the asset and let CSS swap the dark variant.

## Icon geometry: square canvas, circular safe zone

Every icon slot takes a **square file**, but the artwork must never fill it: platforms crop icons to circles, squircles, and rounded squares you don't control, and every one of those masks eats the corners. The universal rule is **square canvas, content inside the inscribed circle** — the mark is centred with padding, whatever its own shape, and never stretched to fit.

The exact safe zones, from the platform specs:

| Slot | Canvas | Guaranteed safe zone | Rules |
| --- | --- | --- | --- |
| **PWA maskable** (W3C) | square, 512px recommended | circle, radius **40%** of the edge (the inner 80%; ~51px padding per side at 512) | padding **opaque** brand background, never transparent — the OS fills transparency with white or black |
| **Android adaptive** | 108×108dp per layer | Ø**66dp** circle guaranteed; **72dp** max ever visible; 18dp margin per side is mask/parallax bleed | three layers: background (fully opaque), foreground, **monochrome** (required for Android 13+ themed icons) |
| **apple-touch-icon** | 180×180px | iOS masks the corners with its own superellipse | full-bleed opaque artwork, **no alpha channel, no pre-rounded corners** — pre-rounding double-rounds and transparent corners render as black |
| **App Store master** (native apps) | 1024×1024px | same corner mask | flattened, fully opaque; App Store Connect rejects any alpha channel even on an opaque image |
| **watchOS** | square | circle | circular mask, full stop |
| **macOS** | 1024×1024px | none — **the one exception** | macOS keeps the shape you ship: transparency allowed, and you bake in your own corner radius |

Manifest discipline that follows from this:

- **Never combine `purpose: "any maskable"` on one entry.** A maskable icon carries 10% padding per side; reused as a plain `any` icon it renders visibly smaller than its neighbours. Ship separate files — plain `icon-192/512.png` with `purpose: "any"`, padded `icon-maskable-192/512.png` with `purpose: "maskable"`.
- Add a `purpose: "monochrome"` entry if the brand has a mono variant — it feeds themed-icon surfaces the same way Android's monochrome layer does.
- **Dead formats — don't generate them:** `browserconfig.xml` and `mstile-*.png` (Windows tiles died with Windows 10 Mobile) and Safari's `mask-icon` pinned-tab SVG (replaced by the standard SVG favicon).

**Native Apple apps changed in iOS 26.** Icons are now layered "Liquid Glass" — up to four depth groups composed in Apple's Icon Composer (ships with Xcode 26) into a single `.icon` file covering six appearance modes (default, dark, clear ×2, tinted ×2). A flat 1024px PNG still works but gets a default composited effect and looks dated beside native icons. If the brand ships a native iOS/macOS app, export the mark as **separate layers** (background / midground / glyph) so it can be composed there; complex single-layer illustrations convert badly. This skill's flat pipeline is the web path.

## The asset set

The modern set is small — a handful of files, not the thirty a legacy generator emits. Generate rasters **from the SVG**, at the sizes each platform actually asks for:

| File | Size | Notes |
| --- | --- | --- |
| `logo.svg` / `logo-dark.svg` | vector | primary logo, per background |
| `brand-icon.svg` | vector | the mark alone — single source for every raster below |
| `icon.svg` | vector | favicon; can self-theme (below) |
| `favicon.ico` | 32×32 | **at the site root** — RSS readers and crawlers probe `/favicon.ico` without reading HTML; multi-size only if the 16px downscale is poor |
| `apple-icon.png` | 180×180 | full-bleed, opaque, un-rounded (rules above) |
| `icon-192.png`, `icon-512.png` | 192 / 512 | manifest, `purpose: "any"` |
| `icon-maskable-192.png`, `icon-maskable-512.png` | 192 / 512 | manifest, `purpose: "maskable"`, content in the 80% circle, opaque padding |

The SVG favicon can adapt to the browser theme — the one trick no raster can do:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <style>
    path { fill: #111; }
    @media (prefers-color-scheme: dark) { path { fill: #eee; } }
  </style>
  <path d="…" />
</svg>
```

```js
// sharp renders SVG → PNG; density raises the rasterisation resolution first
await sharp(svg, { density: 600 }).resize(size, size).png().toFile(out);
```

**`sharp` cannot write `.ico`.** It needs a dedicated tool (`png-to-ico`, ImageMagick, or a generator) — so `favicon.ico` is the one asset that silently keeps the old mark after a rebrand. Check it explicitly.

In a Next App Router project, `src/app/icon.png`, `apple-icon.png` and `favicon.ico` are picked up by convention; `public/` holds everything referenced by the manifest or by URL. The square icon also serves as the Organization `logo` in structured data — Google requires **≥112×112px** at an absolute, crawlable URL (→ `seo`; usage → `branding`).

## Accessibility

- A standalone logo is **informative**: `role="img"` on the root plus a `<title>` as the first child (or `aria-label` if a hover tooltip is unwanted). The name is the brand name, since outlined type is invisible to assistive tech. Ids must be unique per page — derive from `useId()` when inlined in React.
- A logo inside a link takes its accessible name **from the link, describing the destination** — `aria-label="<Brand> — home"`, with the SVG `aria-hidden="true"`. "Acme logo" tells a screen-reader user nothing about where the link goes.
- Purely decorative repetitions of the mark get `aria-hidden="true"` and no role.
- `focusable="false"` was an IE/legacy-Edge fix; current browsers don't need it.
- **The WCAG logotype exemption, stated precisely** (SC 1.4.3): *"Text that is part of a logo or brand name has no minimum contrast requirement."* Its limits matter more than the exemption — it does **not** cover brand colours used for body text, buttons, or headings, and a logo serving as the home link is still a UI component that must be identifiable under SC 1.4.11 (3:1 non-text contrast). Verification → `accessibility`.

## Checklist

- [ ] The logo's **type** (of the seven) was established first, and the asset list derived from it — including a derived mark for wordmark brands and a simplified icon for emblems/mascots.
- [ ] Brand colour, default variant, and the required variant list came from the owner, not from you.
- [ ] Round elements overshoot their square siblings (~6–11%), verified with keylines at large size.
- [ ] Secondary line is 0.5–0.6× the wordmark and passes 4.5:1 as a design floor.
- [ ] Mark height derived from the measured text block; radius and inner scale expressed as ratios.
- [ ] Wordmark type is outlined; no `font-family` anywhere in the asset. Font licence permits outlining, and is recorded.
- [ ] Brand colour is its own token, unaffected by any theme override.
- [ ] Mark renders legibly at 16px, verified by screenshot, on light and dark.
- [ ] Lockup and standalone icon share identical mark geometry.
- [ ] Maskable icons keep content inside the **40%-radius circle** with opaque padding, shipped as separate manifest entries — never `"any maskable"` combined.
- [ ] `apple-icon.png` is full-bleed, opaque, alpha-free, and **not** pre-rounded; no dead formats (`browserconfig.xml`, `mstile-*`, `mask-icon`) generated.
- [ ] Every raster regenerated from the SVG — including `favicon.ico`, which needs separate tooling and lives at the site root.
- [ ] Standalone logos have `role="img"` + a name; linked logos are named by the link and the SVG hidden.
- [ ] Outlining tool installed outside the project; scratch files removed.
- [ ] Files named per `naming`; optimised per `svg-generation`.
