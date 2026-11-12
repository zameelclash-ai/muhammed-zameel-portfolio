/* Tap anything, get its details: a small sheet with the full text and the useful next step. */
(function () {
  "use strict";
  var S = window.Site, $ = S.$, esc = S.esc;
  var dlg = $("#info"), kick = $("#in-kicker"), title = $("#in-title"), body = $("#in-body"), foot = $("#in-foot");
  var handlers = {};
  var C = function () { return S.content; };
  var p = function (t) { return t ? "<p>" + esc(t) + "</p>" : ""; };

  function button(a, i) {
    var cls = "btn " + (a.cls || "");
    var inner = (a.icon ? icon(a.icon) : "") + " " + esc(a.label);
    if (a.href) return '<a class="' + cls + '" href="' + esc(a.href) + '"' + (a.ext ? ' target="_blank" rel="noopener"' : "") + ' data-close="1">' + inner + "</a>";
    handlers["a" + i] = a.run;
    return '<button type="button" class="' + cls + '" data-act="a' + i + '">' + inner + "</button>";
  }
  function show(o) {
    handlers = {};
    kick.textContent = o.kicker || "";
    title.textContent = o.title || "";
    body.innerHTML = (o.image ? '<img class="in-img" src="' + esc(o.image) + '" alt="' + esc(o.alt || o.title || "") + '">' : "") +
      (o.icon ? '<div class="in-ic">' + icon(o.icon) + "</div>" : "") + (o.html || "");
    foot.innerHTML = (o.actions || []).map(button).join("");
    if (!dlg.open) S.showDialog(dlg);
    body.scrollTop = 0; title.focus({ preventScroll: true });
  }
  function close() { S.hideDialog(dlg); }
  $("#in-close").addEventListener("click", close);
  dlg.addEventListener("click", function (e) { if (e.target === dlg) close(); });
  foot.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]");
    if (b && handlers[b.dataset.act]) { var run = handlers[b.dataset.act]; close(); run(); return; }
    if (e.target.closest("[data-close]")) setTimeout(close, 200);
  });

  var call = function (label) { return { label: label || "Call", icon: "phone", cls: "btn-ghost", href: S.telOf(C().phone) }; };
  var book = function (id) { return { label: "Book appointment", icon: "calendar", run: function () { window.Booking.open(id); } }; };
  var go = function (hash) { return function () { var el = document.querySelector(hash); if (el) el.scrollIntoView({ behavior: S.motion ? "smooth" : "auto" }); }; };

  var B = {
    dept: function (id) {
      var d = C().departments.filter(function (x) { return x.id === id; })[0]; if (!d) return;
      if (d.call) return show({ kicker: "Emergency & critical care", icon: d.icon, title: d.name,
        html: p(d.text || "For emergencies and critical care, call us straight away or come to casualty. Emergency services and ambulance are available 24x7."),
        actions: [{ label: "Call now", icon: "phone", href: S.telOf(C().phone) }, { label: "Directions", icon: "pin", cls: "btn-ghost", href: C().directions, ext: true }] });
      show({ kicker: "Department", icon: d.icon, title: d.name,
        html: p(d.text || "Book a visit to our " + d.name + " department. Pick a date and time, and our reception team confirms your slot on WhatsApp.") +
          '<ul class="in-list"><li>' + icon("check") + "No sign-up or payment needed</li><li>" + icon("check") + "Confirmation on WhatsApp</li></ul>",
        actions: [book(id), call("Ask a question")] });
    },
    svc: function (i) {
      var s = C().services[+i]; if (!s) return;
      show({ kicker: "Service", icon: s.icon, title: s.name, html: p(s.text) + p("For more details, call the NHRC Information Desk."),
        actions: [call("Call to ask"), book()] });
    },
    why: function (i) {
      var w = C().why[+i]; if (!w) return;
      show({ kicker: "Why NHRC", icon: w.icon || "check", title: w.title, html: p(w.text), actions: [book()] });
    },
    person: function (i) {
      var m = C().people[+i]; if (!m) return;
      show({ kicker: "Leadership", image: m.photo, alt: m.name, title: m.name, html: '<p class="in-role">' + esc(m.role) + "</p>" + p(C().company),
        actions: [{ label: "Contact the hospital", icon: "phone", cls: "btn-ghost", run: go("#contact") }] });
    },
    news: function (i) {
      var n = (S.news || [])[+i]; if (!n) return;
      var acts = []; if (n.link) acts.push({ label: "Read more", icon: "globe", href: n.link, ext: true });
      acts.push(book());
      show({ kicker: n.date ? S.fmtDate(n.date, true) : "Update", title: n.title || "Update", html: p(n.text), actions: acts });
    },
    event: function (i) {
      var e = (S.events || [])[+i]; if (!e) return;
      show({ kicker: "Event", image: e.image, alt: e.title || "Event photo", title: e.title || C().shortName, html: p(e.text), actions: [] });
    },
    gal: function (i) {
      var g = (S.gal || [])[+i]; if (!g) return;
      show({ kicker: "Gallery", image: g.image, alt: g.caption || "Hospital photo", title: g.caption || C().shortName, actions: [] });
    },
    strip: function (k) {
      var c = C();
      if (k === "dept") return show({ kicker: "Departments", title: c.departments.length + " departments", html: p("Tap a department to see details and book.") +
        '<div class="in-chips">' + c.departments.map(function (d) { return '<button type="button" class="in-chip" data-info="dept:' + esc(d.id) + '">' + icon(d.icon) + esc(d.name) + "</button>"; }).join("") + "</div>",
        actions: [book()] });
      if (k === "emerg") return show({ kicker: "Emergency", icon: "ambulance", title: "24x7 emergency & ambulance",
        html: p("Emergency services, ambulance and pathology are available round the clock. In an emergency, call us or come straight to casualty."),
        actions: [{ label: "Call now", icon: "phone", href: S.telOf(c.phone) }, { label: "Directions", icon: "pin", cls: "btn-ghost", href: c.directions, ext: true }] });
      if (k === "pharm") return show({ kicker: "Pharmacy", icon: "pill", title: "Pharmacy open 24x7", html: p("Our pharmacy is open round the clock for patients and visitors."), actions: [call("Call the hospital")] });
      if (k === "park") return show({ kicker: "Getting here", icon: "car", title: "Ample parking",
        html: p("Central Pazhayannur location with ample parking, wide stairs and patient-transport size elevators.") + p(c.address),
        actions: [{ label: "Directions", icon: "pin", href: c.directions, ext: true }, call()] });
    }
  };

  function openFrom(el) {
    var v = el.getAttribute("data-info").split(":"), fn = B[v[0]];
    if (fn) fn(v.slice(1).join(":"));
  }
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-info]"); if (!el) return;
    e.preventDefault(); openFrom(el);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var el = e.target.closest && e.target.closest("[data-info]");
    if (!el || el.tagName === "BUTTON") return;
    e.preventDefault(); openFrom(el);
  });
  S.info = function (kind, arg) { if (B[kind]) B[kind](arg); };
})();
