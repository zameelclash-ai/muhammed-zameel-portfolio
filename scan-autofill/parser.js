/*
 * ScanParser — turns raw OCR text into structured details.
 * Works in the browser (window.ScanParser) and in Node (require).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ScanParser = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const FIELDS = [
    'fullName', 'jobTitle', 'company', 'email', 'phone', 'website',
    'address', 'dateOfBirth', 'gender', 'nationality',
    'documentNumber', 'issueDate', 'expiryDate',
  ];

  const MONTHS = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
  };

  // Labels commonly printed on ID cards, forms and cards.
  const LABELS = [
    { field: 'fullName', re: /^(?:full\s*name|name|holder'?s?\s*name|given\s*names?\s*(?:and|&)\s*surname)\b/i },
    { field: 'surname', re: /^(?:surname|last\s*name|family\s*name)\b/i },
    { field: 'givenNames', re: /^(?:given\s*names?|first\s*name|forenames?)\b/i },
    { field: 'dateOfBirth', re: /^(?:d\.?\s*o\.?\s*b\.?|date\s*of\s*birth|birth\s*date|born)\b/i },
    { field: 'gender', re: /^(?:sex|gender)\b/i },
    { field: 'nationality', re: /^(?:nationality|citizenship)\b/i },
    { field: 'documentNumber', re: /^(?:passport\s*(?:no|number)|document\s*(?:no|number)|id\s*(?:no|number)|card\s*(?:no|number)|licen[cs]e\s*(?:no|number)|no\.)\b/i },
    { field: 'issueDate', re: /^(?:date\s*of\s*issue|issue\s*date|issued(?:\s*on)?)\b/i },
    { field: 'expiryDate', re: /^(?:date\s*of\s*expiry|expiry(?:\s*date)?|expires|exp\.?|valid\s*(?:until|thru|through|till))\b/i },
    { field: 'address', re: /^(?:address|addr\.?|residence|home\s*address)\b/i },
    { field: 'email', re: /^(?:e-?mail)\b/i },
    { field: 'phone', re: /^(?:phone|tel\.?|telephone|mobile|mob\.?|cell|ph\.?|m\.?)\s*(?=[:.\s])/i },
    { field: 'website', re: /^(?:web(?:site)?|url|www)\b(?!\.)/i },
    { field: 'company', re: /^(?:company|organi[sz]ation|employer)\b/i },
    { field: 'jobTitle', re: /^(?:title|designation|position|role|occupation)\b/i },
  ];

  const JOB_WORDS = /\b(manager|director|engineer|developer|designer|founder|co-?founder|ceo|cto|cfo|coo|president|officer|consultant|analyst|architect|specialist|executive|lead|head|owner|partner|associate|intern|sales|marketing|accountant|doctor|dr\.|lawyer|advocate|teacher|professor|student|technician|coordinator|administrator|supervisor|agent|representative|photographer|artist|writer|editor)\b/i;
  const COMPANY_WORDS = /\b(inc|llc|ltd|limited|pvt|private|corp|corporation|company|co\.|gmbh|plc|llp|group|solutions|technologies|technology|tech|studio|studios|labs|systems|services|industries|enterprises|agency|consulting|bank|university|college|school|hospital)\b\.?/i;
  const ADDRESS_WORDS = /\b(street|st\.|road|rd\.?|avenue|ave\.?|lane|ln\.?|drive|dr\b|blvd|boulevard|floor|flr|suite|ste\.?|building|bldg|block|sector|nagar|colony|p\.?o\.?\s*box|po box|near|opp\.?|district|dist\.?|city|state|pin|zip|india|usa|uae|dubai|kerala|london|house|apartment|apt\.?|flat)\b/i;
  const DOC_HEADER = /\b(republic|government|passport|identity|identification|driving|licen[cs]e|card|ministry|department|kingdom|state of|union|permanent account|election|aadhaar|resident)\b/i;

  // ---------- small helpers ----------

  const clean = (s) => (s || '').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
  const pad = (n) => String(n).padStart(2, '0');

  function titleCase(s) {
    return s.toLowerCase().replace(/(^|[\s\-'])([a-z])/g, (m, p, c) => p + c.toUpperCase());
  }

  function isoDate(y, m, d) {
    y = +y; m = +m; d = +d;
    if (!(m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= 2100)) return '';
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCMonth() !== m - 1) return '';
    return `${y}-${pad(m)}-${pad(d)}`;
  }

  // Parse one date written in any common format; returns ISO yyyy-mm-dd or ''.
  function parseDate(s) {
    if (!s) return '';
    s = s.trim();
    let m;
    // 2001-04-23 / 2001/04/23
    if ((m = s.match(/\b(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})\b/))) return isoDate(m[1], m[2], m[3]);
    // 23/04/2001, 23-04-2001, 23.04.2001 (day first, unless the first part can't be a day)
    if ((m = s.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4}|\d{2})\b/))) {
      let [a, b, y] = [+m[1], +m[2], m[3]];
      if (y.length === 2) y = +y > 40 ? '19' + y : '20' + y;
      if (b > 12 && a <= 12) [a, b] = [b, a];
      return isoDate(y, b, a);
    }
    // 23 Apr 2001 / 23 APR/APR 2001 / 23-April-2001
    if ((m = s.match(/\b(\d{1,2})[\s\-\/.]*([A-Za-z]{3,9})[A-Za-z\/ ]*?[\s\-\/.,]*(\d{4})\b/))) {
      const mon = MONTHS[m[2].slice(0, 4).toLowerCase()] || MONTHS[m[2].slice(0, 3).toLowerCase()];
      if (mon) return isoDate(m[3], mon, m[1]);
    }
    // April 23, 2001
    if ((m = s.match(/\b([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})\b/))) {
      const mon = MONTHS[m[1].slice(0, 4).toLowerCase()] || MONTHS[m[1].slice(0, 3).toLowerCase()];
      if (mon) return isoDate(m[3], mon, m[2]);
    }
    return '';
  }

  function findDates(text) {
    const re = /\b(\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2}|\d{1,2}[\/\-.]\d{1,2}[\/\-.](?:\d{4}|\d{2})|\d{1,2}[\s\-]*[A-Za-z]{3,9}(?:\/[A-Za-z]{3,9})?[\s\-,]*\d{4}|[A-Za-z]{3,9}\.?\s+\d{1,2},?\s+\d{4})\b/g;
    const out = [];
    let m;
    while ((m = re.exec(text))) {
      const iso = parseDate(m[1]);
      if (iso) out.push({ raw: m[1], iso, index: m.index });
    }
    return out;
  }

  function normalizePhone(s) {
    const plus = s.trim().startsWith('+') ? '+' : '';
    const digits = s.replace(/[^\d]/g, '');
    if (digits.length < 7 || digits.length > 15) return '';
    return plus + digits;
  }

  function formatPhone(n) {
    // Keep it readable: +91 98765 43210 style grouping for long numbers.
    if (!n) return '';
    const plus = n.startsWith('+');
    const d = n.replace('+', '');
    if (plus && d.length > 10) {
      const cc = d.slice(0, d.length - 10);
      const rest = d.slice(-10);
      return `+${cc} ${rest.slice(0, 5)} ${rest.slice(5)}`;
    }
    if (d.length === 10) return `${d.slice(0, 5)} ${d.slice(5)}`;
    return n;
  }

  // ---------- MRZ (passport / ID machine-readable zone) ----------

  function mrzCharValue(c) {
    if (c >= '0' && c <= '9') return +c;
    if (c >= 'A' && c <= 'Z') return c.charCodeAt(0) - 55;
    return 0; // '<'
  }

  function mrzCheck(str) {
    const w = [7, 3, 1];
    let sum = 0;
    for (let i = 0; i < str.length; i++) sum += mrzCharValue(str[i]) * w[i % 3];
    return String(sum % 10);
  }

  function mrzDate(yymmdd, future) {
    if (!/^\d{6}$/.test(yymmdd)) return '';
    const yy = +yymmdd.slice(0, 2);
    const nowYY = new Date().getUTCFullYear() % 100;
    let century;
    if (future) century = 20;
    else century = yy > nowYY ? 19 : 20;
    return isoDate(century * 100 + yy, yymmdd.slice(2, 4), yymmdd.slice(4, 6));
  }

  function mrzName(s) {
    const [sur, given = ''] = s.split('<<');
    const fix = (x) => titleCase(x.replace(/<+/g, ' ').trim());
    return { surname: fix(sur), givenNames: fix(given) };
  }

  // Fix common OCR confusions inside MRZ lines.
  function mrzLine(l) {
    return l.toUpperCase().replace(/\s+/g, '').replace(/[«‹]/g, '<').replace(/[^A-Z0-9<]/g, '<');
  }

  function parseMRZ(text) {
    const lines = text.split(/\n/).map(mrzLine).filter((l) => l.length >= 28 && (l.match(/</g) || []).length >= 2);
    // TD3 (passport): 2 lines x 44
    for (let i = 0; i < lines.length - 1; i++) {
      const a = lines[i], b = lines[i + 1];
      if (/^P[A-Z<]/.test(a) && a.length >= 40 && b.length >= 40) {
        const l1 = a.padEnd(44, '<').slice(0, 44), l2 = b.padEnd(44, '<').slice(0, 44);
        const name = mrzName(l1.slice(5));
        const docNo = l2.slice(0, 9).replace(/<+$/, '');
        const dob = l2.slice(13, 19), exp = l2.slice(21, 27);
        const checks = {
          documentNumber: mrzCheck(l2.slice(0, 9)) === l2[9],
          dateOfBirth: mrzCheck(dob) === l2[19],
          expiryDate: mrzCheck(exp) === l2[27],
        };
        return {
          format: 'TD3 passport',
          documentType: 'Passport',
          issuingCountry: l1.slice(2, 5).replace(/</g, ''),
          surname: name.surname,
          givenNames: name.givenNames,
          documentNumber: docNo,
          nationality: l2.slice(10, 13).replace(/</g, ''),
          dateOfBirth: mrzDate(dob, false),
          gender: { M: 'Male', F: 'Female' }[l2[20]] || '',
          expiryDate: mrzDate(exp, true),
          checks,
        };
      }
    }
    // TD1 (ID card): 3 lines x 30
    for (let i = 0; i < lines.length - 2; i++) {
      const [a, b, c] = [lines[i], lines[i + 1], lines[i + 2]];
      if (/^[ACI][A-Z<]/.test(a) && a.length >= 28 && b.length >= 28 && c.length >= 28) {
        const l1 = a.padEnd(30, '<').slice(0, 30), l2 = b.padEnd(30, '<').slice(0, 30), l3 = c.padEnd(30, '<').slice(0, 30);
        const name = mrzName(l3);
        const dob = l2.slice(0, 6), exp = l2.slice(8, 14);
        return {
          format: 'TD1 ID card',
          documentType: 'ID card',
          issuingCountry: l1.slice(2, 5).replace(/</g, ''),
          surname: name.surname,
          givenNames: name.givenNames,
          documentNumber: l1.slice(5, 14).replace(/<+$/, ''),
          nationality: l2.slice(15, 18).replace(/</g, ''),
          dateOfBirth: mrzDate(dob, false),
          gender: { M: 'Male', F: 'Female' }[l2[7]] || '',
          expiryDate: mrzDate(exp, true),
          checks: {
            documentNumber: mrzCheck(l1.slice(5, 14)) === l1[14],
            dateOfBirth: mrzCheck(dob) === l2[6],
            expiryDate: mrzCheck(exp) === l2[14],
          },
        };
      }
    }
    return null;
  }

  // ---------- main extraction ----------

  function detectType(text, mrz) {
    if (mrz) return mrz.documentType;
    const t = text.toLowerCase();
    if (/passport/.test(t)) return 'Passport';
    if (/driving|driver'?s?\s*licen[cs]e/.test(t)) return 'Driving licence';
    if (/invoice|bill to|tax invoice/.test(t)) return 'Invoice';
    if (/(identity|identification|national id|aadhaar|resident|id card|voter|election)/.test(t)) return 'ID card';
    if (/@|www\.|https?:\/\//.test(t)) return 'Business card';
    return 'Document';
  }

  function extract(rawText) {
    const text = (rawText || '').replace(/\r/g, '');
    const lines = text.split('\n').map(clean).filter(Boolean);
    const result = {};
    const source = {}; // field -> 'label' | 'pattern' | 'mrz' | 'guess'
    const used = new Set(); // indexes of lines consumed by a field
    const set = (field, value, how, lineIdx) => {
      if (!value || result[field]) return;
      result[field] = value;
      source[field] = how;
      if (lineIdx != null) used.add(lineIdx);
    };

    // 1. MRZ is the most reliable source when present.
    const mrz = parseMRZ(text);
    if (mrz) {
      const name = [mrz.givenNames, mrz.surname].filter(Boolean).join(' ');
      set('fullName', name, 'mrz');
      ['documentNumber', 'nationality', 'dateOfBirth', 'gender', 'expiryDate'].forEach((f) => set(f, mrz[f], 'mrz'));
      lines.forEach((l, i) => { if (mrzLine(l).length >= 28 && (l.match(/</g) || []).length >= 2) used.add(i); });
    }

    // 2. Labelled lines ("Name: ...", "DOB 12/03/1990", or label on one line, value on the next).
    let surname = '', given = '';
    lines.forEach((line, i) => {
      for (const { field, re } of LABELS) {
        const m = line.match(re);
        if (!m) continue;
        let value = line.slice(m[0].length).replace(/^[\s:;.\-–—|/]+/, '').trim();
        // Strip a trailing translation/second label like "Name / Nom".
        if (!value && lines[i + 1] && !LABELS.some((L) => L.re.test(lines[i + 1]))) {
          value = lines[i + 1];
          used.add(i + 1);
        }
        if (!value) break;
        used.add(i);
        if (field === 'surname') { surname = surname || value; break; }
        if (field === 'givenNames') { given = given || value; break; }
        if (['dateOfBirth', 'issueDate', 'expiryDate'].includes(field)) value = parseDate(value) || '';
        if (field === 'gender') value = /^f/i.test(value) ? 'Female' : /^m/i.test(value) ? 'Male' : value;
        if (field === 'phone') value = formatPhone(normalizePhone(value));
        if (field === 'email') value = (value.match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/) || [''])[0].toLowerCase();
        if (field === 'fullName') value = /[a-z]/.test(value) ? value : titleCase(value);
        if (field === 'address') {
          // Addresses often wrap onto the following lines.
          const parts = [value];
          for (let j = i + 1; j < lines.length && parts.length < 4; j++) {
            if (LABELS.some((L) => L.re.test(lines[j])) || used.has(j)) break;
            if (!ADDRESS_WORDS.test(lines[j]) && !/\d{5,6}/.test(lines[j]) && !/,/.test(lines[j])) break;
            parts.push(lines[j]);
            used.add(j);
          }
          value = parts.join(', ').replace(/,\s*,/g, ',');
        }
        set(field, value, 'label', i);
        break;
      }
    });
    if (!result.fullName && (surname || given)) {
      const n = [given, surname].filter(Boolean).join(' ');
      set('fullName', /[a-z]/.test(n) ? n : titleCase(n), 'label');
    }

    // 3. Pattern matches anywhere in the text.
    const email = text.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/);
    if (email) set('email', email[0].toLowerCase(), 'pattern', lines.findIndex((l) => l.includes(email[0])));

    const web = text.match(/\b(?:https?:\/\/)?(?:www\.)[\w-]+(?:\.[\w-]+)+(?:\/[\w\-./]*)?/i) ||
      text.match(/\bhttps?:\/\/[\w-]+(?:\.[\w-]+)+(?:\/[\w\-./]*)?/i);
    if (web) set('website', web[0].replace(/^https?:\/\//i, '').toLowerCase(), 'pattern', lines.findIndex((l) => l.includes(web[0])));

    if (!result.phone) {
      lines.forEach((l, i) => {
        if (result.phone) return;
        // Skip lines that are clearly dates, IDs or postcodes only.
        const m = l.match(/(\+?\d[\d\s().\-]{6,}\d)/);
        if (!m) return;
        if (findDates(m[1]).length) return;
        const n = normalizePhone(m[1]);
        if (n && n.replace('+', '').length >= 8) set('phone', formatPhone(n), 'pattern', i);
      });
    }

    // Dates without labels: oldest reasonable one is probably the date of birth.
    if (!result.dateOfBirth && /\b(birth|dob|born)\b/i.test(text) === false) {
      const dates = findDates(text).map((d) => d.iso).sort();
      const thisYear = new Date().getUTCFullYear();
      const dob = dates.find((d) => +d.slice(0, 4) < thisYear - 10);
      const future = dates.filter((d) => +d.slice(0, 4) >= thisYear);
      if (dob && detectType(text, mrz) !== 'Business card' && detectType(text, mrz) !== 'Invoice') set('dateOfBirth', dob, 'guess');
      if (future.length && !result.expiryDate) set('expiryDate', future[future.length - 1], 'guess');
    }

    // 4. Heuristics for unlabelled lines (business cards).
    const free = lines.map((l, i) => ({ l, i })).filter(({ l, i }) => !used.has(i) &&
      !/@|www\.|https?:/i.test(l) && !DOC_HEADER.test(l) && !/^[\d\s+().\-]+$/.test(l));

    if (!result.jobTitle) {
      const t = free.find(({ l }) => JOB_WORDS.test(l) && l.split(' ').length <= 6 && !COMPANY_WORDS.test(l));
      if (t) set('jobTitle', t.l, 'guess', t.i);
    }
    if (!result.company) {
      const c = free.find(({ l, i }) => !used.has(i) && COMPANY_WORDS.test(l) && !ADDRESS_WORDS.test(l) && l.split(' ').length <= 6);
      if (c) set('company', c.l, 'guess', c.i);
      else if (result.email && !/gmail|yahoo|outlook|hotmail|icloud|proton/i.test(result.email)) {
        const dom = result.email.split('@')[1].split('.')[0];
        set('company', titleCase(dom.replace(/[-_]/g, ' ')), 'guess');
      }
    }
    if (!result.fullName) {
      const n = free.find(({ l, i }) => !used.has(i) &&
        /^[A-Za-z][A-Za-z.'\-]*(?:\s+[A-Za-z][A-Za-z.'\-]*){1,3}$/.test(l) &&
        !JOB_WORDS.test(l) && !COMPANY_WORDS.test(l) && !ADDRESS_WORDS.test(l));
      if (n) set('fullName', /[a-z]/.test(n.l) ? n.l : titleCase(n.l), 'guess', n.i);
    }
    if (!result.address) {
      const parts = [];
      free.forEach(({ l, i }) => {
        if (used.has(i)) return;
        if (ADDRESS_WORDS.test(l) || /\b\d{5,6}\b/.test(l) || (/,/.test(l) && /\d/.test(l))) { parts.push(l); used.add(i); }
      });
      if (parts.length) set('address', parts.join(', '), 'guess');
    }

    // Gender without a label ("M" / "F" alone is too risky; look for words).
    if (!result.gender) {
      const g = text.match(/\b(male|female)\b/i);
      if (g) set('gender', titleCase(g[1]), 'pattern');
    }

    const out = {};
    FIELDS.forEach((f) => { out[f] = result[f] || ''; });
    return {
      documentType: detectType(text, mrz),
      fields: out,
      source,
      mrz,
      filled: FIELDS.filter((f) => out[f]).length,
    };
  }

  // ---------- exporters ----------

  function toVCard(f) {
    const esc = (s) => String(s || '').replace(/([,;\\])/g, '\\$1');
    const parts = (f.fullName || '').split(' ');
    const last = parts.length > 1 ? parts.pop() : '';
    const lines = [
      'BEGIN:VCARD', 'VERSION:3.0',
      `N:${esc(last)};${esc(parts.join(' '))};;;`,
      `FN:${esc(f.fullName)}`,
    ];
    if (f.company) lines.push(`ORG:${esc(f.company)}`);
    if (f.jobTitle) lines.push(`TITLE:${esc(f.jobTitle)}`);
    if (f.phone) lines.push(`TEL;TYPE=CELL:${f.phone.replace(/\s/g, '')}`);
    if (f.email) lines.push(`EMAIL;TYPE=INTERNET:${f.email}`);
    if (f.website) lines.push(`URL:${/^https?:/.test(f.website) ? f.website : 'https://' + f.website}`);
    if (f.address) lines.push(`ADR;TYPE=WORK:;;${esc(f.address)};;;;`);
    if (f.dateOfBirth) lines.push(`BDAY:${f.dateOfBirth}`);
    lines.push('END:VCARD');
    return lines.join('\r\n');
  }

  function toCSV(records) {
    const q = (v) => `"${String(v || '').replace(/"/g, '""')}"`;
    return [FIELDS.join(','), ...records.map((r) => FIELDS.map((f) => q(r[f])).join(','))].join('\n');
  }

  return { FIELDS, extract, parseDate, parseMRZ, mrzCheck, toVCard, toCSV };
});
