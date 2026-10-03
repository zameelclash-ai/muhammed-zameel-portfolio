# Fly Guide Travel & Tours website

Static site (HTML/CSS/JS, no build step). Open `index.html`, or run `python3 -m http.server` in this folder.

- `index.html` page content · `styles.css` light theme (colours at the top)
- `globe.js` 3D globe in the header (uses the bundled `three.min.js`)
- `script.js` photo lists, reviews, WhatsApp links
- `photos/` store and customer images; add new ones and list them in `CUSTOMERS` / `STORE` in `script.js`

Before launch: the six holiday packages are demo itineraries (no prices), and the three reviews in `REVIEWS` are samples. Replace them with real ones and set `SAMPLE=false` in `script.js` to hide the sample notice.
