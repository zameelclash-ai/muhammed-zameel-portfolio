# Navodaya Hospital website: hosting and the staff editor

## How it works
* The website files (index.html, style.css, photos...) are the shop window. They never change when staff edit.
* Staff edits are saved in **Vercel Blob** (online storage in your Vercel account) by the small backend in `api/`.
* Every visitor's page reads the latest saved content from `/api/content`, so a Publish shows up for everyone
  within about 15 seconds. No re-upload and no redeploy is needed.
* Each Publish keeps a backup: the newest 10 versions stay in Vercel Blob (folder `site/`).
* Photos uploaded in the editor are stored in Vercel Blob too (folder `site/photos/`).

## One-time setup on Vercel
1. Vercel > Add New > Project > import this GitHub repository.
   Set **Root Directory** to `navodaya-hospital`. Framework preset: **Other**. Deploy.
2. Project > **Storage** > Create > **Blob**. Choose **public** access. Connect it to this project
   (this adds `BLOB_READ_WRITE_TOKEN` automatically).
3. Project > **Settings > Environment Variables**, add:
   * `ADMIN_USER` = `navodaya`
   * `ADMIN_PASSWORD` = a strong password (staff log in with this; it is checked on the server)
   * `ANTHROPIC_API_KEY` = only if you want the AI buttons (from console.anthropic.com)
   * `AI_MODEL` = optional, to use a different Claude model (default `claude-opus-5-5`)
4. Deployments > the latest one > **Redeploy**, so the new settings are used.
5. Open the site, scroll to the bottom, tap **Staff login**, log in, change something, tap **Publish**.
   Open the site in another phone: the change is there.

Never put the password or API key in the code or on GitHub. Type them only in Vercel settings.

## Without a backend (any simple static host)
Edits stay in the staff member's own browser. To make them live: editor > Publish > **Download content.json**,
put the file next to `index.html`, and upload the site again. The login is then only a screen, not real security.

## Netlify instead of Vercel
`netlify/functions` and `netlify.toml` do the same job on Netlify (Netlify Blobs). Set the same variables there.

## Files
* `data.js` the starting content. `content.json` published edits for hosts without a backend.
* `api/` Vercel backend: `content.js` (save/read), `upload.js` (photos), `ai.js` (AI help).
* `site.js`, `booking.js`, `details.js`, `motion.js`, `plus3d.js`, `admin.js`: the page code.
* `vendor/` Three.js (MIT) for the 3D plus. `icons.js` uses Lucide icons (ISC).
