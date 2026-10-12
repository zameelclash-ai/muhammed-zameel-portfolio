# Graph Report - muhammed-zameel-portfolio  (2026-10-11)

## Corpus Check
- 28 files · ~98,293 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: .css 2, (none) 1, .bat 1)

## Summary
- 247 nodes · 398 edges · 16 communities (11 shown, 5 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 39 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Job Card Web App
- Image Engine (Offline OCR)
- Local Server
- Offline Text Reader
- Scan-Autofill App
- Text Parser
- Font Dependencies
- Job Card Test Photos
- Reader Tests
- Scan-Autofill Package
- Navodaya Hospital Page
- Hospital Page Scripts
- Packaging Script
- Hospital Building Photo

## God Nodes (most connected - your core abstractions)
1. `readJobCardOffline()` - 27 edges
2. `handle()` - 13 edges
3. `extract()` - 10 edges
4. `scan()` - 9 edges
5. `Optimex Job Cards (shop computer version) README` - 9 edges
6. `Optimex job card 1042 (clean scan)` - 9 edges
7. `readOne()` - 8 edges
8. `recognize()` - 7 edges
9. `ImageRaw` - 7 edges
10. `readLines()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `claude.ai sample capability (handwriting via Claude)` --semantically_similar_to--> `PaddleOCR offline handwriting reader`  [INFERRED] [semantically similar]
  job-card/README.md → job-card-local/README.md
- `Tesseract.js in-browser OCR` --semantically_similar_to--> `PaddleOCR offline handwriting reader`  [INFERRED] [semantically similar]
  scan-autofill/README.md → job-card-local/README.md
- `Field source tagging (MRZ, Label, Pattern, Guess)` --semantically_similar_to--> `OCR cross-check validation rules`  [INFERRED] [semantically similar]
  scan-autofill/README.md → job-card-local/README.md
- `job-card index.html (artifact job card app)` --semantically_similar_to--> `desk.html (computer job card screen)`  [INFERRED] [semantically similar]
  job-card/index.html → job-card-local/public/desk.html
- `fillForm / readForm (data-key form binding)` --semantically_similar_to--> `fillForm / readForm (data-key form binding)`  [INFERRED] [semantically similar]
  job-card/index.html → job-card-local/public/desk.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Job card form implementations sharing the paper card layout** — job_card_index_html, job_card_local_public_desk_html, job_card_local_public_phone_html [INFERRED 0.85]
- **Photo to autofilled form OCR pipelines** — job_card_local_readme_paddleocr_offline_reader, job_card_readme_claude_sample_capability, scan_autofill_readme_tesseract_ocr [INFERRED 0.75]
- **Phone scan to desk review flow** — job_card_local_public_phone_html_send, job_card_local_readme_server_js, job_card_local_readme_ocr_reader_js, job_card_local_public_desk_html_connect [INFERRED 0.85]
- **Card 1042 OCR fixture variants of one job card** — job_card_local_test_fixtures_card_1042, job_card_local_test_fixtures_card_1042_blurry, job_card_local_test_fixtures_card_1042_tilted, job_card_local_test_fixtures_card_1042_upside_down [INFERRED 0.95]
- **Extractable job card data fields** — job_card_local_test_fixtures_card_1042_customer_rahul_krishna, job_card_local_test_fixtures_card_1042_prescription_table, job_card_local_test_fixtures_card_1042_lens_and_frame, job_card_local_test_fixtures_card_1042_payment_summary [INFERRED 0.85]

## Communities (16 total, 5 thin omitted)

### Community 0 - "Job Card Web App"
Cohesion: 0.08
Nodes (41): job-card index.html (artifact job card app), autoBalance / updateBalanceNote, fillForm / readForm (data-key form binding), Paper job card layout (customer slip + shop copy), PROMPT (Claude handwriting extraction prompt), readCard (scan with Claude sample.json), renderList (status filter and overdue), saveJob / deleteJob (db or localStorage) (+33 more)

### Community 1 - "Image Engine (Offline OCR)"
Cohesion: 0.06
Nodes (27): FileUtils, ImageRaw, load(), loadDetection(), toRaw(), description, engines, node (+19 more)

### Community 2 - "Local Server"
Cohesion: 0.10
Nodes (30): applyFields(), authorized(), BACKUPS, broadcast(), config, CONFIG_FILE, EDITABLE, emptyGc() (+22 more)

### Community 3 - "Offline Text Reader"
Cohesion: 0.14
Nodes (30): readLines(), recognize(), aspectOf(), clean(), crop(), DIGITISH, dist(), editDistance() (+22 more)

### Community 4 - "Scan-Autofill App"
Cohesion: 0.17
Nodes (15): copy(), extractFromText(), fillForm(), getWorker(), loadImage(), preprocess(), renderMRZ(), renderSaved() (+7 more)

### Community 5 - "Text Parser"
Cohesion: 0.24
Nodes (14): detectType(), extract(), findDates(), formatPhone(), isoDate(), mrzCharValue(), mrzCheck(), mrzDate() (+6 more)

### Community 6 - "Font Dependencies"
Cohesion: 0.15
Nodes (13): dependencies, @fontsource/archivo-narrow, @fontsource/arimo, @fontsource/kalam, @fontsource/michroma, @fontsource/questrial, @fontsource/tinos, @gutenye/ocr-common (+5 more)

### Community 7 - "Job Card Test Photos"
Cohesion: 0.29
Nodes (10): Optimex job card 1042 (clean scan), Job card 1042 blurry/tilted photo fixture, Customer Rahul Krishna (order 1042), Lens (Anti-Glare Blue Cut Crizal Progressive) and frame (Matte Black Rectangular), Optimex Opticals (Alathur eye clinic and optical shop), Payment summary (Total 3500, Advance 1000, Balance 2500 INR), Prescription table (DV/NV, Re/Le Sph Cyl Axi), Job card 1042 tilted photo fixture (+2 more)

### Community 8 - "Reader Tests"
Cohesion: 0.20
Nodes (5): expected, flat(), assert, P, test

### Community 9 - "Scan-Autofill Package"
Cohesion: 0.22
Nodes (8): description, license, name, private, scripts, start, test, version

### Community 10 - "Navodaya Hospital Page"
Cohesion: 0.43
Nodes (7): Navodaya Hospital appointment page, Booking form (WhatsApp appointment request), data.js (hospital content data), Departments and doctors sections, icons.js (inline icon set), script.js (page rendering and booking logic), style.css (page styles)

## Knowledge Gaps
- **17 isolated node(s):** `@fontsource/archivo-narrow`, `@fontsource/arimo`, `@fontsource/kalam`, `@fontsource/michroma`, `@fontsource/questrial` (+12 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 86 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `clean()` connect `Offline Text Reader` to `Text Parser`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `extract()` (e.g. with `parser.js` and `clean()`) actually correct?**
  _`extract()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@fontsource/archivo-narrow`, `@fontsource/arimo`, `@fontsource/kalam` to the rest of the system?**
  _17 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Job Card Web App` be split into smaller, more focused modules?**
  _Cohesion score 0.07682926829268293 - nodes in this community are weakly interconnected._
- **Why does `extract()` connect `Text Parser` to `Offline Text Reader`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Should `Image Engine (Offline OCR)` be split into smaller, more focused modules?**
  _Cohesion score 0.059743954480796585 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `Font Dependencies` to `Image Engine (Offline OCR)`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._