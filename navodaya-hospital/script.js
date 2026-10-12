(function () {
  var H = window.HOSPITAL;
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return document.querySelectorAll(s); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); };
  var deptName = function (id) { return (H.departments.filter(function (d) { return d.id === id; })[0] || {}).name || id; };
  var motion = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
  // Hidden start states are applied only when JS runs and motion is allowed.
  if (motion) document.documentElement.classList.add("motion");

  $$("[data-i]").forEach(function (el) { el.outerHTML = icon(el.dataset.i); });

  // ----- Contact details from config -----
  var waBase = "https://wa.me/" + H.whatsapp;
  $$("[data-wa-link]").forEach(function (a) {
    a.href = waBase + "?text=" + encodeURIComponent("Hello " + H.name + ", I would like some help.");
    a.target = "_blank"; a.rel = "noopener";
  });
  var tel = "tel:" + H.phone.replace(/[^\d+]/g, "");
  $$("[data-phone]").forEach(function (a) { a.textContent = H.phone; if (a.tagName === "A") a.href = tel; });
  $$("[data-phone-link]").forEach(function (a) { a.href = tel; });
  $$("[data-email]").forEach(function (a) { a.textContent = H.email; a.href = "mailto:" + H.email; });
  $$("[data-address]").forEach(function (a) { a.textContent = H.address; });
  $("#yr").textContent = new Date().getFullYear();
  $("#directions").href = H.directions;
  if (H.hours) {
    $("#top-hours").textContent = H.hours; $("#top-hours").hidden = false;
    $("#hours").textContent = H.hours; $("#hours-row").hidden = false;
  }
  if (H.sampleContent) $("#sample-bar").hidden = false;
  $("#map").innerHTML = H.mapEmbed
    ? '<iframe src="' + esc(H.mapEmbed) + '" loading="lazy" title="Hospital location map"></iframe>'
    : '<div class="map-card"><span class="map-pin">' + icon("pin") + '</span><b>Navodaya Hospital</b><span>' + esc(H.address) + '</span><a class="btn btn-sm" href="' + esc(H.directions) + '" target="_blank" rel="noopener">Open in Google Maps</a></div>';
  if (H.heroImage) $(".hero").style.setProperty("--hero-img", "url('" + H.heroImage + "')");

  // ----- Mobile menu -----
  var btn = $(".menu-btn"), menu = $("#menu");
  function setMenu(open) { menu.classList.toggle("open", open); btn.setAttribute("aria-expanded", open); btn.setAttribute("aria-label", open ? "Close menu" : "Open menu"); }
  btn.addEventListener("click", function () { setMenu(!menu.classList.contains("open")); });
  menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

  // ----- Content sections -----
  var card = function (ic, t, p, extra) {
    return '<div class="card"' + (extra || "") + '><div class="ic">' + icon(ic) + '</div><h3>' + esc(t) + '</h3>' + (p ? '<p>' + esc(p) + '</p>' : "") + '</div>';
  };
  $("#dept-grid").innerHTML = H.departments.map(function (d) {
    return '<a class="card" href="#book" data-dept="' + d.id + '"><div class="ic">' + icon(d.icon) + '</div><h3>' + esc(d.name) + '</h3><p>' + esc(d.text) + '</p></a>';
  }).join("");
  $("#svc-grid").innerHTML = H.services.map(function (s) { return card(s.icon, s.name); }).join("");
  $("#why-grid").innerHTML = H.why.map(function (w) { return card(w.icon, w.title, w.text); }).join("");
  $("#steps").innerHTML = H.steps.map(function (s, i) {
    return '<li class="step"><span class="num">' + (i + 1) + '</span><div class="ic">' + icon(s.icon) + '</div><h3>' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p></li>';
  }).join("");
  $("#faq-list").innerHTML = H.faqs.map(function (f) {
    return '<details><summary>' + esc(f.q) + '</summary><p>' + esc(f.a) + '</p></details>';
  }).join("");
  if (H.reviews.length) {
    $("#reviews").hidden = false;
    $("#rev-grid").innerHTML = H.reviews.map(function (r) {
      return '<figure class="card review"><div class="stars" aria-label="' + r.rating + ' out of 5 stars">' + "★".repeat(r.rating) + "☆".repeat(5 - r.rating) + '</div><blockquote>“' + esc(r.text) + '”</blockquote><figcaption><b>' + esc(r.name) + '</b><span>' + esc(r.place) + '</span></figcaption></figure>';
    }).join("");
    var nav = document.createElement("a"); nav.href = "#reviews"; nav.textContent = "Reviews";
    menu.insertBefore(nav, $('#menu a[href="#faq"]'));
  }

  // ----- Booking form -----
  var form = $("#booking-form"), err = $("#form-error");
  var fDept = $("#f-dept"), fDoc = $("#f-doc"), fDate = $("#f-date"), fTime = $("#f-time");
  var slots = $("#slots");
  function fillDocs() {
    var list = H.doctors.filter(function (d) { return d.dept === fDept.value; });
    fDoc.innerHTML = '<option value="Any available doctor">Any available doctor</option>' + list.map(function (d) { return '<option>' + esc(d.name) + '</option>'; }).join("");
  }
  fDept.innerHTML = '<option value="">Select department</option>' + H.departments.map(function (d) { return '<option value="' + d.id + '">' + esc(d.name) + '</option>'; }).join("");
  slots.innerHTML = H.timeSlots.map(function (t) { return '<button type="button" class="slot" role="radio" aria-checked="false" data-t="' + t + '">' + t + '</button>'; }).join("");
  slots.addEventListener("click", function (e) {
    var b = e.target.closest(".slot"); if (!b) return;
    slots.querySelectorAll(".slot").forEach(function (x) { var on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-checked", on); });
    fTime.value = b.dataset.t; slots.classList.remove("bad"); updateSummary();
  });
  fDept.addEventListener("change", function () { fillDocs(); updateSummary(); }); fillDocs();
  form.addEventListener("input", updateSummary);
  var today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  var iso = function (d) { var x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10); };
  fDate.min = iso(today);
  var quick = $("#date-quick");
  [["Today", 0], ["Tomorrow", 1], ["In 2 days", 2]].forEach(function (q) {
    var d = new Date(); d.setDate(d.getDate() + q[1]);
    var b = document.createElement("button"); b.type = "button"; b.className = "qd"; b.textContent = q[0]; b.dataset.d = iso(d);
    b.addEventListener("click", function () { fDate.value = b.dataset.d; markQuick(); updateSummary(); });
    quick.appendChild(b);
  });
  function markQuick() { quick.querySelectorAll(".qd").forEach(function (b) { b.classList.toggle("on", b.dataset.d === fDate.value); }); }
  fDate.addEventListener("change", function () { markQuick(); updateSummary(); });

  var summary = $("#summary");
  function updateSummary() {
    var f = form.elements, rows = [];
    if (f.name.value.trim()) rows.push(["Patient", f.name.value.trim()]);
    if (f.department.value) rows.push(["Department", deptName(f.department.value)]);
    if (f.department.value && f.doctor.value) rows.push(["Doctor", f.doctor.value]);
    if (f.date.value) rows.push(["Date", new Date(f.date.value + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })]);
    if (f.time.value) rows.push(["Time", f.time.value]);
    summary.hidden = !rows.length;
    summary.innerHTML = '<b>Your request</b>' + rows.map(function (r) { return '<span><i>' + r[0] + '</i>' + esc(r[1]) + '</span>'; }).join("");
  }
  var filter = "all";
  function renderDocs() {
    $("#doc-grid").innerHTML = H.doctors.filter(function (d) { return filter === "all" || d.dept === filter; }).map(function (d) {
      return '<div class="card doc"><div class="avatar">' + icon("doctor") + '</div><h3>' + esc(d.name) + '</h3><small>' + esc(d.qual) + ' · ' + esc(d.exp) + '</small>' +
        '<span class="tag">' + esc(deptName(d.dept)) + '</span><small>Available: ' + esc(d.days) + '</small>' +
        '<button type="button" class="btn btn-sm" data-book="' + esc(d.name) + '" data-dept="' + d.dept + '">Book ' + esc(d.name) + '</button></div>';
    }).join("");
    observe($$("#doc-grid .card"));
  }
  $("#dept-filters").innerHTML = '<button type="button" class="chip on" data-f="all" aria-pressed="true">All</button>' +
    H.departments.map(function (d) { return '<button type="button" class="chip" data-f="' + d.id + '" aria-pressed="false">' + esc(d.name) + '</button>'; }).join("");
  $("#dept-filters").addEventListener("click", function (e) {
    var f = e.target.dataset.f; if (!f) return; filter = f;
    $$(".chip").forEach(function (c) { var on = c.dataset.f === f; c.classList.toggle("on", on); c.setAttribute("aria-pressed", on); });
    renderDocs();
  });

  function preselect(dept, doc) { fDept.value = dept; fillDocs(); if (doc) fDoc.value = doc; updateSummary(); }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-book]");
    if (b) { preselect(b.dataset.dept, b.dataset.book); $("#book").scrollIntoView({ behavior: motion ? "smooth" : "auto" }); return; }
    var c = e.target.closest("#dept-grid .card");
    if (c) preselect(c.dataset.dept);
  });


  var labels = { name: "patient name", phone: "a valid mobile number", department: "department", date: "date", time: "time" };
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = form.elements, bad = [];
    Object.keys(labels).forEach(function (n) { f[n].classList.remove("bad"); f[n].removeAttribute("aria-invalid"); }); slots.classList.remove("bad");
    if (!f.name.value.trim()) bad.push("name");
    if (!/^\+?[\d ]{10,15}$/.test(f.phone.value.trim())) bad.push("phone");
    ["department", "date", "time"].forEach(function (n) { if (!f[n].value) bad.push(n); });
    if (bad.length) {
      bad.forEach(function (n) { f[n].classList.add("bad"); f[n].setAttribute("aria-invalid", "true"); if (n === "time") slots.classList.add("bad"); });
      err.textContent = "Please enter: " + bad.map(function (n) { return labels[n]; }).join(", ") + "."; err.hidden = false; (bad[0] === "time" ? slots.querySelector(".slot") : f[bad[0]]).focus(); return;
    }
    err.hidden = true;
    var d = new Date(f.date.value + "T00:00:00");
    var msg = ["*New appointment request – " + H.name + "*",
      "Name: " + f.name.value.trim(), "Mobile: " + f.phone.value.trim(),
      "Department: " + deptName(f.department.value), "Doctor: " + f.doctor.value,
      "Date: " + d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
      "Time: " + f.time.value, "Visit type: " + f.type.value,
      f.notes.value.trim() ? "Reason: " + f.notes.value.trim() : ""].filter(Boolean).join("\n");
    toast("Opening WhatsApp with your request…");
    window.open(waBase + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
  });

  // ----- Motion: one calm scroll reveal + header shadow -----
  var header = $(".header");
  window.addEventListener("scroll", function () { header.classList.toggle("scrolled", window.scrollY > 10); }, { passive: true });
  var io = null;
  if (motion && "IntersectionObserver" in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
  }
  function observe(list) {
    list.forEach(function (el, i) {
      if (!io) return;
      el.classList.add("reveal"); el.style.setProperty("--d", ((i % 4) * 0.08) + "s"); io.observe(el);
    });
  }
  observe($$(".section h2, .section .sub, .card, .step, .form, .mv > div, .map, details, .ticks, .cta-band .wrap"));
  renderDocs();
  updateSummary();

  // ----- Extra interactive touches -----
  var toastEl = $("#toast"), tt;
  function toast(msg) {
    toastEl.innerHTML = '<span class="tick">' + icon("check") + '</span>' + esc(msg);
    toastEl.classList.add("show"); clearTimeout(tt); tt = setTimeout(function () { toastEl.classList.remove("show"); }, 3200);
  }

  // Scroll progress, back-to-top, scrollspy, hero parallax (transform only)
  var bar = $("#progress"), totop = $("#totop"), heroBg = $(".hero"), ticking = false;
  var links = [].slice.call($$('#menu a[href^="#"]:not(.btn)')), spy = {};
  links.forEach(function (a) { var t = document.getElementById(a.getAttribute("href").slice(1)); if (t) spy[a.getAttribute("href")] = t; });
  function onScroll() {
    var y = window.scrollY, max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
    totop.classList.toggle("show", y > 700);
    var cur = null;
    links.forEach(function (a) { var t = spy[a.getAttribute("href")]; if (t && t.getBoundingClientRect().top < innerHeight * 0.4) cur = a; });
    links.forEach(function (a) { a.classList.toggle("active", a === cur); });
    if (motion && y < innerHeight) heroBg.style.setProperty("--py", (y * 0.18) + "px");
    ticking = false;
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  totop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: motion ? "smooth" : "auto" }); });
  onScroll();

  // Card spotlight follows the pointer
  if (matchMedia("(hover: hover)").matches) {
    document.addEventListener("pointermove", function (e) {
      var c = e.target.closest && e.target.closest(".card, .step");
      if (!c) return;
      var r = c.getBoundingClientRect();
      c.style.setProperty("--mx", (e.clientX - r.left) + "px"); c.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  }

  // Headline: words rise in one by one
  if (motion) {
    var h1 = $("h1");
    if (h1) {
      var i = 0;
      (function wrap(n) {
        [].slice.call(n.childNodes).forEach(function (c) {
          if (c.nodeType === 3) {
            var f = document.createDocumentFragment();
            c.textContent.split(/(\s+)/).forEach(function (w) {
              if (!w.trim()) { f.appendChild(document.createTextNode(w)); return; }
              var o = document.createElement("span"); o.className = "w";
              var inn = document.createElement("span"); inn.textContent = w; inn.style.animationDelay = (0.2 + i++ * 0.06) + "s"; o.appendChild(inn); f.appendChild(o);
            });
            n.replaceChild(f, c);
          } else wrap(c);
        });
      })(h1);
      h1.classList.add("split"); h1.classList.remove("hero-in");
    }
  }
})();
