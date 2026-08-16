# A11y audit snippets

Runnable browser checks for the runtime audit layer. Each is a zero-arg function: paste the body into the DevTools **Console**, or pass the function to `chrome-devtools-mcp`'s `evaluate_script`. They inspect the _rendered_ DOM, so they catch things static analysis and the a11y tree can't (computed contrast, sizes, missing labels). Findings are heuristics — confirm the fix, don't auto-trust the numbers.

## 1. Orphaned form inputs (no accessible label)

```js
() => {
 const controls = [
  ...document.querySelectorAll("input:not([type=hidden]), select, textarea"),
 ];
 return controls
  .filter((el) => {
   if (el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.title)
    return false;
   if (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) return false;
   if (el.closest("label")) return false;
   return true;
  })
  .map((el) => ({
   tag: el.tagName.toLowerCase(),
   type: el.type,
   name: el.name || null,
   snippet: el.outerHTML.slice(0, 120),
  }));
}
```

## 2. Undersized tap targets (WCAG 2.2 — 24×24 min, 44×44 for touch)

```js
() => {
 const MIN = 24; // AA minimum; aim 44 for touch
 return [
  ...document.querySelectorAll(
   "a[href], button, input, select, textarea, [role=button], [role=link], [tabindex]:not([tabindex='-1'])",
  ),
 ]
  // NOT offsetParent — it's null for position:fixed, which would skip sticky headers, cookie banners, FABs
  .filter((el) => el.getClientRects().length > 0)
  // 2.5.8 exempts inline links in a line of text — skip them to avoid over-reporting prose
  .filter(
   (el) => !(el.tagName === "A" && getComputedStyle(el).display === "inline" && el.closest("p, li, dd, td, th, figcaption, blockquote")),
  )
  .map((el) => {
   const r = el.getBoundingClientRect();
   return {
    w: Math.round(r.width),
    h: Math.round(r.height),
    snippet: el.outerHTML.slice(0, 100),
   };
  })
  .filter((x) => x.w < MIN || x.h < MIN);
}
```

## 3. Color contrast (text nodes below AA)

Walks **text nodes**, not "elements without children" — skipping parents with element children would silently ignore most real copy (`<p>text <strong>bold</strong></p>`). Each text node is measured against its own parent's computed style.

```js
() => {
 const chan = (v) => {
  v /= 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
 };
 const lum = ([r, g, b]) => 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
 const parse = (s) => (s.match(/[\d.]+/g) || []).map(Number); // [r,g,b] or [r,g,b,a]
 const ratio = (fg, bg) => {
  const [hi, lo] = [lum(fg), lum(bg)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
 };
 const out = [];
 const seen = new Set();
 const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
 let tn;
 while ((tn = walker.nextNode())) {
  if (!tn.textContent.trim()) continue;
  const el = tn.parentElement;
  if (!el || seen.has(el) || el.closest("script, style, noscript")) continue;
  seen.add(el);
  const cs = getComputedStyle(el);
  if (cs.visibility === "hidden" || cs.display === "none") continue;
  const fg = parse(cs.color);
  let node = el,
   bg = null;
  while (node) {
   const bc = getComputedStyle(node).backgroundColor;
   if (bc && bc !== "rgba(0, 0, 0, 0)" && bc !== "transparent") {
    bg = parse(bc);
    break;
   }
   node = node.parentElement;
  }
  if (!bg || fg.length < 3) continue;
  const size = parseFloat(cs.fontSize);
  const large = size >= 24 || (size >= 18.66 && Number(cs.fontWeight) >= 700);
  const need = large ? 3 : 4.5;
  if (bg.length > 3 && bg[3] < 1) {
   // semi-transparent bg must be composited against everything behind it — a raw ratio would lie
   out.push({
    ratio: "verify manually (alpha background)",
    need,
    text: tn.textContent.trim().slice(0, 40),
    snippet: el.outerHTML.slice(0, 80),
   });
   continue;
  }
  const r = ratio(fg, bg);
  if (r < need)
   out.push({
    ratio: +r.toFixed(2),
    need,
    text: tn.textContent.trim().slice(0, 40),
    snippet: el.outerHTML.slice(0, 80),
   });
 }
 return out;
}
```

> Contrast over gradients / images / semi-transparent layers can't be computed reliably — the snippet flags alpha backgrounds as "verify manually" rather than reporting a false ratio; fall back to a `take_screenshot` and visual judgment (or composite against the actual backdrop) for those.

## 4. Global page checks

```js
() => ({
 lang: document.documentElement.lang || "MISSING",
 title: document.title || "MISSING",
 h1Count: document.querySelectorAll("h1").length, // expect exactly 1
 landmarks: {
  main: document.querySelectorAll("main, [role=main]").length, // expect 1
  nav: document.querySelectorAll("nav, [role=navigation]").length,
 },
 headingOutline: [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map(
  (h) => `${h.tagName}: ${h.textContent.trim().slice(0, 40)}`,
 ), // scan for skipped levels
 imagesMissingAlt: document.querySelectorAll("img:not([alt])").length,
 // a real skip link, not just any in-page anchor: among the first focusables AND resolving to the main landmark
 skipLink: [...document.querySelectorAll("a[href], button, [tabindex]:not([tabindex='-1'])")]
  .slice(0, 3)
  .some((el) => {
   const href = el.getAttribute("href");
   if (!href?.startsWith("#") || href === "#") return false;
   const t = document.getElementById(decodeURIComponent(href.slice(1)));
   return !!t && !!(t.matches("main, [role=main]") || t.querySelector("main, [role=main]") || t.closest("main, [role=main]"));
  }),
 zoomBlocked: /user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1\b/.test(
  document.querySelector("meta[name=viewport]")?.content || "",
 ), // true = a WCAG failure (blocks pinch-zoom)
})
```

## 5. Focus order trace (run, then Tab through the page)

```js
// Run once to start logging every focus change with its accessible name.
() => {
 window.__a11yTrace = [];
 document.addEventListener(
  "focusin",
  (e) => {
   const el = e.target;
   const name =
    el.getAttribute("aria-label") ||
    el.textContent?.trim().slice(0, 30) ||
    el.getAttribute("alt") ||
    el.name ||
    "(no name)";
   window.__a11yTrace.push(`${el.tagName.toLowerCase()} — ${name}`);
  },
  true,
 );
 return "Tracing focus. Tab through the page, then read window.__a11yTrace.";
}
```
