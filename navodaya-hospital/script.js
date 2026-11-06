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
  var waLive = H.whatsapp && !/^9100+$/.test(H.whatsapp) && !/^0+$/.test(H.whatsapp);
  var waBase = "https://wa.me/" + H.whatsapp;
  var telOf = function (p) { return "tel:" + p.replace(/[^\d+]/g, ""); };
  $$("[data-wa-link]").forEach(function (a) {
    a.href = waBase + "?text=" + encodeURIComponent("Hello " + H.shortName + ", I would like some help.");
    a.target = "_blank"; a.rel = "noopener";
    if (!waLive) a.addEventListener("click", function (e) { e.preventDefault(); toast("WhatsApp is not connected yet."); });
  });
  $$("[data-phone]").forEach(function (a) { a.textContent = H.phone; if (a.tagName === "A") a.href = telOf(H.phone); });
  $$("[data-phone2]").forEach(function (a) { a.textContent = H.phone2; a.href = telOf(H.phone2); });
  $$("[data-phone-link]").forEach(function (a) { a.href = telOf(H.phone); });
  $$("[data-email]").forEach(function (a) { a.textContent = H.email; a.href = "mailto:" + H.email; });
  $$("[data-website]").forEach(function (a) { a.href = H.website; a.textContent = H.website.replace(/^https?:\/\//, ""); });
  $$("[data-address]").forEach(function (a) { a.textContent = H.address; });
  $("#yr").textContent = new Date().getFullYear();
  $("#directions").href = H.directions;
  if (H.hours) {
    $("#top-hours").textContent = H.hours; $("#top-hours").hidden = false;
    $("#hours").textContent = H.hours; $("#hours-row").hidden = false;
  }
  if (!waLive) $("#sample-bar").hidden = false;
  $("#map").innerHTML = H.mapEmbed
    ? '<iframe src="' + esc(H.mapEmbed) + '" loading="lazy" title="Hospital location map"></iframe>'
    : '<div class="map-card"><span class="map-pin">' + icon("pin") + '</span><b>' + esc(H.name) + '</b><span>' + esc(H.address) + '</span><a class="btn btn-sm" href="' + esc(H.directions) + '" target="_blank" rel="noopener">Open in Google Maps</a></div>';

  // ----- Mobile menu -----
  var btn = $(".menu-btn"), menu = $("#menu");
  function setMenu(open) { menu.classList.toggle("open", open); btn.setAttribute("aria-expanded", open); btn.setAttribute("aria-label", open ? "Close menu" : "Open menu"); }
  btn.addEventListener("click", function () { setMenu(!menu.classList.contains("open")); });
  menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

  // ----- Content sections -----
  var card = function (ic, t, p) {
    return '<div class="card"><div class="ic">' + icon(ic) + '</div><h3>' + esc(t) + '</h3>' + (p ? '<p>' + esc(p) + '</p>' : "") + '</div>';
  };
  var bookable = H.departments.filter(function (d) { return !d.call; });
  function renderDepts(q) {
    q = (q || "").trim().toLowerCase();
    var list = H.departments.filter(function (d) { return !q || d.name.toLowerCase().indexOf(q) > -1; });
    $("#dept-grid").innerHTML = list.map(function (d) {
      var inner = '<span class="ic">' + icon(d.icon) + '</span><span class="dn">' + esc(d.name) + '</span><span class="go">' + (d.call ? "Call" : "Book") + ' →</span>';
      return d.call
        ? '<a class="dept" href="' + telOf(H.phone) + '">' + inner + '</a>'
        : '<a class="dept" href="#book" data-dept="' + d.id + '">' + inner + '</a>';
    }).join("");
    $("#dept-empty").hidden = list.length > 0;
    observe($$("#dept-grid .dept"));
  }
  $("#svc-grid").innerHTML = H.services.map(function (s) { return card(s.icon, s.name, s.text); }).join("");
  $("#why-grid").innerHTML = H.why.map(function (w) { return card(w.icon, w.title, w.text); }).join("");
  $("#people-grid").innerHTML = H.people.map(function (p) {
    return '<div class="card person"><div class="avatar">' + icon("doctor") + '</div><h3>' + esc(p.name) + '</h3><p>' + esc(p.role) + '</p></div>';
  }).join("");
  $("#vision").textContent = H.vision;
  $("#mission").innerHTML = H.mission.map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("");
  $("#steps").innerHTML = H.steps.map(function (s, i) {
    return '<li class="step"><span class="num">' + (i + 1) + '</span><div class="ic">' + icon(s.icon) + '</div><h3>' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p></li>';
  }).join("");
  $("#faq-list").innerHTML = H.faqs.map(function (f) { return '<details><summary>' + esc(f.q) + '</summary><p>' + esc(f.a) + '</p></details>'; }).join("");
  if (H.reviews.length) {
    $("#reviews").hidden = false;
    $("#rev-grid").innerHTML = H.reviews.map(function (r) {
      return '<figure class="card review"><div class="stars" aria-label="' + r.rating + ' out of 5 stars">' + "★".repeat(r.rating) + "☆".repeat(5 - r.rating) + '</div><blockquote>“' + esc(r.text) + '”</blockquote><figcaption><b>' + esc(r.name) + '</b><span>' + esc(r.place) + '</span></figcaption></figure>';
    }).join("");
    var nav = document.createElement("a"); nav.href = "#reviews"; nav.textContent = "Reviews";
    menu.insertBefore(nav, $('#menu a[href="#faq"]'));
  }

  // ----- Department search -----
  $("#dept-search").addEventListener("input", function (e) { renderDepts(e.target.value); });

  // ----- Booking form -----
  var form = $("#booking-form"), err = $("#form-error");
  var fDept = $("#f-dept"), fDate = $("#f-date"), fTime = $("#f-time"), slots = $("#slots");
  fDept.innerHTML = '<option value="">Select department</option>' + bookable.map(function (d) { return '<option value="' + d.id + '">' + esc(d.name) + '</option>'; }).join("");
  slots.innerHTML = H.timeSlots.map(function (t) { return '<button type="button" class="slot" role="radio" aria-checked="false" data-t="' + t + '">' + t + '</button>'; }).join("");
  slots.addEventListener("click", function (e) {
    var b = e.target.closest(".slot"); if (!b) return;
    slots.querySelectorAll(".slot").forEach(function (x) { var on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-checked", on); });
    fTime.value = b.dataset.t; slots.classList.remove("bad"); updateSummary();
  });
  var today = new Date();
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
  form.addEventListener("input", updateSummary);

  var summary = $("#summary");
  function updateSummary() {
    var f = form.elements, rows = [];
    if (f.name.value.trim()) rows.push(["Patient", f.name.value.trim()]);
    if (f.department.value) rows.push(["Department", deptName(f.department.value)]);
    if (f.date.value) rows.push(["Date", new Date(f.date.value + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })]);
    if (f.time.value) rows.push(["Time", f.time.value]);
    summary.hidden = !rows.length;
    summary.innerHTML = '<b>Your request</b>' + rows.map(function (r) { return '<span><i>' + r[0] + '</i>' + esc(r[1]) + '</span>'; }).join("");
  }
  function preselect(dept) { fDept.value = dept; updateSummary(); }
  document.addEventListener("click", function (e) {
    var c = e.target.closest("[data-dept]");
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
      err.textContent = "Please enter: " + bad.map(function (n) { return labels[n]; }).join(", ") + "."; err.hidden = false;
      (bad[0] === "time" ? slots.querySelector(".slot") : f[bad[0]]).focus(); return;
    }
    err.hidden = true;
    if (!waLive) { toast("Booking is not connected yet. Please call us."); return; }
    var d = new Date(f.date.value + "T00:00:00");
    var msg = ["*New appointment request – " + H.shortName + "*",
      "Name: " + f.name.value.trim(), "Mobile: " + f.phone.value.trim(),
      "Department: " + deptName(f.department.value),
      "Date: " + d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
      "Time: " + f.time.value, "Visit type: " + f.type.value,
      f.notes.value.trim() ? "Reason: " + f.notes.value.trim() : ""].filter(Boolean).join("\n");
    toast("Opening WhatsApp with your request…");
    window.open(waBase + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
  });

  // ----- Toast -----
  var toastEl = $("#toast"), tt;
  function toast(msg) {
    toastEl.innerHTML = '<span class="tick">' + icon("check") + '</span>' + esc(msg);
    toastEl.classList.add("show"); clearTimeout(tt); tt = setTimeout(function () { toastEl.classList.remove("show"); }, 3200);
  }

  // ----- Motion: scroll reveal, progress, scrollspy, parallax, spotlight -----
  var io = null;
  if (motion && "IntersectionObserver" in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
  }
  function observe(list) {
    list.forEach(function (el, i) {
      if (!io) return;
      el.classList.add("reveal"); el.style.setProperty("--d", ((i % 4) * 0.06) + "s"); io.observe(el);
    });
  }
  renderDepts("");
  updateSummary();
  observe($$(".section h2, .section .sub, .card, .step, .form, .vm-card, .about-photo, .map, details, .ticks, .cta-band .wrap, .infonote"));

  var header = $(".header"), bar = $("#progress"), totop = $("#totop"), hero = $(".hero"), ticking = false;
  var links = [].slice.call($$('#menu a[href^="#"]:not(.btn)')), spy = {};
  links.forEach(function (a) { var t = document.getElementById(a.getAttribute("href").slice(1)); if (t) spy[a.getAttribute("href")] = t; });
  function onScroll() {
    var y = window.scrollY, max = document.documentElement.scrollHeight - innerHeight;
    header.classList.toggle("scrolled", y > 10);
    bar.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
    totop.classList.toggle("show", y > 700);
    var cur = null;
    links.forEach(function (a) { var t = spy[a.getAttribute("href")]; if (t && t.getBoundingClientRect().top < innerHeight * 0.4) cur = a; });
    links.forEach(function (a) { a.classList.toggle("active", a === cur); });
    if (motion && y < innerHeight) hero.style.setProperty("--py", (y * 0.12) + "px");
    ticking = false;
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  totop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: motion ? "smooth" : "auto" }); });
  onScroll();

  if (matchMedia("(hover: hover)").matches) {
    document.addEventListener("pointermove", function (e) {
      var c = e.target.closest && e.target.closest(".card, .step, .dept");
      if (!c) return;
      var r = c.getBoundingClientRect();
      c.style.setProperty("--mx", (e.clientX - r.left) + "px"); c.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  }

  // Headline words rise in one by one
  if (motion) {
    var h1 = $("h1"), i = 0;
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
})();
