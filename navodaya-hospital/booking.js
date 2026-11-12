/* Appointment booking: a short step-by-step sheet that ends in a ready-to-send WhatsApp message. */
(function () {
  "use strict";
  var S = window.Site, $ = S.$, esc = S.esc;
  var dlg = $("#sheet"), body = $("#wz-body"), foot = $("#wz-foot"), stepEl = $("#wz-step"), bar = $("#wz-bar"), title = $("#wz-title");
  var KEY = "nhrc_patient_v1";
  var B;

  function fresh() {
    var saved = {}; try { saved = JSON.parse(S.store.get(KEY) || "{}"); } catch (e) {}
    B = { step: 1, dept: "", date: "", time: "", name: saved.name || "", phone: saved.phone || "", type: "New patient", notes: "", err: {} };
  }
  fresh();

  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  var iso = function (d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
  function mins(t) {
    var m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(t.trim()); if (!m) return 0;
    var h = +m[1] % 12; if (/pm/i.test(m[3])) h += 12; return h * 60 + +m[2];
  }
  function slotsFor(dateIso) {
    var all = S.content.timeSlots, now = new Date();
    if (dateIso !== iso(now)) return all.map(function (t) { return { t: t, ok: true }; });
    var cur = now.getHours() * 60 + now.getMinutes() + 30;       // need 30 minutes notice
    return all.map(function (t) { return { t: t, ok: mins(t) >= cur }; });
  }
  function days() {
    var out = [], n = Math.max(1, +S.content.daysAhead || 14), closed = S.content.closedWeekdays || [];
    for (var i = 0; i < n; i++) {
      var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i);
      var key = iso(d), off = closed.indexOf(d.getDay()) > -1;
      if (i === 0 && !slotsFor(key).some(function (s) { return s.ok; })) off = true;
      out.push({
        key: key, off: off,
        top: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-IN", { weekday: "short" }),
        sub: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
      });
    }
    return out;
  }
  var cleanPhone = function (p) { return String(p).replace(/[\s\-()]/g, "").replace(/^\+?91/, "").replace(/^0/, ""); };
  var phoneOk = function (p) { return /^[6-9]\d{9}$/.test(cleanPhone(p)); };
  var phoneFmt = function (p) { var c = cleanPhone(p); return "+91 " + c.slice(0, 5) + " " + c.slice(5); };

  function message() {
    var C = S.content;
    return ["*Appointment request – " + C.shortName + "*",
      "Name: " + B.name.trim(),
      "Mobile: " + phoneFmt(B.phone),
      "Department: " + S.deptName(B.dept),
      "Date: " + S.fmtDate(B.date, true),
      "Time: " + B.time,
      "Visit type: " + B.type,
      B.notes.trim() ? "Reason: " + B.notes.trim() : ""].filter(Boolean).join("\n");
  }

  /* ---------- steps ---------- */
  function stepDept() {
    body.innerHTML = '<label class="srch">' + icon("search") + '<input id="wz-q" type="search" placeholder="Search department" aria-label="Search department" autocomplete="off" enterkeyhint="search"></label>' +
      '<div class="wz-list" id="wz-list" role="list"></div>';
    var list = $("#wz-list", body);
    var draw = function (q) {
      q = (q || "").toLowerCase();
      var items = S.content.departments.filter(function (d) { return !q || d.name.toLowerCase().indexOf(q) > -1; });
      list.innerHTML = items.map(function (d) {
        return d.call
          ? '<a class="wz-item call" href="' + S.telOf(S.content.phone) + '" role="listitem"><span class="ic">' + icon(d.icon) + '</span><span class="dn">' + esc(d.name) + '</span><span class="tag">Call us</span></a>'
          : '<button type="button" class="wz-item' + (B.dept === d.id ? " on" : "") + '" data-id="' + esc(d.id) + '" role="listitem"><span class="ic">' + icon(d.icon) + '</span><span class="dn">' + esc(d.name) + '</span></button>';
      }).join("") || '<p class="empty">No department found.</p>';
    };
    draw("");
    $("#wz-q", body).addEventListener("input", function (e) { draw(e.target.value); });
    list.addEventListener("click", function (e) {
      var b = e.target.closest("[data-id]"); if (!b) return;
      B.dept = b.dataset.id; go(2);
    });
    foot.innerHTML = "";
  }

  function stepWhen() {
    var ds = days();
    var firstOk = ds.filter(function (d) { return !d.off; })[0];
    if (B.date && ds.every(function (d) { return d.key !== B.date || d.off; })) { B.date = ""; B.time = ""; }
    body.innerHTML = '<p class="lbl">Dept: <b>' + esc(S.deptName(B.dept)) + '</b></p>' +
      '<h3 class="grp">Pick a date</h3><div class="dates" id="wz-dates" role="radiogroup" aria-label="Date"></div>' +
      '<h3 class="grp">Pick a time</h3><div id="wz-times"></div>';
    var drawDates = function () {
      $("#wz-dates", body).innerHTML = ds.map(function (d) {
        return '<button type="button" class="date' + (B.date === d.key ? " on" : "") + '" role="radio" aria-checked="' + (B.date === d.key) + '" data-d="' + d.key + '"' + (d.off ? " disabled" : "") + '><span>' + d.top + '</span><b>' + d.sub + '</b></button>';
      }).join("");
    };
    var drawTimes = function () {
      var box = $("#wz-times", body);
      if (!B.date) { box.innerHTML = '<p class="hint">Choose a date first.</p>'; return; }
      var sl = slotsFor(B.date);
      var groups = [["Morning", 0, 12 * 60], ["Afternoon", 12 * 60, 16 * 60], ["Evening", 16 * 60, 24 * 60]];
      box.innerHTML = groups.map(function (g) {
        var items = sl.filter(function (s) { var m = mins(s.t); return m >= g[1] && m < g[2]; });
        if (!items.length) return "";
        return '<div class="tg"><span>' + g[0] + '</span><div class="chips">' + items.map(function (s) {
          return '<button type="button" class="chip' + (B.time === s.t ? " on" : "") + '" role="radio" aria-checked="' + (B.time === s.t) + '" data-t="' + esc(s.t) + '"' + (s.ok ? "" : " disabled") + '>' + esc(s.t) + '</button>';
        }).join("") + '</div></div>';
      }).join("");
    };
    drawDates(); drawTimes();
    $("#wz-dates", body).addEventListener("click", function (e) {
      var b = e.target.closest("[data-d]"); if (!b) return;
      B.date = b.dataset.d;
      if (B.time && !slotsFor(B.date).some(function (s) { return s.t === B.time && s.ok; })) B.time = "";
      drawDates(); drawTimes(); nav();
    });
    $("#wz-times", body).addEventListener("click", function (e) {
      var b = e.target.closest("[data-t]"); if (!b) return;
      B.time = b.dataset.t; drawTimes(); nav();
    });
    var nav = function () {
      foot.innerHTML = '<button type="button" class="btn btn-ghost" id="wz-back">Back</button>' +
        '<button type="button" class="btn" id="wz-next"' + (B.date && B.time ? "" : " disabled") + '>Next</button>';
      $("#wz-back", foot).onclick = function () { go(1); };
      $("#wz-next", foot).onclick = function () { if (B.date && B.time) go(3); };
    };
    nav();
    if (!B.date && !firstOk) body.insertAdjacentHTML("beforeend", '<p class="error">No dates are open right now. Please call us.</p>');
  }

  function stepYou() {
    var t = ["New patient", "Follow-up", "Health check-up"];
    body.innerHTML =
      '<p class="lbl">' + esc(S.deptName(B.dept)) + ' · ' + esc(S.fmtDate(B.date)) + ' · ' + esc(B.time) + '</p>' +
      '<div class="f"><label for="wz-name">Patient name</label><input id="wz-name" type="text" autocomplete="name" value="' + esc(B.name) + '" placeholder="Full name"><p class="fe" id="e-name"></p></div>' +
      '<div class="f"><label for="wz-phone">Mobile number</label><div class="ph"><span>+91</span><input id="wz-phone" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="14" value="' + esc(B.phone ? cleanPhone(B.phone) : "") + '" placeholder="10-digit number"></div><p class="fe" id="e-phone"></p></div>' +
      '<div class="f"><span class="lab">Visit type</span><div class="seg" id="wz-type" role="radiogroup" aria-label="Visit type">' + t.map(function (x) {
        return '<button type="button" class="chip' + (B.type === x ? " on" : "") + '" role="radio" aria-checked="' + (B.type === x) + '" data-v="' + x + '">' + x + '</button>';
      }).join("") + '</div></div>' +
      '<div class="f"><label for="wz-notes">Reason or symptoms <small>(optional)</small></label><textarea id="wz-notes" rows="2" placeholder="Briefly tell us the problem">' + esc(B.notes) + '</textarea></div>';
    foot.innerHTML = '<button type="button" class="btn btn-ghost" id="wz-back">Back</button><button type="button" class="btn" id="wz-next">Review</button>';
    $("#wz-back", foot).onclick = function () { go(2); };
    $("#wz-type", body).addEventListener("click", function (e) {
      var b = e.target.closest("[data-v]"); if (!b) return; B.type = b.dataset.v;
      $("#wz-type", body).querySelectorAll(".chip").forEach(function (c) { var on = c === b; c.classList.toggle("on", on); c.setAttribute("aria-checked", on); });
    });
    $("#wz-phone", body).addEventListener("input", function (e) { e.target.value = e.target.value.replace(/[^\d+\s]/g, ""); });
    $("#wz-next", foot).onclick = function () {
      B.name = $("#wz-name", body).value; B.phone = $("#wz-phone", body).value; B.notes = $("#wz-notes", body).value;
      var bad = false;
      $("#e-name", body).textContent = ""; $("#e-phone", body).textContent = "";
      if (B.name.trim().length < 2) { $("#e-name", body).textContent = "Please enter the patient's name."; $("#wz-name", body).focus(); bad = true; }
      if (!phoneOk(B.phone)) { $("#e-phone", body).textContent = "Enter a valid 10-digit mobile number."; if (!bad) $("#wz-phone", body).focus(); bad = true; }
      if (!bad) go(4);
    };
  }

  function stepReview() {
    var rows = [["Patient", B.name.trim(), 3], ["Mobile", phoneFmt(B.phone), 3], ["Department", S.deptName(B.dept), 1],
      ["Date", S.fmtDate(B.date, true), 2], ["Time", B.time, 2], ["Visit", B.type, 3]];
    if (B.notes.trim()) rows.push(["Reason", B.notes.trim(), 3]);
    body.innerHTML = '<dl class="rv">' + rows.map(function (r) {
      return '<div><dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd><button type="button" class="chg" data-s="' + r[2] + '">Change</button></div>';
    }).join("") + '</dl>' +
      (S.waLive()
        ? '<p class="hint">Tap the button. WhatsApp opens with this message ready. Press send there, and our team will confirm your slot.</p>'
        : '<p class="error">Online booking is not switched on yet. Please call ' + esc(S.content.phone) + '.</p>');
    body.onclick = function (e) { var b = e.target.closest("[data-s]"); if (b) go(+b.dataset.s); };
    foot.innerHTML = '<button type="button" class="btn btn-ghost" id="wz-back">Back</button>' +
      (S.waLive() ? '<a class="btn btn-wa" id="wz-send" target="_blank" rel="noopener" href="' + esc(S.waLink(message())) + '">' + icon("chat") + ' Send on WhatsApp</a>'
        : '<a class="btn" href="' + S.telOf(S.content.phone) + '">' + icon("phone") + ' Call us</a>');
    $("#wz-back", foot).onclick = function () { go(3); };
    var send = $("#wz-send", foot);
    if (send) send.addEventListener("click", function () {
      S.store.set(KEY, JSON.stringify({ name: B.name.trim(), phone: cleanPhone(B.phone) }));
      setTimeout(function () { go(5); }, 600);
    });
  }

  function stepDone() {
    body.innerHTML = '<div class="done"><span class="tick">' + icon("check") + '</span><h3>Almost done</h3>' +
      '<p>If WhatsApp opened, press <b>send</b> to place your request. Our reception team will reply to confirm the time.</p>' +
      '<p class="hint">WhatsApp did not open?</p><div class="btn-row center"><a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="' + esc(S.waLink(message())) + '">Open WhatsApp</a>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="wz-copy">Copy message</button></div></div>';
    foot.innerHTML = '<button type="button" class="btn btn-ghost" id="wz-again">Book another</button><button type="button" class="btn" id="wz-done">Close</button>';
    $("#wz-again", foot).onclick = function () { var d = { name: B.name, phone: B.phone }; fresh(); B.name = d.name; B.phone = d.phone; go(1); };
    $("#wz-done", foot).onclick = close;
    $("#wz-copy", body).onclick = function () {
      var t = message();
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { S.toast("Message copied."); }, function () { S.toast("Could not copy. Please use Open WhatsApp."); });
    };
  }

  var STEPS = { 1: stepDept, 2: stepWhen, 3: stepYou, 4: stepReview, 5: stepDone };
  var NAMES = { 1: "Choose department", 2: "Date and time", 3: "Your details", 4: "Review and send", 5: "Request ready" };
  function go(n) {
    B.step = n; STEPS[n]();
    stepEl.textContent = n < 5 ? "Step " + n + " of 4 · " + NAMES[n] : NAMES[n];
    bar.style.width = Math.min(100, n * 25) + "%";
    body.scrollTop = 0; title.focus({ preventScroll: true });
  }

  function open(deptId) {
    fresh();
    if (deptId) B.dept = deptId;
    S.showDialog(dlg); go(deptId ? 2 : 1);
  }
  function close() { S.hideDialog(dlg); }
  $("#wz-close").addEventListener("click", close);
  dlg.addEventListener("click", function (e) { if (e.target === dlg) close(); });
  window.Booking = { open: open, close: close };
})();
