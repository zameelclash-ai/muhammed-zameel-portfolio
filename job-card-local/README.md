# Optimex Job Cards (shop computer version)

Job card entry for Optimex Opticals that runs on the shop computer. Any phone on the shop Wi-Fi
can photograph a handwritten job card. The computer reads the handwriting and fills in the job card
entry form by itself. **Phones need no app and no account.** They just open a web page.

## What you need

- The shop computer (Windows or Mac), connected to the shop Wi-Fi and the internet.
- **Node.js**, free from <https://nodejs.org> (install the LTS version).
- An **Anthropic API key** for reading handwriting. Create one at
  <https://console.anthropic.com/settings/keys> and add some credit. Each scan costs a few rupees.
  Without a key, everything else still works: phone photos still arrive on the computer and staff
  type the details beside the photo.

## Start it

1. Unzip this folder somewhere permanent, for example `Documents\Optimex Job Cards`.
2. **Windows:** double-click `start.bat`. **Mac:** double-click `start.command`.
   The first start takes a minute. The job card screen then opens in the browser at http://localhost:3000.
3. If Windows asks whether to allow Node.js on the network, choose **Allow** for private networks.
   Phones can't connect otherwise.
4. Press **Settings** and paste the API key.

Keep the black start window open while the shop is using the program. Closing it stops the program.

## Connect a phone (once per phone)

1. Connect the phone to the **same Wi-Fi** as the computer.
2. On the computer, press **Connect a phone**. A QR code appears.
3. Point the phone camera at the QR code and open the link.
4. On the phone, choose **Add to Home Screen** (iPhone: Share button; Android: ⋮ menu) so it opens like an app.

## Daily use

1. On the phone, tap **Take photo of job card** (or **Choose from gallery**).
2. The card opens on the computer and fills in within about 15 to 40 seconds.
   Fields the reader wasn't sure about have an orange outline and a **check** tag.
3. Compare those with the photo (click the photo to enlarge it), fix anything, and press **Save job card**.
4. Move cards through **Pending → Ready → Delivered**. Pending cards past their due date show as **Overdue**.
   The **To check** filter lists scanned cards nobody has saved yet.

## Where the data is

Everything stays on the shop computer in the `data` folder:

- `data/jobcards.json`: all job cards
- `data/photos/`: the card photos
- `data/backups/`: one copy of the job cards per day, keeping the last 30 days

Copy the `data` folder to a pen drive or cloud drive now and then as an extra backup.

## Privacy

Phones need the private key inside the QR code link, so other people on the Wi-Fi can't see the cards.
Only share that link with staff. Settings, including the API key, can only be changed on the shop
computer itself. Card photos are sent to Anthropic's API to be read. Nothing else leaves the computer.

## If something goes wrong

- **Phone says "Can't reach the shop computer":** check the phone is on the shop Wi-Fi (not mobile data)
  and the start window is open on the computer. If the computer's Wi-Fi address changed, press
  **Connect a phone** again and rescan the QR code.
- **"Port 3000 is already in use":** the program is already running. Open http://localhost:3000.
- **A card says "Not read":** the message explains why (no internet, API key, credit). Fix it and press **Read**.

## For developers

`server.js` is a dependency-light Node.js server (HTTP API, live updates over Server-Sent Events, JSON file
storage). `reader.js` sends the photo to Claude (`claude-opus-5`) with a JSON-schema structured output
and server-side refusal fallback. `public/desk.html` is the computer screen, and `public/phone.html` is the phone page.
`npm test` runs the reader against a local stand-in for the API. Environment variables: `PORT` (default 3000),
`DATA_DIR`, `ANTHROPIC_API_KEY` (overrides the saved key), `OPEN_BROWSER=0` to not open a browser.
