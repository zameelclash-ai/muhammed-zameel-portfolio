(function () {
  'use strict';

  const P = window.ScanParser;
  const $ = (id) => document.getElementById(id);
  const form = $('form');
  const STORE_KEY = 'scanfill.saved.v1';

  const SAMPLE_TEXT = `ZAMEEL STUDIOS PVT LTD
Muhammed Zameel
Founder & Lead Developer
+91 98765 43210
zameel@zameelstudios.com
www.zameelstudios.com
2nd Floor, MG Road, Kochi, Kerala 682016`;

  // ---------------- UI helpers ----------------

  let toastTimer;
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 2200);
  }

  function setStatus(msg, isError) {
    const s = $('status');
    s.textContent = msg || '';
    s.classList.toggle('error', !!isError);
  }

  function setProgress(p, label) {
    const box = $('progress');
    if (p == null) { box.hidden = true; return; }
    box.hidden = false;
    $('progressFill').style.width = Math.round(p * 100) + '%';
    $('progressText').textContent = label;
  }

  function setBusy(busy) {
    ['sampleBtn', 'cameraBtn', 'reparseBtn', 'file', 'lang'].forEach((id) => { $(id).disabled = busy; });
    $('scanline').hidden = !busy;
  }

  async function copy(text, what) {
    try {
      await navigator.clipboard.writeText(text);
      toast(`${what} copied`);
    } catch (e) {
      // Fallback: put it in the text box and select it for manual copy.
      const ta = $('rawText');
      ta.value = text;
      ta.focus();
      ta.select();
      toast(`Couldn't reach the clipboard. ${what} is selected in the text box, press Ctrl/Cmd+C.`);
    }
  }

  function download(name, text, type) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ---------------- form ----------------

  function readForm() {
    const data = {};
    P.FIELDS.forEach((f) => { data[f] = (form.elements[f].value || '').trim(); });
    return data;
  }

  function fillForm(result, animate) {
    const { fields, source } = result;
    P.FIELDS.forEach((f) => {
      const el = form.elements[f];
      const wrap = el.closest('.field');
      const tag = wrap.querySelector('.src');
      el.value = fields[f] || '';
      tag.textContent = fields[f] ? (source[f] || '') : '';
      tag.dataset.src = source[f] || '';
      wrap.classList.toggle('filled', !!fields[f]);
      if (animate && fields[f]) {
        wrap.classList.remove('flash');
        void wrap.offsetWidth; // restart the animation
        wrap.classList.add('flash');
      }
    });
    $('docType').textContent = result.documentType;
    $('filledCount').textContent = `${result.filled} of ${P.FIELDS.length} fields filled`;
    renderMRZ(result.mrz);
  }

  function renderMRZ(mrz) {
    const box = $('mrzBox');
    if (!mrz) { box.hidden = true; return; }
    const mark = (ok) => `<span class="${ok ? 'ok' : 'bad'}">${ok ? '✓ valid' : '✗ check failed'}</span>`;
    box.innerHTML =
      `${mrz.format} · issued by ${mrz.issuingCountry || '?'}<br>` +
      `Document no. ${mark(mrz.checks.documentNumber)} · Birth date ${mark(mrz.checks.dateOfBirth)} · Expiry ${mark(mrz.checks.expiryDate)}`;
    box.hidden = false;
  }

  // Clear per-field "source" badges when the user edits a value by hand.
  form.addEventListener('input', (e) => {
    const wrap = e.target.closest('.field');
    if (!wrap) return;
    const tag = wrap.querySelector('.src');
    tag.textContent = e.target.value ? 'edited' : '';
    tag.dataset.src = 'label';
  });

  function extractFromText(animate) {
    const result = P.extract($('rawText').value);
    fillForm(result, animate);
    return result;
  }

  // ---------------- OCR ----------------

  // Upscale small photos, convert to greyscale and stretch contrast: OCR
  // accuracy on phone photos improves noticeably.
  function preprocess(img) {
    const maxW = 2200, minW = 1400;
    let w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    const scale = w < minW ? minW / w : w > maxW ? maxW / w : 1;
    w = Math.round(w * scale); h = Math.round(h * scale);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, w, h);
    const d = ctx.getImageData(0, 0, w, h);
    const px = d.data;
    let lo = 255, hi = 0;
    const g = new Uint8ClampedArray(w * h);
    for (let i = 0, j = 0; i < px.length; i += 4, j++) {
      const v = (px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114) | 0;
      g[j] = v;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    const range = Math.max(1, hi - lo);
    for (let i = 0, j = 0; i < px.length; i += 4, j++) {
      const v = ((g[j] - lo) * 255) / range;
      px[i] = px[i + 1] = px[i + 2] = v;
    }
    ctx.putImageData(d, 0, 0);
    return c;
  }

  let worker = null, workerLang = null;
  async function getWorker(lang) {
    if (worker && workerLang === lang) return worker;
    if (worker) await worker.terminate();
    worker = await Tesseract.createWorker(lang, 1, {
      logger: (m) => {
        const label = {
          'loading tesseract core': 'Loading OCR engine',
          'initializing tesseract': 'Starting OCR engine',
          'loading language traineddata': 'Loading language data',
          'initializing api': 'Preparing',
          'recognizing text': 'Reading text',
        }[m.status] || m.status;
        setProgress(m.progress || 0, `${label} ${Math.round((m.progress || 0) * 100)}%`);
      },
    });
    workerLang = lang;
    return worker;
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('That file could not be opened as an image.'));
      img.src = src;
    });
  }

  async function scan(src) {
    if (typeof Tesseract === 'undefined') {
      setStatus('The OCR engine could not load (check your internet connection). You can still paste text below and press "Re-extract from text".', true);
      return;
    }
    $('previewImg').src = src;
    $('preview').hidden = false;
    $('dropEmpty').hidden = true;
    setBusy(true);
    setStatus('');
    setProgress(0, 'Starting…');
    try {
      const img = await loadImage(src);
      const canvas = preprocess(img);
      const w = await getWorker($('lang').value);
      const { data } = await w.recognize(canvas);
      $('rawText').value = data.text.trim();
      const r = extractFromText(true);
      setStatus(r.filled
        ? `Found ${r.filled} detail${r.filled === 1 ? '' : 's'} (OCR confidence ${Math.round(data.confidence)}%). Check the highlighted fields.`
        : 'No details recognised. Try a sharper, well-lit photo taken straight on, or fix the text below.');
    } catch (err) {
      console.error(err);
      setStatus(`Scan failed: ${err.message || err}. Try another photo, or paste the text below.`, true);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  function scanFile(file) {
    if (!file || !/^image\//.test(file.type)) {
      setStatus('Choose an image file (JPG, PNG, HEIC or WebP). For PDFs, take a screenshot first.', true);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => scan(reader.result);
    reader.readAsDataURL(file);
  }

  // ---------------- inputs: file, drop, paste, camera, sample ----------------

  $('file').addEventListener('change', (e) => { scanFile(e.target.files[0]); e.target.value = ''; });

  const drop = $('drop');
  ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, () => drop.classList.remove('over')));
  drop.addEventListener('drop', (e) => { e.preventDefault(); scanFile(e.dataTransfer.files[0]); });

  document.addEventListener('paste', (e) => {
    const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith('image/'));
    if (item) { e.preventDefault(); scanFile(item.getAsFile()); }
  });

  let stream = null;
  function closeCamera() {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
    $('camera').hidden = true;
  }
  $('cameraBtn').addEventListener('click', async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1920 } } });
      const v = $('video');
      v.srcObject = stream;
      await v.play();
      $('camera').hidden = false;
    } catch (e) {
      setStatus('Camera is not available here. Tap the scan area to take or choose a photo instead.', true);
    }
  });
  $('closeCamBtn').addEventListener('click', closeCamera);
  $('snapBtn').addEventListener('click', () => {
    const v = $('video');
    const c = document.createElement('canvas');
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    closeCamera();
    scan(c.toDataURL('image/jpeg', 0.92));
  });

  // Renders a realistic business card so the full photo → OCR → form path can be tried without a file.
  function sampleCardImage() {
    const c = document.createElement('canvas');
    c.width = 1050; c.height = 600;
    const x = c.getContext('2d');
    x.fillStyle = '#fbfaf6'; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = '#0b6e5b'; x.fillRect(0, 0, 18, c.height);
    x.fillStyle = '#16201c';
    x.font = '600 30px Arial'; x.fillText('ZAMEEL STUDIOS PVT LTD', 70, 90);
    x.font = 'bold 54px Arial'; x.fillText('Muhammed Zameel', 70, 220);
    x.font = '32px Arial'; x.fillStyle = '#44504b'; x.fillText('Founder & Lead Developer', 70, 270);
    x.fillStyle = '#16201c'; x.font = '30px Arial';
    x.fillText('+91 98765 43210', 70, 380);
    x.fillText('zameel@zameelstudios.com', 70, 425);
    x.fillText('www.zameelstudios.com', 70, 470);
    x.fillText('2nd Floor, MG Road, Kochi, Kerala 682016', 70, 530);
    return c.toDataURL('image/png');
  }
  $('sampleBtn').addEventListener('click', () => scan(sampleCardImage()));

  $('reparseBtn').addEventListener('click', () => {
    const r = extractFromText(true);
    setStatus(`Re-extracted: ${r.filled} detail${r.filled === 1 ? '' : 's'} found.`);
  });

  // ---------------- exports ----------------

  const fileBase = () => (readForm().fullName || 'contact').replace(/[^\w\-]+/g, '_');
  $('copyJsonBtn').addEventListener('click', () => copy(JSON.stringify(readForm(), null, 2), 'JSON'));
  $('copyVcfBtn').addEventListener('click', () => copy(P.toVCard(readForm()), 'vCard'));
  $('dlVcfBtn').addEventListener('click', () => download(fileBase() + '.vcf', P.toVCard(readForm()), 'text/vcard'));

  form.addEventListener('reset', () => {
    setTimeout(() => fillForm({ fields: {}, source: {}, documentType: 'Document', filled: 0, mrz: null }), 0);
  });

  // ---------------- saved list ----------------

  function loadSaved() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch (e) { return []; }
  }
  function storeSaved(list) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch (e) { /* storage unavailable: keep in memory */ }
  }
  let saved = loadSaved();

  function renderSaved() {
    const body = $('savedBody');
    body.textContent = '';
    saved.forEach((r, i) => {
      const tr = document.createElement('tr');
      [r.fullName || '—', r.documentType || '', r.phone, r.email, r.company || r.documentNumber].forEach((v) => {
        const td = document.createElement('td');
        td.textContent = v || '';
        tr.appendChild(td);
      });
      const td = document.createElement('td');
      const load = document.createElement('button');
      load.className = 'link'; load.type = 'button'; load.textContent = 'Load';
      load.onclick = () => fillForm({ fields: r, source: {}, documentType: r.documentType || 'Document', filled: P.FIELDS.filter((f) => r[f]).length, mrz: null });
      const del = document.createElement('button');
      del.className = 'link'; del.type = 'button'; del.textContent = 'Delete';
      del.onclick = () => { saved.splice(i, 1); storeSaved(saved); renderSaved(); toast('Deleted'); };
      td.append(load, del);
      tr.appendChild(td);
      body.appendChild(tr);
    });
    $('savedEmpty').hidden = saved.length > 0;
    $('copyCsvBtn').disabled = $('dlCsvBtn').disabled = saved.length === 0;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = readForm();
    if (!P.FIELDS.some((f) => data[f])) { toast('Nothing to save yet'); return; }
    data.documentType = $('docType').textContent;
    data.savedAt = new Date().toISOString();
    saved.unshift(data);
    storeSaved(saved);
    renderSaved();
    toast('Saved');
  });
  $('copyCsvBtn').addEventListener('click', () => copy(P.toCSV(saved), 'CSV'));
  $('dlCsvBtn').addEventListener('click', () => download('scans.csv', P.toCSV(saved), 'text/csv'));

  // ---------------- start in a working state ----------------

  $('rawText').value = SAMPLE_TEXT;
  extractFromText(false);
  setStatus('Showing an example card. Scan your own photo to replace it.');
  renderSaved();
})();
