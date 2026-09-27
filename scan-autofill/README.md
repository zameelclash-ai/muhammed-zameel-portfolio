# ScanFill

Scan a business card, ID card, passport or form and autofill its details. Everything runs
in the browser: the photo is never uploaded anywhere.

## What it does

1. **Scan**: take a photo (phone camera or webcam), drop or paste an image, or choose a file.
   The image is upscaled, converted to greyscale and contrast-stretched, then read with
   [Tesseract.js](https://github.com/naptha/tesseract.js) OCR. Several languages are available.
2. **Extract**: `parser.js` turns the recognised text into structured fields:
   name, job title, company, phone, email, website, address, date of birth, gender,
   nationality, document number, issue and expiry dates.
   - Reads the **passport / ID machine-readable zone (MRZ)** (ICAO 9303 TD3 and TD1 formats)
     and verifies its check digits.
   - Understands labelled lines (`Name:`, `DOB`, `Sex`, `Passport No.`, `Expiry`, …),
     including values printed on the line below the label.
   - Recognises emails, phone numbers, websites and dates in most common formats.
   - Uses heuristics for unlabelled business cards (job-title and company keywords, addresses).
3. **Check and export**: every filled field is highlighted and tagged with where it came from
   (MRZ, Label, Pattern or Guess), so you know what to double-check. Edit anything, then
   copy as JSON or vCard, download a `.vcf` contact, or save to a list and export CSV.

If a photo is misread, fix the text in the "Recognised text" box and press
**Re-extract from text**. You can also paste plain text there from anywhere.

## Run it

```bash
cd scan-autofill
npm start          # serves on http://localhost:8080
npm test           # parser unit tests
```

The camera needs `https://` or `localhost`. Any static host works (GitHub Pages, Netlify, …).
The OCR engine and language data load from the jsDelivr CDN on first use and are cached by the browser.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page layout |
| `styles.css` | Styles (light and dark themes) |
| `app.js` | Camera, upload, OCR, form filling, exports, saved list |
| `parser.js` | Text-to-fields extraction, MRZ decoding, vCard/CSV export (works in Node too) |
| `test/parser.test.js` | Unit tests |
