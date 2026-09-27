const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../parser.js');

test('business card', () => {
  const r = P.extract(`ZAMEEL STUDIOS PVT LTD
Muhammed Zameel
Founder & Lead Developer
+91 98765 43210
zameel@zameelstudios.com
www.zameelstudios.com
2nd Floor, MG Road, Kochi, Kerala 682016`);
  assert.equal(r.documentType, 'Business card');
  assert.equal(r.fields.fullName, 'Muhammed Zameel');
  assert.equal(r.fields.jobTitle, 'Founder & Lead Developer');
  assert.equal(r.fields.company, 'ZAMEEL STUDIOS PVT LTD');
  assert.equal(r.fields.phone, '+91 98765 43210');
  assert.equal(r.fields.email, 'zameel@zameelstudios.com');
  assert.equal(r.fields.website, 'www.zameelstudios.com');
  assert.match(r.fields.address, /MG Road, Kochi, Kerala 682016/);
  assert.equal(r.fields.dateOfBirth, '');
});

test('labelled ID card', () => {
  const r = P.extract(`GOVERNMENT OF EXAMPLE
IDENTITY CARD
Name: AISHA RAHMAN
Date of Birth: 14/08/1996
Sex: F
ID No: X1234567
Address: 12 Palm Street,
Dubai Marina, Dubai
Expiry: 30 JUN 2031`);
  assert.equal(r.documentType, 'ID card');
  assert.equal(r.fields.fullName, 'Aisha Rahman');
  assert.equal(r.fields.dateOfBirth, '1996-08-14');
  assert.equal(r.fields.gender, 'Female');
  assert.equal(r.fields.documentNumber, 'X1234567');
  assert.equal(r.fields.expiryDate, '2031-06-30');
  assert.equal(r.fields.address, '12 Palm Street, Dubai Marina, Dubai');
});

test('passport MRZ (ICAO 9303 specimen) with check digits', () => {
  const r = P.extract(`PASSPORT
P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<
L898902C36UTO7408122F1204159ZE184226B<<<<<10`);
  assert.equal(r.documentType, 'Passport');
  assert.equal(r.fields.fullName, 'Anna Maria Eriksson');
  assert.equal(r.fields.documentNumber, 'L898902C3');
  assert.equal(r.fields.nationality, 'UTO');
  assert.equal(r.fields.dateOfBirth, '1974-08-12');
  assert.equal(r.fields.gender, 'Female');
  assert.equal(r.fields.expiryDate, '2012-04-15');
  assert.deepEqual(r.mrz.checks, { documentNumber: true, dateOfBirth: true, expiryDate: true });
});

test('date formats', () => {
  assert.equal(P.parseDate('23/04/2001'), '2001-04-23');
  assert.equal(P.parseDate('2001-04-23'), '2001-04-23');
  assert.equal(P.parseDate('April 23, 2001'), '2001-04-23');
  assert.equal(P.parseDate('23 APR/AVR 2001'), '2001-04-23');
  assert.equal(P.parseDate('31/02/2001'), '');
});

test('exporters', () => {
  const f = { fullName: 'Anna Eriksson', email: 'a@b.co', phone: '+46 70 123', company: 'A, B' };
  const v = P.toVCard(f);
  assert.match(v, /FN:Anna Eriksson/);
  assert.match(v, /N:Eriksson;Anna;;;/);
  assert.match(v, /ORG:A\\, B/);
  const csv = P.toCSV([f]);
  assert.equal(csv.split('\n').length, 2);
  assert.match(csv, /"Anna Eriksson"/);
});
