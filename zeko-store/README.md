# ZEKO Tools — demo storefront

A static demo e-commerce storefront for **ZEKO**, a professional paint-tools brand
(drop sheets, polythene rolls, rollers, trays, tapes, and a bundled tool kit).
Built to showcase the product line — there's no backend, no payment
processing, and no real orders.

## What it does

- Product grid for all 9 SKUs, with category filters (Surface Protection,
  Rollers & Tools, Tapes & Accessories, Kits).
- Add-to-cart with a slide-in cart drawer, quantity steppers, and a running
  subtotal — cart state is saved to `localStorage` so it survives a refresh.
- A "Checkout" button opens a demo modal explaining that no real transaction
  happens, instead of pretending to charge a card.

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
| `index.html` | Page structure: header, hero, product grid, cart drawer, checkout modal |
| `styles.css` | ZEKO's purple brand styling, responsive layout |
| `app.js` | Product data, cart state (`localStorage`), rendering, filters, toasts |
| `images/` | Product photography, cropped from the brand's packaging renders |
