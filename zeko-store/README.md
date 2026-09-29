# ZEKO — brand site

An editorial, Apple-style brand site for **ZEKO**, a professional paint-tools
brand (drop sheets, polythene rolls, rollers, trays, tapes, and a bundled
tool kit). No prices, no cart, no checkout — this is a product showcase, not
a store: a hero, alternating image/copy feature sections, a filterable
product range, a craft/story section, testimonials, and a dark brand
interlude.

## What it does

- Long-scroll marketing page: hero → stat strip → four alternating feature
  sections → full product range (filterable by category, no prices) → a
  "craft" section on build quality → testimonials → dark "About" interlude →
  final CTA → footer.
- Scroll-triggered reveal animations (`IntersectionObserver`, respects
  `prefers-reduced-motion`), a mobile hamburger menu, and light/dark theming
  driven by `prefers-color-scheme`.
- Every image is real photography cropped from the brand's product and
  lifestyle renders — no stock placeholders.

Everything is vanilla HTML/CSS/JS, no build step or dependencies.

## Run it

Open `index.html` directly in a browser, or serve the folder:

```bash
cd zeko-store
npx serve .        # or: python3 -m http.server 8080
```

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure: nav, hero, feature sections, range, story, testimonials, footer |
| `styles.css` | Design tokens (Fraunces/Inter/JetBrains Mono type system, purple palette), light/dark theme, responsive layout |
| `app.js` | Product data, category filters, mobile nav toggle, scroll-reveal |
| `images/` | Product and lifestyle photography, cropped from the brand's renders |
