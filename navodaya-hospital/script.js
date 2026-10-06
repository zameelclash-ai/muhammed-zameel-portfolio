(function () {
  var H = window.HOSPITAL;
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); };
  var deptName = function (id) { return (H.departments.filter(function (d) { return d.id === id; })[0] || {}).name || id; };

  // Contact details from config
  var waBase = "https://wa.me/" + H.whatsapp;
  document.querySelectorAll("[data-wa-link]").forEach(function (a) {
    a.href = waBase + "?text=" + encodeURIComponent("Hello " + H.name + ", I need some help.");
    a.target = "_blank"; a.rel = "noopener";
  });
  var tel = "tel:" + H.phone.replace(/[^\d+]/g, "");
  document.querySelectorAll("[data-phone]").forEach(function (a) { a.textContent = H.phone; a.href = tel; });
  document.querySelectorAll("[data-phone-link]").forEach(function (a) { a.href = tel; });
  document.querySelectorAll("[data-email]").forEach(function (a) { a.textContent = H.email; a.href = "mailto:" + H.email; });
  document.querySelectorAll("[data-address]").forEach(function (a) { a.textContent = H.address; });
  $("#yr").textContent = new Date().getFullYear();
  if (H.mapEmbed) $("#map").innerHTML = '<iframe src="' + esc(H.mapEmbed) + '" loading="lazy" title="Hospital location"></iframe>';
  else $("#map").textContent = "Map – add your Google Maps embed link in data.js";

  // Mobile menu
  var btn = $(".menu-btn"), menu = $("#menu");
  btn.addEventListener("click", function () { var o = menu.classList.toggle("open"); btn.setAttribute("aria-expanded", o); });
  menu.addEventListener("click", function (e) { if (e.target.tagName === "A") menu.classList.remove("open"); });

  // Departments & services
  $("#dept-grid").innerHTML = H.departments.map(function (d) {
    return '<a class="card" href="#book" data-dept="' + d.id + '"><div class="ic">' + d.icon + '</div><h3>' + esc(d.name) + '</h3><p>' + esc(d.text) + '</p></a>';
  }).join("");
  $("#svc-grid").innerHTML = H.services.map(function (s) {
    return '<div class="card"><div class="ic">' + s.icon + '</div><h3>' + esc(s.name) + '</h3></div>';
  }).join("");

  // Why choose us & reviews
  $("#why-grid").innerHTML = H.why.map(function (w) {
    return '<div class="card"><div class="ic">' + w.icon + '</div><h3>' + esc(w.title) + '</h3><p>' + esc(w.text) + '</p></div>';
  }).join("");
  $("#rev-grid").innerHTML = H.reviews.map(function (r) {
    return '<figure class="card review"><div class="stars">' + "★".repeat(r.rating) + "☆".repeat(5 - r.rating) + '</div><blockquote>“' + esc(r.text) + '”</blockquote><figcaption><b>' + esc(r.name) + '</b><span>' + esc(r.place) + '</span></figcaption></figure>';
  }).join("");
  if (H.heroImage) document.querySelector(".hero").style.setProperty("--hero-img", "url('" + H.heroImage + "')");

  // Booking form selects
  var fDept = $("#f-dept"), fDoc = $("#f-doc"), fDate = $("#f-date"), fTime = $("#f-time");
  function fillDocs() {
    var list = H.doctors.filter(function (d) { return d.dept === fDept.value; });
    fDoc.innerHTML = '<option value="Any available doctor">Any available doctor</option>' +
      list.map(function (d) { return '<option>' + esc(d.name) + '</option>'; }).join("");
  }
  fDept.innerHTML = '<option value="">Select department</option>' +
    H.departments.map(function (d) { return '<option value="' + d.id + '">' + esc(d.name) + '</option>'; }).join("");
  fTime.innerHTML = '<option value="">Select time</option>' + H.timeSlots.map(function (t) { return '<option>' + t + '</option>'; }).join("");
  fDept.addEventListener("change", fillDocs); fillDocs();
  var today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  fDate.min = today.toISOString().slice(0, 10);

  // Doctors list with filter
  var filter = "all";
  function renderDocs() {
    $("#doc-grid").innerHTML = H.doctors.filter(function (d) { return filter === "all" || d.dept === filter; }).map(function (d) {
      return '<div class="card doc"><div class="avatar">👨‍⚕️</div><h3>' + esc(d.name) + '</h3><small>' + esc(d.qual) + ' · ' + esc(d.exp) + '</small>' +
        '<span class="tag">' + esc(deptName(d.dept)) + '</span><small>Available: ' + esc(d.days) + '</small><br>' +
        '<button class="btn btn-sm" data-book="' + esc(d.name) + '" data-dept="' + d.dept + '">Book</button></div>';
    }).join("");
  }
  $("#dept-filters").innerHTML = '<button class="chip on" data-f="all">All</button>' +
    H.departments.map(function (d) { return '<button class="chip" data-f="' + d.id + '">' + esc(d.name) + '</button>'; }).join("");
  $("#dept-filters").addEventListener("click", function (e) {
    var f = e.target.dataset.f; if (!f) return; filter = f;
    document.querySelectorAll(".chip").forEach(function (c) { c.classList.toggle("on", c.dataset.f === f); });
    renderDocs();
  });
  renderDocs();

  function preselect(dept, doc) {
    fDept.value = dept; fillDocs(); if (doc) fDoc.value = doc;
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-book]");
    if (b) { preselect(b.dataset.dept, b.dataset.book); $("#book").scrollIntoView({ behavior: "smooth" }); return; }
    var c = e.target.closest("#dept-grid .card");
    if (c) preselect(c.dataset.dept);
  });

  // Submit -> WhatsApp
  var form = $("#booking-form"), err = $("#form-error");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = form.elements, bad = [];
    ["name", "phone", "department", "date", "time"].forEach(function (n) { f[n].classList.remove("bad"); });
    if (!f.name.value.trim()) bad.push("name");
    if (!/^\+?[\d ]{10,15}$/.test(f.phone.value.trim())) bad.push("phone");
    ["department", "date", "time"].forEach(function (n) { if (!f[n].value) bad.push(n); });
    if (bad.length) {
      bad.forEach(function (n) { f[n].classList.add("bad"); });
      err.textContent = "Please check: " + bad.join(", ") + "."; err.hidden = false; f[bad[0]].focus(); return;
    }
    err.hidden = true;
    var d = new Date(f.date.value + "T00:00:00");
    var msg = ["*New Appointment Request – " + H.name + "*",
      "Name: " + f.name.value.trim(),
      "Mobile: " + f.phone.value.trim(),
      "Department: " + deptName(f.department.value),
      "Doctor: " + f.doctor.value,
      "Date: " + d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
      "Time: " + f.time.value,
      "Visit type: " + f.type.value,
      f.notes.value.trim() ? "Reason: " + f.notes.value.trim() : ""].filter(Boolean).join("\n");
    window.open(waBase + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
  });
})();
