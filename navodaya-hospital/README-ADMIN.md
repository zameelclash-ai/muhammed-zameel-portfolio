# Navodaya Hospital website: staff editor

## Logging in
Scroll to the bottom of the site and tap **Staff login**.
User name: `navodaya`  Password: `1234` (change this, see "Password" below).
After login an **Edit site** button appears. Open it to edit details, updates (the news bar), departments,
services, team, FAQ, reviews, gallery, booking times and colours, and to upload photos.

## Making changes live
* **Simple hosting (Netlify Drop, any static host):** edits are saved as a draft in your browser only.
  Open the editor, go to **Publish**, tap **Download content.json**, put that file next to `index.html`
  (replace the old one) and upload the site again.
* **Netlify with the included backend (recommended):** the **Publish** button updates the live site for
  everyone at once, and the AI helpers work.

## Netlify backend setup (one time)
1. Put the `navodaya-hospital` folder in a GitHub repository and connect it to Netlify
   (Add new site > Import from Git). Base directory: `navodaya-hospital` (if it is inside a bigger repo).
2. In Netlify: Site settings > Environment variables, add
   * `ADMIN_USER` = `navodaya`
   * `ADMIN_PASSWORD` = a strong password (this is checked on the server)
   * `ANTHROPIC_API_KEY` = your Claude API key (needed only for the AI features)
   * `AI_MODEL` = optional, to choose a different Claude model
3. Deploy. Login now checks the server, Publish works, and AI buttons work.

## Password
Without the backend, the login only hides the editor from visitors. It is not real security, and anyone
with technical knowledge can get around it, so do not rely on `1234` for protection. With the Netlify
backend, the password is checked on the server, so use a strong one in `ADMIN_PASSWORD`.

## Files
* `data.js` the starting content. `content.json` the published edits (overrides `data.js`).
* `site.js`, `booking.js`, `admin.js`: the code. `netlify/functions`: the optional backend.
