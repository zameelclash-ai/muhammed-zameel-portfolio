# Optimex Job Cards (shop computer version)

Job card entry for Optimex Opticals that runs on the shop computer. Any phone on the shop Wi-Fi can
photograph a handwritten job card, and the computer reads the handwriting and fills in the job card
screen, which looks like the paper card itself.

- **No Claude, no AI company, no account and no API key.** The handwriting is read on the shop
  computer itself, with free, open-source text recognition (PaddleOCR).
- **No internet needed** once installed. Card photos never leave the shop.
- **Phones need no app.** They open a web page from a QR code on the computer.

## What you need

- The shop computer (Windows or Mac) on the shop Wi-Fi.
- **Node.js**, free from <https://nodejs.org> (install the LTS version, 20 or newer).

## Start it

1. Unzip this folder somewhere permanent, for example `Documents\Optimex Job Cards`.
2. **Windows:** double-click `start.bat`. **Mac:** double-click `start.command`
   (the first start on a Mac needs internet once to finish installing).
   The job card screen opens in the browser at http://localhost:3000.
3. If Windows asks whether to allow Node.js on the network, choose **Allow** for private networks.
   Phones can't connect otherwise.

Keep the black start window open while the shop is using the program. Closing it stops the program.
When it says **Reader ready**, scanning is ready.

## Connect a phone (once per phone)

1. Connect the phone to the **same Wi-Fi** as the computer.
2. On the computer, press **Connect a phone**. A QR code appears.
3. Point the phone camera at the QR code and open the link.
4. On the phone, choose **Add to Home Screen** (iPhone: Share button; Android: ⋮ menu) so it opens like an app.

## Daily use

1. On the phone, tap **Take photo of job card** (or **Choose from gallery**).
2. In about 5 to 15 seconds the card opens on the computer, filled in.
   Readings that don't check out have an orange background and a **check** tag.
3. Compare those with the photo (click the photo to enlarge it), fix anything, and press **Save job card**.
4. Move cards through **Pending → Ready → Delivered**. Pending cards past their due date show as **Overdue**.
   The **To check** filter lists scanned cards nobody has saved yet.

Details printed on both parts of the card (Date, Due Date, Name, Address, Order No, Total, Advance,
Balance) stay in step: type in either copy and the other updates.

### Tips for good readings

- Lay the card flat, in good light, with no shadow across it.
- Get the **whole card** in the photo. The reader finds the card by its printed borders.
- Neat writing reads best. Numbers and capital letters written clearly are the most reliable.

### How the reading works, and its limits

The reader finds the card's printed boxes in the photo, straightens the card, cuts out each box
(Name, Tel, each Rx cell, and so on) and reads it. It then checks the results against each other:

- the customer slip and the shop copy repeat the same details,
- Total − Advance must equal Balance (this also catches a ₹ sign read as a 7),
- Tel should have 10 digits,
- Sph and Cyl come in 0.25 steps, and Axis is 0 to 180,
- Cyl and Axis are written together.

Anything that fails a check is marked **check**. The reader is free and offline, so it is not as good
as a person: messy handwriting will need more corrections. Always compare the marked fields with the photo.

## Where the data is

Everything stays on the shop computer in the `data` folder:

- `data/jobcards.json`: all job cards
- `data/photos/`: the card photos
- `data/backups/`: one copy of the job cards per day, keeping the last 30 days

Copy the `data` folder to a pen drive now and then as an extra backup.

## Privacy

Phones need the private key inside the QR code link, so other people on the Wi-Fi can't see the
cards. Only share that link with staff. Nothing is sent to the internet.

## If something goes wrong

- **Phone says "Can't reach the shop computer":** check the phone is on the shop Wi-Fi (not mobile data)
  and the start window is open on the computer. If the computer's Wi-Fi address changed, press
  **Connect a phone** again and rescan the QR code.
- **"Couldn't find the job card in the photo":** take the photo again with the whole card in the picture.
- **"Port 3000 is already in use":** the program is already running. Open http://localhost:3000.

## For developers

- `server.js`: HTTP API, live updates over Server-Sent Events, JSON file storage with daily backups.
- `ocr/reader.js`: finds and straightens the card (OpenCV.js), cuts out each field using `ocr/layout.json`,
  reads it, and cross-checks the results.
- `ocr/engine.js`: PaddleOCR PP-OCRv4 text-line detection and recognition, run with onnxruntime-web
  (WebAssembly). The models come in the `@gutenye/ocr-models` npm package, so nothing downloads at run time.
- `public/desk.html`: the computer screen, laid out like the paper card (fonts bundled via `@fontsource`).
- `public/phone.html`: the phone page.
- `npm test` reads photos of a filled test card (straight, tilted, upside down, blurry) and checks every field.

Environment variables: `PORT` (default 3000), `DATA_DIR`, `OPEN_BROWSER=0` to not open a browser.
