/* Navodaya Hospital site: loads content, renders the page, handles staff login. */
(function () {
  "use strict";
  var DEF = window.HOSPITAL;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  var isObj = function (o) { return o && typeof o === "object" && !Array.isArray(o); };
  function merge(base, over) {
    if (!isObj(base) || !isObj(over)) return over === undefined ? base : over;
    var out = {}; Object.keys(base).forEach(function (k) { out[k] = base[k]; });
    Object.keys(over).forEach(function (k) { out[k] = isObj(base[k]) && isObj(over[k]) ? merge(base[k], over[k]) : over[k]; });
    return out;
  }
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    del: function (k) { try { window.localStorage.removeItem(k); } catch (e) {} },
    sget: function (k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } },
    sset: function (k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) {} },
    sdel: function (k) { try { window.sessionStorage.removeItem(k); } catch (e) {} }
  };

  var S = window.Site = {
    defaults: DEF, published: null, content: null,
    api: { content: "/api/content", ai: "/api/ai", alive: false },
    admin: false, esc: esc, $: $, $$: $$, clone: clone, merge: merge, store: store
  };
  var motion = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: no-preference)").matches);
  S.motion = motion;

  /* ---------- toast ---------- */
  var toastEl = $("#toast"), tt;
  S.toast = function (msg) {
    toastEl.textContent = msg; toastEl.classList.add("show");
    clearTimeout(tt); tt = setTimeout(function () { toastEl.classList.remove("show"); }, 3200);
  };

  /* ---------- helpers used by the page ---------- */
  var C = function () { return S.content; };
  var telOf = function (p) { return "tel:" + String(p).replace(/[^\d+]/g, ""); };
  S.telOf = telOf;
  S.waDigits = function () { return String(C().whatsapp || "").replace(/\D/g, ""); };
  S.waLive = function () { var d = S.waDigits(); return d.length >= 10 && !/^(910+|0+)$/.test(d); };
  S.waLink = function (text) { return "https://wa.me/" + S.waDigits() + (text ? "?text=" + encodeURIComponent(text) : ""); };
  S.bookable = function () { return C().departments.filter(function (d) { return !d.call; }); };
  S.deptName = function (id) { var d = C().departments.filter(function (x) { return x.id === id; })[0]; return d ? d.name : id; };
  S.fmtDate = function (iso, long) {
    var d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-IN", long ? { weekday: "short", day: "numeric", month: "short", year: "numeric" } : { day: "numeric", month: "short", year: "numeric" }).replace(/, (\d{4})$/, " $1");
  };

  /* ---------- theme ---------- */
  function shade(hex, f) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex || ""); if (!m) return hex;
    var n = parseInt(m[1], 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    var c = function (v) { return Math.max(0, Math.min(255, Math.round(v * (1 - f)))); };
    return "#" + ((1 << 24) + (c(r) << 16) + (c(g) << 8) + c(b)).toString(16).slice(1);
  }
  function applyTheme() {
    var t = C().theme || {}, r = document.documentElement.style;
    if (t.primary) { r.setProperty("--p", t.primary); r.setProperty("--pd", shade(t.primary, 0.35)); }
    if (t.accent) { r.setProperty("--teal", t.accent); r.setProperty("--teald", shade(t.accent, 0.22)); }
  }

  /* ---------- renderers ---------- */
  function bindContact() {
    var c = C(), t = function (sel, fn) { $$(sel).forEach(fn); };
    t("[data-short]", function (e) { e.textContent = c.shortName; });
    t("[data-phone]", function (e) { e.textContent = c.phone; });
    t("[data-phone2]", function (e) { e.textContent = c.phone2; });
    t("[data-phone-link]", function (e) { e.href = telOf(c.phone); });
    t("[data-phone2-link]", function (e) { e.href = telOf(c.phone2); });
    t("[data-email]", function (e) { e.textContent = c.email; });
    t("[data-email-link]", function (e) { e.href = "mailto:" + c.email; });
    t("[data-website]", function (e) { e.textContent = String(c.website).replace(/^https?:\/\//, ""); });
    t("[data-website-link]", function (e) { e.href = c.website; });
    t("[data-address]", function (e) { e.textContent = c.address; });
    t("[data-company]", function (e) { e.textContent = c.company; });
    t("[data-tagline]", function (e) { e.textContent = c.tagline; });
    t("[data-hours]", function (e) { e.textContent = c.hours || ""; });
    t("[data-hours-row]", function (e) { e.hidden = !c.hours; });
    t("[data-directions]", function (e) { e.href = c.directions; });
    t("[data-wa-link]", function (e) {
      e.href = S.waLink("Hello " + c.shortName + ", I would like some help.");
      e.target = "_blank"; e.rel = "noopener";
    });
    $("#yr").textContent = new Date().getFullYear();
    $("#map").innerHTML = c.mapEmbed
      ? '<iframe src="' + esc(c.mapEmbed) + '" loading="lazy" title="Hospital location map"></iframe>'
      : '<div class="map-card"><span class="map-pin">' + icon("pin") + '</span><b>' + esc(c.name) + '</b><span>' + esc(c.address) + '</span><a class="btn btn-sm" href="' + esc(c.directions) + '" target="_blank" rel="noopener">Open in Google Maps</a></div>';
  }

  function renderHero() {
    var h = C().hero;
    $("#h-eyebrow").textContent = h.eyebrow; $("#h-title").textContent = h.title;
    $("#h-accent").textContent = h.accent; $("#h-lead").textContent = h.lead;
    $("#h-img").src = h.image || "building.jpg";
    var qb = $("#qb-dept"), keep = qb.value;
    qb.innerHTML = '<option value="">Choose a department</option>' + S.bookable().map(function (d) { return '<option value="' + esc(d.id) + '">' + esc(d.name) + '</option>'; }).join("");
    qb.value = keep;
    $("#qb-count").textContent = C().departments.length;
    $("#a-p1").textContent = C().about.p1; $("#a-p2").textContent = C().about.p2;
    $("#a-img").src = C().about.image || "building.jpg";
    $("#vision").textContent = C().vision;
    $("#mission").innerHTML = C().mission.map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("");
  }

  var deptQuery = "";
  function renderDepts() {
    var q = deptQuery.trim().toLowerCase();
    var list = C().departments.filter(function (d) { return !q || d.name.toLowerCase().indexOf(q) > -1; });
    var wrap = $("#dept-grid");
    wrap.classList.toggle("open", !!q || wrap.dataset.open === "1");
    wrap.innerHTML = list.map(function (d) {
      var inner = '<span class="ic">' + icon(d.icon) + '</span><span class="dn">' + esc(d.name) + '</span>' + (d.call ? '<span class="tag">Call</span>' : "");
      return d.call ? '<a class="dept" href="' + telOf(C().phone) + '">' + inner + '</a>'
        : '<button type="button" class="dept" data-dept="' + esc(d.id) + '">' + inner + '</button>';
    }).join("");
    $("#dept-empty").hidden = list.length > 0;
    $("#dept-more").hidden = !!q || list.length <= 8;
    $("#dept-more").textContent = wrap.dataset.open === "1" ? "Show fewer" : "Show all " + list.length + " departments";
  }

  function initials(n) {
    var w = String(n).replace(/\b(mr|mrs|ms|dr|adv|prof)\b\.?/gi, "").trim().split(/\s+/).filter(Boolean);
    return ((w[0] || "")[0] || "") + ((w.length > 1 ? w[w.length - 1] : "")[0] || "");
  }
  function renderLists() {
    var c = C();
    $("#svc-grid").innerHTML = c.services.map(function (s) {
      return '<div class="svc-item"><span class="ic">' + icon(s.icon) + '</span><div><b>' + esc(s.name) + '</b><p>' + esc(s.text) + '</p></div></div>';
    }).join("");
    $("#why-grid").innerHTML = c.why.map(function (w, i) {
      return '<li><span class="num">' + (i < 9 ? "0" : "") + (i + 1) + '</span><div><b>' + esc(w.title) + '</b><span>' + esc(w.text) + '</span></div></li>';
    }).join("");
    $("#people-grid").innerHTML = c.people.map(function (p) {
      return '<div class="person"><div class="avatar' + (p.photo ? ' ph' : '') + '">' + (p.photo ? '<img src="' + esc(p.photo) + '" alt="' + esc(p.name) + '" loading="lazy">' : esc(initials(p.name))) + '</div><b>' + esc(p.name) + '</b><span>' + esc(p.role) + '</span></div>';
    }).join("");
    $("#faq-list").innerHTML = c.faqs.map(function (f) { return '<details><summary>' + esc(f.q) + '</summary><p>' + esc(f.a) + '</p></details>'; }).join("");
    var rev = c.reviews || [];
    $("#reviews").hidden = !rev.length;
    $("#rev-grid").innerHTML = rev.map(function (r) {
      var n = Math.max(1, Math.min(5, +r.rating || 5));
      return '<figure class="review"><div class="stars" aria-label="' + n + ' out of 5 stars">' + "★".repeat(n) + "☆".repeat(5 - n) + '</div><blockquote>“' + esc(r.text) + '”</blockquote><figcaption><b>' + esc(r.name) + '</b>' + (r.place ? ' · ' + esc(r.place) : "") + '</figcaption></figure>';
    }).join("");
    var gal = (c.gallery || []).filter(function (g) { return g.image; });
    $("#gallery").hidden = !gal.length;
    $("#gal-grid").innerHTML = gal.map(function (g) {
      return '<figure><a href="' + esc(g.image) + '" target="_blank" rel="noopener"><img src="' + esc(g.image) + '" alt="' + esc(g.caption || "Hospital photo") + '" loading="lazy"></a>' + (g.caption ? '<figcaption>' + esc(g.caption) + '</figcaption>' : "") + '</figure>';
    }).join("");
  }

  function visibleNews() {
    var list = (C().news || []).filter(function (n) { return n.show !== false && (n.title || n.text); });
    list.sort(function (a, b) { return (b.pin ? 1 : 0) - (a.pin ? 1 : 0) || String(b.date || "").localeCompare(String(a.date || "")); });
    return list;
  }
  function renderNews() {
    var list = visibleNews();
    $("#ticker").hidden = !list.length;
    $("#updates").hidden = !list.length; $("#nav-updates").hidden = !list.length;
    var first = list[0];
    if (first) {
      var t = esc(first.title || first.text);
      $("#tk-row").innerHTML = '<span class="tk-label">Update</span><span class="tk-text">' + (first.link ? '<a href="' + esc(first.link) + '" target="_blank" rel="noopener">' + t + '</a>' : t) + '</span><a class="tk-all" href="#updates">' + (list.length > 1 ? "All " + list.length + " updates" : "Details") + ' →</a>';
    }
    $("#news-list").innerHTML = list.slice(0, 8).map(function (n) {
      return '<article class="news-item">' + (n.date ? '<time datetime="' + esc(n.date) + '">' + esc(S.fmtDate(n.date)) + '</time>' : "") +
        '<h3>' + esc(n.title || "") + '</h3>' + (n.text ? '<p>' + esc(n.text) + '</p>' : "") +
        (n.link ? '<a class="more-link" href="' + esc(n.link) + '" target="_blank" rel="noopener">Read more →</a>' : "") + '</article>';
    }).join("");
  }

  S.render = function () {
    applyTheme(); bindContact(); renderHero(); renderDepts(); renderLists(); renderNews();
    $$("[data-i]").forEach(function (el) { el.outerHTML = icon(el.dataset.i); });
    if (S.onRender) S.onRender();
  };

  /* ---------- load content ---------- */
  function fetchJSON(url, ms) {
    return new Promise(function (resolve) {
      var done = false, t = setTimeout(function () { done = true; resolve(null); }, ms);
      var finish = function (v) { if (!done) { done = true; clearTimeout(t); resolve(v); } };
      try {
        fetch(url, { cache: "no-cache" }).then(function (r) {
          if (!r.ok || (r.headers.get("content-type") || "").indexOf("json") < 0) throw 0;
          return r.json();
        }).then(finish, function () { finish(null); });
      } catch (e) { finish(null); }
    });
  }
  S.draftKey = "nhrc_draft_v1";
  S.loadDraft = function () { var d = store.get(S.draftKey); try { return d ? JSON.parse(d) : null; } catch (e) { return null; } };
  S.saveDraft = function () { return store.set(S.draftKey, JSON.stringify(S.content)); };
  S.setContent = function (c, quiet) { S.content = c; if (!quiet) S.render(); };
  S.reloadPublished = function () { S.content = clone(S.published); S.render(); };

  function boot() {
    S.content = clone(DEF); S.render();      // show the defaults at once
    Promise.all([fetchJSON(S.api.content, 1500), fetchJSON("content.json", 1500)]).then(function (r) {
      S.api.alive = r[0] !== null;
      var remote = (r[0] && Object.keys(r[0]).length ? r[0] : null) || (r[1] && Object.keys(r[1]).length ? r[1] : null);
      S.published = merge(clone(DEF), remote || {});
      var draft = store.sget("nhrc_admin") ? S.loadDraft() : null;
      S.content = draft ? merge(clone(DEF), draft) : clone(S.published);
      S.admin = !!store.sget("nhrc_admin");
      S.render(); initChrome();
      if (S.admin) loadAdmin();
    });
  }

  /* ---------- page chrome: menu, search, reveal, sheet launchers ---------- */
  function initChrome() {
    $("#quickbook").addEventListener("submit", function (e) {
      e.preventDefault(); if (window.Booking) window.Booking.open($("#qb-dept").value || undefined);
    });
    var btn = $(".menu-btn"), menu = $("#menu");
    var setMenu = function (o) { menu.classList.toggle("open", o); btn.setAttribute("aria-expanded", o); btn.setAttribute("aria-label", o ? "Close menu" : "Open menu"); };
    btn.addEventListener("click", function () { setMenu(!menu.classList.contains("open")); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a,button")) setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

    $("#dept-search").addEventListener("input", function (e) { deptQuery = e.target.value; renderDepts(); });
    $("#dept-more").addEventListener("click", function () {
      var w = $("#dept-grid"); w.dataset.open = w.dataset.open === "1" ? "0" : "1"; renderDepts();
    });
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-open-book]");
      if (b) { window.Booking && window.Booking.open(); return; }
      var d = e.target.closest("[data-dept]");
      if (d && window.Booking) window.Booking.open(d.dataset.dept);
    });
    // wa links that are not set up yet should not open a wrong chat
    document.addEventListener("click", function (e) {
      var a = e.target.closest("[data-wa-link]");
      if (a && !S.waLive()) { e.preventDefault(); S.toast("WhatsApp is not set up yet. Please call us."); }
    });

    var header = $(".header"), links = $$('#menu a[href^="#"]'), ticking = false;
    var onScroll = function () {
      header.classList.toggle("scrolled", window.scrollY > 6);
      ticking = false;
    };
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

    $("#staff-link").addEventListener("click", openLogin);
    $("#edit-fab").addEventListener("click", function () { loadAdmin(); });
    updateFab();
  }

  /* ---------- staff login ---------- */
  // Check works without a server: the user name and a hash of the password are kept here.
  // With the Netlify backend the password is verified on the server instead (see README-ADMIN.md).
  function h53(str) {
    var h1 = 0xdeadbeef, h2 = 0x41c6ce57, ch;
    for (var i = 0; i < str.length; i++) { ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  }
  var AUTH_HASH = 6280720360900799;
  var lg = $("#login");
  function showDialog(d) { if (d.showModal) d.showModal(); else d.setAttribute("open", ""); }
  function hideDialog(d) { if (d.close) d.close(); else d.removeAttribute("open"); }
  S.showDialog = showDialog; S.hideDialog = hideDialog;
  function updateFab() { $("#edit-fab").hidden = !S.admin; }
  S.updateFab = updateFab;
  function openLogin() {
    if (S.admin) { loadAdmin(); return; }
    $("#lg-err").hidden = true; $("#lg-pass").value = ""; showDialog(lg); $("#lg-user").focus();
  }
  $("#lg-close").addEventListener("click", function () { hideDialog(lg); });
  $("#login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var u = $("#lg-user").value.trim().toLowerCase(), p = $("#lg-pass").value, err = $("#lg-err");
    var fail = function (m) { err.textContent = m; err.hidden = false; };
    if (!u || !p) return fail("Enter your user name and password.");
    var ok = function () {
      S.admin = true; S.adminUser = u; S.adminPass = p;
      store.sset("nhrc_admin", "1"); store.sset("nhrc_admin_u", u); store.sset("nhrc_admin_p", p);
      hideDialog(lg); var d = S.loadDraft(); if (d) { S.setContent(merge(clone(DEF), d)); }
      updateFab(); loadAdmin();
    };
    if (S.api.alive) {
      fetch(S.api.content, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ check: true, user: u, password: p }) })
        .then(function (r) { r.ok ? ok() : fail("Wrong user name or password."); }, function () { fail("Could not reach the server. Try again."); });
    } else if (u === "navodaya" && h53("navodaya|" + p) === AUTH_HASH) ok();
    else fail("Wrong user name or password.");
  });
  S.logout = function () {
    S.admin = false; store.sdel("nhrc_admin"); store.sdel("nhrc_admin_u"); store.sdel("nhrc_admin_p");
    S.content = clone(S.published); S.render(); updateFab();
  };

  var adminLoading = false;
  function loadAdmin() {
    if (window.Admin) { window.Admin.open(); return; }
    if (adminLoading) return; adminLoading = true;
    S.adminUser = S.adminUser || store.sget("nhrc_admin_u"); S.adminPass = S.adminPass || store.sget("nhrc_admin_p");
    var l = document.createElement("link"); l.rel = "stylesheet"; l.href = "admin.css"; document.head.appendChild(l);
    var s = document.createElement("script"); s.src = "admin.js";
    s.onload = function () { adminLoading = false; window.Admin.open(); };
    s.onerror = function () { adminLoading = false; S.toast("Could not load the editor."); };
    document.body.appendChild(s);
  }

  boot();
})();
