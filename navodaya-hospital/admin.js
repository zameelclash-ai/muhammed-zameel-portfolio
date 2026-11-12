/* Staff editor: edit the site, upload photos, use AI helpers, publish. */
(function () {
  "use strict";
  var S = window.Site, $ = S.$, esc = S.esc, root = $("#admin-root");
  var tab = "general", built = false, timer = null;

  /* ---------- small helpers ---------- */
  function getP(o, p) { return String(p).split(".").reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
  function setP(o, p, v) {
    var ks = String(p).split("."), last = ks.pop();
    var t = ks.reduce(function (a, k) { return a[k]; }, o); t[last] = v;
  }
  var slug = function (s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item"; };
  var uid = function (s) { return slug(s) + "-" + Math.random().toString(36).slice(2, 6); };
  var dirty = function () { return JSON.stringify(S.content) !== JSON.stringify(S.published); };

  function commit() {
    clearTimeout(timer);
    timer = setTimeout(function () {
      if (!S.saveDraft()) S.toast("Saved on screen, but this device is out of space. Publish soon.");
      S.render(); state();
    }, 200);
  }
  function state() {
    var el = $("#adm-state"); if (!el) return;
    el.textContent = dirty() ? "Draft" : "Live";
    el.className = "adm-state" + (dirty() ? " dirty" : "");
  }

  function pickImage(maxW) {
    return new Promise(function (resolve) {
      var inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*";
      inp.onchange = function () {
        var f = inp.files[0]; if (!f) return resolve(null);
        var r = new FileReader();
        r.onload = function () {
          var img = new Image();
          img.onload = function () {
            var k = Math.min(1, maxW / img.width), cv = document.createElement("canvas");
            cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
            var cx = cv.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(img, 0, 0, cv.width, cv.height);
            resolve(cv.toDataURL("image/jpeg", 0.8));
          };
          img.onerror = function () { S.toast("That file is not a picture."); resolve(null); };
          img.src = r.result;
        };
        r.readAsDataURL(f);
      };
      inp.click();
    });
  }

  // With the online backend, photos go to storage and only their link is kept in the content.
  // Without it (or if upload fails), the resized photo stays inside the content itself.
  function uploadPhoto(dataUrl) {
    if (!S.api.alive) return Promise.resolve(dataUrl);
    S.toast("Uploading photo…");
    return fetch("/api/upload", { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ user: S.adminUser, password: S.adminPass, dataUrl: dataUrl }) })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { if (j && j.url) { S.toast("Photo uploaded."); return j.url; } return dataUrl; }, function () { return dataUrl; });
  }

  /* ---------- field builders ---------- */
  function val(p) { var v = getP(S.content, p); return v == null ? "" : v; }
  function fText(label, p, o) {
    o = o || {};
    return '<div class="af"><label>' + label + '</label><input type="' + (o.type || "text") + '" data-p="' + p + '" value="' + esc(val(p)) + '"' + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : "") + (o.inputmode ? ' inputmode="' + o.inputmode + '"' : "") + '>' + (o.hint ? '<small>' + o.hint + '</small>' : "") + '</div>';
  }
  function fArea(label, p, o) {
    o = o || {};
    var v = o.lines ? (val(p) || []).join("\n") : val(p);
    return '<div class="af"><label>' + label + '</label><textarea data-p="' + p + '"' + (o.lines ? ' data-lines="1"' : "") + ' rows="' + (o.rows || 3) + '">' + esc(v) + '</textarea>' +
      (o.hint ? '<small>' + o.hint + '</small>' : "") +
      (o.ai ? '<div class="ai-row"><span>AI:</span><button type="button" data-ai="improve" data-p="' + p + '">Improve</button><button type="button" data-ai="ml" data-p="' + p + '">മലയാളം</button><button type="button" data-ai="en" data-p="' + p + '">English</button><button type="button" data-ai="short" data-p="' + p + '">Shorter</button></div><div class="ai-out" data-for="' + p + '"></div>' : "") + '</div>';
  }
  function fCheck(label, p) { return '<label class="ck"><input type="checkbox" data-p="' + p + '"' + (getP(S.content, p) ? " checked" : "") + '> ' + label + '</label>'; }
  function fSelect(label, p, opts) {
    var cur = String(val(p));
    return '<div class="af"><label>' + label + '</label><select data-p="' + p + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === cur ? " selected" : "") + '>' + esc(o[1]) + '</option>'; }).join("") + '</select></div>';
  }
  function fImage(label, p) {
    var v = val(p);
    return '<div class="af"><label>' + label + '</label><div class="imgf">' + (v ? '<img src="' + esc(v) + '" alt="">' : '<span class="noimg">No photo</span>') +
      '<div><button type="button" class="btn btn-sm" data-act="img" data-p="' + p + '">' + (v ? "Change photo" : "Upload photo") + '</button>' +
      (v ? ' <button type="button" class="btn btn-sm btn-ghost" data-act="imgdel" data-p="' + p + '">Remove</button>' : "") + '</div></div></div>';
  }
  var iconOpts = function () { return window.icon.names.map(function (n) { return [n, n]; }); };

  function listEditor(path, o) {
    var arr = getP(S.content, path) || [];
    var html = arr.map(function (item, i) {
      var title = o.title ? (item[o.title] || o.noun + " " + (i + 1)) : o.noun + " " + (i + 1);
      return '<details class="li"' + (o.open ? " open" : "") + '><summary><span>' + esc(String(title).slice(0, 48)) + '</span>' +
        '<span class="li-act"><button type="button" data-act="up" data-path="' + path + '" data-i="' + i + '" aria-label="Move up"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg></button><button type="button" data-act="down" data-path="' + path + '" data-i="' + i + '" aria-label="Move down"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button><button type="button" data-act="del" data-path="' + path + '" data-i="' + i + '" aria-label="Delete"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></span></summary>' +
        '<div class="li-body">' + o.fields(path + "." + i, item) + '</div></details>';
    }).join("");
    return '<div class="lst">' + (html || '<p class="muted">Nothing here yet.</p>') + '</div><button type="button" class="btn btn-sm" data-act="add" data-path="' + path + '">+ Add ' + o.noun + '</button>';
  }

  var LISTS = {
    news: { noun: "update", title: "title", fields: function (b) {
      return fText("Date", b + ".date", { type: "date" }) + fText("Headline", b + ".title", { ph: "Short headline for the scrolling bar" }) +
        fArea("Details (optional)", b + ".text", { ai: true }) + fText("Link (optional)", b + ".link", { ph: "https://" }) +
        fCheck("Pin to top", b + ".pin") + fCheck("Show on the site", b + ".show"); },
      blank: function () { return { date: new Date().toISOString().slice(0, 10), title: "", text: "", link: "", pin: false, show: true }; } },
    departments: { noun: "department", title: "name", fields: function (b) {
      return fText("Name", b + ".name") + fArea("Short description (shown when tapped, optional)", b + ".text", { rows: 2, ai: true }) + fSelect("Icon", b + ".icon", iconOpts()) + fCheck("Emergency: show a Call button instead of Book", b + ".call"); },
      blank: function () { return { id: uid("dept"), name: "New department", icon: "steth" }; } },
    services: { noun: "service", title: "name", fields: function (b) {
      return fText("Name", b + ".name") + fArea("Short text", b + ".text", { rows: 2, ai: true }) + fSelect("Icon", b + ".icon", iconOpts()); },
      blank: function () { return { icon: "pill", name: "New service", text: "" }; } },
    why: { noun: "point", title: "title", fields: function (b) {
      return fText("Title", b + ".title") + fArea("Text", b + ".text", { rows: 2, ai: true }); },
      blank: function () { return { icon: "check", title: "New point", text: "" }; } },
    people: { noun: "person", title: "name", fields: function (b) {
      return fText("Name", b + ".name") + fText("Role", b + ".role") + fImage("Photo", b + ".photo"); },
      blank: function () { return { name: "New person", role: "", photo: "" }; } },
    faqs: { noun: "question", title: "q", fields: function (b) {
      return fText("Question", b + ".q") + fArea("Answer", b + ".a", { ai: true }); },
      blank: function () { return { q: "New question", a: "" }; } },
    reviews: { noun: "review", title: "name", fields: function (b) {
      return fText("Patient name", b + ".name") + fText("Place", b + ".place") +
        fSelect("Stars", b + ".rating", [[5, "5 stars"], [4, "4 stars"], [3, "3 stars"], [2, "2 stars"], [1, "1 star"]]) +
        fArea("Review", b + ".text", { ai: false }); },
      blank: function () { return { name: "", place: "", rating: 5, text: "" }; } },
    events: { noun: "event photo", title: "title", fields: function (b) {
      return fImage("Photo", b + ".image") + fText("Heading", b + ".title", { ph: "e.g. Free diabetes camp" }) + fArea("Short brief (shown under the photo)", b + ".text", { rows: 3, ai: true }); },
      blank: function () { return { image: "", title: "", text: "" }; } },
    gallery: { noun: "photo", title: "caption", fields: function (b) { return fImage("Photo", b + ".image") + fText("Caption", b + ".caption"); },
      blank: function () { return { image: "", caption: "" }; } }
  };
  function lst(path, extra) { var o = LISTS[path]; return listEditor(path, { noun: o.noun, title: o.title, fields: o.fields, open: extra && extra.open }); }

  /* ---------- tabs ---------- */
  var TABS = [
    ["general", "General"], ["home", "Home page"], ["news", "Updates"], ["events", "Events"], ["departments", "Departments"], ["services", "Services"],
    ["about", "About"], ["team", "Team"], ["faq", "FAQ"], ["reviews", "Reviews"], ["gallery", "Gallery"],
    ["booking", "Booking"], ["look", "Look"], ["ai", "AI"], ["publish", "Publish"]
  ];
  var PANES = {
    general: function () {
      return '<h3>Hospital details</h3>' + fText("Hospital name", "name") + fText("Short name (header)", "shortName") + fText("Company", "company") + fText("Tagline", "tagline") +
        fText("Phone", "phone", { type: "tel" }) + fText("Second phone", "phone2", { type: "tel" }) + fText("Email", "email", { type: "email" }) + fText("Website", "website") +
        fArea("Address", "address", { rows: 2 }) + fText("Timings line", "hours", { hint: "Shown at the top and in Contact. Leave empty to hide." }) +
        fText("Google Maps link for Directions", "directions") + fText("Map embed link (optional)", "mapEmbed", { hint: "Google Maps → Share → Embed a map → copy the src link." });
    },
    home: function () {
      return '<h3>Top of the home page</h3>' + fText("Small heading", "hero.eyebrow") + fArea("Main headline", "hero.title", { rows: 2, ai: true }) +
        fText("Highlighted line", "hero.accent") + fArea("Intro text", "hero.lead", { rows: 3, ai: true }) + fImage("Main photo", "hero.image");
    },
    news: function () {
      return '<h3>Updates and news</h3><p class="muted">These scroll in the bar under the header and appear in the Latest updates section.</p>' + lst("news", { open: true }) +
        '<div class="ainews"><b>Write an update with AI</b><p class="muted">Type a rough note, for example: "Free diabetes camp on Sunday 10 am".</p><textarea id="ai-note" rows="2" placeholder="Your note"></textarea><button type="button" class="btn btn-sm" data-act="ainews">✨ Write update</button><div class="ai-out" id="ai-news-out"></div></div>';
    },
    events: function () { return '<h3>Events slider</h3><p class="muted">These photos slide under the top of the home page. Add a photo with Upload, write a heading and a short brief, and it shows on the site after you press Publish. Remove old photos any time. The section hides itself when the list is empty.</p>' + lst("events", { open: true }); },
    departments: function () { return '<h3>Departments</h3><p class="muted">Drag order with the arrows. These also appear in the booking form.</p>' + lst("departments"); },
    services: function () { return '<h3>Services &amp; facilities</h3>' + lst("services") + '<h3 class="sp">Why choose us</h3>' + lst("why"); },
    about: function () {
      return '<h3>About us</h3>' + fArea("First paragraph", "about.p1", { rows: 4, ai: true }) + fArea("Second paragraph", "about.p2", { rows: 3, ai: true }) + fImage("Photo", "about.image") +
        fArea("Vision", "vision", { rows: 3, ai: true }) + fArea("Mission (one point per line)", "mission", { rows: 6, lines: true });
    },
    team: function () { return '<h3>Leadership</h3>' + lst("people"); },
    faq: function () { return '<h3>Common questions</h3>' + lst("faqs"); },
    reviews: function () { return '<h3>Patient reviews</h3><p class="muted">Add only real reviews, with the patient\'s permission. The section stays hidden while this list is empty.</p>' + lst("reviews"); },
    gallery: function () { return '<h3>Photo gallery</h3><p class="muted">The gallery section appears once you add a photo.</p>' + lst("gallery"); },
    booking: function () {
      var cl = S.content.closedWeekdays || [], names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return '<h3>Booking</h3>' + fText("WhatsApp number for bookings", "whatsapp", { inputmode: "numeric", hint: "Country code and number, digits only. Example: 918086655666" }) +
        fArea("Time slots (one per line)", "timeSlots", { rows: 8, lines: true, hint: "Write like 09:00 AM or 02:30 PM." }) +
        fText("How many days ahead patients can book", "daysAhead", { type: "number" }) +
        '<div class="af"><label>Days with no booking</label><div class="days">' + names.map(function (n, i) {
          return '<label class="ck"><input type="checkbox" data-day="' + i + '"' + (cl.indexOf(i) > -1 ? " checked" : "") + '> ' + n + '</label>'; }).join("") + '</div></div>' +
        '<p class="muted">Test it: close the editor, tap Book appointment and send yourself a request.</p>';
    },
    look: function () {
      var t = S.content.theme || {};
      return '<h3>Colours</h3><div class="af"><label>Main colour</label><input type="color" data-p="theme.primary" value="' + esc(t.primary || "#173866") + '"></div>' +
        '<div class="af"><label>Accent colour</label><input type="color" data-p="theme.accent" value="' + esc(t.accent || "#00a796") + '"></div>' +
        '<button type="button" class="btn btn-sm btn-ghost" data-act="theme-reset">Back to logo colours</button>';
    },
    ai: function () {
      var on = S.api.alive;
      return '<h3>AI assistant</h3><p class="status ' + (on ? "ok" : "off") + '">' + (on ? "AI is connected." : "AI is not connected yet.") + '</p>' +
        (on ? "" : '<p class="muted">AI needs the site hosted on Vercel (or Netlify) with the included backend and a Claude API key. Steps are in README-ADMIN.md. Until then every other editing feature works.</p>') +
        '<div class="af"><label>Tell the AI what to change</label><textarea id="ai-inst" rows="4" placeholder="Examples:\n• Make the headline shorter and friendlier\n• Add a FAQ about visiting hours\n• Rewrite the about text in simple words"></textarea></div>' +
        '<button type="button" class="btn" data-act="airun">✨ Suggest changes</button><div class="ai-out big" id="ai-edit-out"></div>' +
        '<p class="muted sp">You always see the changes first and choose whether to apply them. Photos are never changed by the AI.</p>';
    },
    publish: function () {
      var on = S.api.alive;
      return '<h3>Publish</h3><p class="status ' + (dirty() ? "off" : "ok") + '">' + (dirty() ? "You have changes that visitors cannot see yet." : "Visitors see the latest version.") + '</p>' +
        (on ? '<p class="muted">Tap Publish to update the live site for everyone.</p><button type="button" class="btn" data-act="publish">Publish to the live site</button>'
          : '<p class="muted">This site has no online backend yet, so changes are saved in this browser only. To make them live: tap <b>Download content.json</b>, put that file in the website folder next to index.html (replace the old one), and upload the site again.</p><button type="button" class="btn" data-act="download">Download content.json</button>') +
        '<hr><button type="button" class="btn btn-ghost" data-act="discard">Discard my unpublished changes</button> <button type="button" class="btn btn-ghost" data-act="logout">Log out</button>';
    }
  };

  /* ---------- build / render ---------- */
  function build() {
    root.innerHTML = '<div class="adm" id="adm" role="dialog" aria-modal="true" aria-label="Site editor" hidden>' +
      '<div class="adm-bar"><b>Site editor</b><span class="adm-state" id="adm-state"></span><button type="button" class="btn btn-sm" data-act="publishtab">Publish</button><button type="button" class="x" id="adm-close" aria-label="Close editor">×</button></div>' +
      '<div class="adm-tabs" role="tablist">' + TABS.map(function (t) { return '<button type="button" role="tab" data-tab="' + t[0] + '">' + t[1] + '</button>'; }).join("") + '</div>' +
      '<div class="adm-body" id="adm-body"></div></div>';
    $("#adm-close").addEventListener("click", close);
    $(".adm-tabs", root).addEventListener("click", function (e) { var b = e.target.closest("[data-tab]"); if (b) { tab = b.dataset.tab; draw(); } });
    var body = $("#adm-body");
    body.addEventListener("input", onInput); body.addEventListener("change", onInput);
    body.addEventListener("click", onClick);
    root.addEventListener("click", function (e) { if (e.target.closest('[data-act="publishtab"]')) { tab = "publish"; draw(); } });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("#adm").hidden && !document.querySelector("dialog[open]")) close(); });
    built = true;
  }
  function draw(keepScroll) {
    var body = $("#adm-body"), y = keepScroll ? body.scrollTop : 0;
    body.innerHTML = PANES[tab]();
    body.scrollTop = y;
    $$tabs().forEach(function (b) { var on = b.dataset.tab === tab; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); });
    state();
  }
  function $$tabs() { return [].slice.call(root.querySelectorAll("[data-tab]")); }
  function open() {
    if (!built) build();
    var a = $("#adm"); a.hidden = false; document.body.classList.add("adm-open"); draw();
    var cur = root.querySelector('[data-tab="' + tab + '"]'); if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: "nearest", inline: "center" });
  }
  function close() { $("#adm").hidden = true; document.body.classList.remove("adm-open"); S.updateFab(); }

  /* ---------- events ---------- */
  function onInput(e) {
    var t = e.target;
    if (t.dataset.day !== undefined) {
      var d = +t.dataset.day, cl = (S.content.closedWeekdays || []).filter(function (x) { return x !== d; });
      if (t.checked) cl.push(d); S.content.closedWeekdays = cl.sort(); commit(); return;
    }
    var p = t.dataset.p; if (!p) return;
    var v;
    if (t.type === "checkbox") v = t.checked;
    else if (t.type === "number") v = t.value === "" ? "" : +t.value;
    else if (t.dataset.lines) v = t.value.split("\n").map(function (x) { return x.trim(); }).filter(Boolean);
    else if (t.tagName === "SELECT" && /\.rating$/.test(p)) v = +t.value;
    else v = t.value;
    setP(S.content, p, v);
    if (t.tagName === "SELECT" && /\.icon$/.test(p)) { /* icon preview not needed */ }
    commit();
  }

  function onClick(e) {
    var b = e.target.closest("[data-act],[data-ai]"); if (!b) return;
    var act = b.dataset.act;
    if (b.dataset.ai) return aiField(b);
    var path = b.dataset.path, i = +b.dataset.i, arr;
    if (act === "add") {
      arr = getP(S.content, path); arr.push(LISTS[path].blank()); commit(); draw(true);
      var items = $("#adm-body").querySelectorAll(".li"); var last = items[items.length - 1]; if (last) { last.open = true; last.scrollIntoView({ block: "center" }); }
    } else if (act === "del") {
      if (!window.confirm("Delete this item?")) return;
      getP(S.content, path).splice(i, 1); commit(); draw(true);
    } else if (act === "up" || act === "down") {
      arr = getP(S.content, path); var j = act === "up" ? i - 1 : i + 1;
      if (j < 0 || j >= arr.length) return;
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp; commit(); draw(true);
    } else if (act === "img") {
      var target = b.dataset.p;
      pickImage(1200).then(function (url) {
        if (!url) return;
        return uploadPhoto(url).then(function (finalUrl) { setP(S.content, target, finalUrl); commit(); draw(true); });
      });
    } else if (act === "imgdel") {
      setP(S.content, b.dataset.p, ""); commit(); draw(true);
    } else if (act === "theme-reset") {
      S.content.theme = { primary: "#173866", accent: "#00a796" }; commit(); draw(true);
    } else if (act === "publish") publish();
    else if (act === "download") download();
    else if (act === "discard") discard();
    else if (act === "logout") { close(); S.logout(); }
    else if (act === "airun") aiEdit();
    else if (act === "ainews") aiNews();
    else if (act === "aiuse") useAI(b);
  }

  /* ---------- publish ---------- */
  function publish() {
    S.toast("Publishing…");
    fetch(S.api.content, { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ user: S.adminUser, password: S.adminPass, content: S.content }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || "Could not publish"); }); })
      .then(function () { S.published = S.clone(S.content); S.store.del(S.draftKey); S.toast("Published. Visitors now see this version."); draw(true); },
        function (err) { S.toast(err.message || "Could not publish. Try again."); });
  }
  function download() {
    var blob = new Blob([JSON.stringify(S.content, null, 1)], { type: "application/json" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "content.json";
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    S.toast("Downloaded. Put it next to index.html and upload the site.");
  }
  function discard() {
    if (!window.confirm("Discard all unpublished changes?")) return;
    S.store.del(S.draftKey); S.reloadPublished(); draw(true); S.toast("Changes discarded.");
  }

  /* ---------- AI ---------- */
  function call(task, payload) {
    if (!S.api.alive) return Promise.reject(new Error("AI is not connected yet. Open the AI tab to see how to switch it on."));
    var body = { user: S.adminUser, password: S.adminPass, task: task };
    Object.keys(payload).forEach(function (k) { body[k] = payload[k]; });
    return fetch(S.api.ai, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || "AI request failed"); return j; }); });
  }
  function outFor(el, html) { el.innerHTML = html; }
  function aiField(b) {
    var p = b.dataset.p, text = String(getP(S.content, p) || "");
    var box = $('.ai-out[data-for="' + p + '"]'); if (!text.trim()) { S.toast("Write something first."); return; }
    outFor(box, '<span class="muted">Thinking…</span>');
    call(b.dataset.ai, { text: text }).then(function (j) {
      outFor(box, '<div class="ai-res">' + esc(j.text) + '</div><button type="button" class="btn btn-sm" data-act="aiuse" data-p="' + p + '">Use this</button> <button type="button" class="btn btn-sm btn-ghost" onclick="this.closest(\'.ai-out\').innerHTML=\'\'">Dismiss</button>');
      box.dataset.result = j.text;
    }, function (err) { outFor(box, '<span class="error">' + esc(err.message) + '</span>'); });
  }
  function useAI(b) {
    var p = b.dataset.p, box = $('.ai-out[data-for="' + p + '"]'); if (!box || !box.dataset.result) return;
    var cur = getP(S.content, p);
    setP(S.content, p, Array.isArray(cur) ? box.dataset.result.split("\n").filter(Boolean) : box.dataset.result);
    commit(); draw(true); S.toast("Applied.");
  }
  function aiNews() {
    var note = $("#ai-note").value.trim(), out = $("#ai-news-out"); if (!note) { S.toast("Type a note first."); return; }
    out.innerHTML = '<span class="muted">Writing…</span>';
    call("write_news", { text: note }).then(function (j) {
      S.content.news.unshift({ date: new Date().toISOString().slice(0, 10), title: j.title || "", text: j.text || "", link: "", pin: false, show: true });
      commit(); draw(true); S.toast("Update added at the top. Review it below.");
    }, function (err) { out.innerHTML = '<span class="error">' + esc(err.message) + '</span>'; });
  }
  var pending = null;
  function stripImages(o) {
    return JSON.parse(JSON.stringify(o, function (k, v) { return typeof v === "string" && v.indexOf("data:") === 0 ? "[photo]" : v; }));
  }
  function aiEdit() {
    var inst = $("#ai-inst").value.trim(), out = $("#ai-edit-out"); if (!inst) { S.toast("Write what you want changed."); return; }
    out.innerHTML = '<span class="muted">Thinking…</span>';
    call("edit_site", { instruction: inst, content: stripImages(S.content) }).then(function (j) {
      var patch = j.patch || {}; ["whatsapp"].forEach(function () {});
      var clean = (function strip(o) { if (!o || typeof o !== "object") return o; if (Array.isArray(o)) return o.map(strip); var r = {}; Object.keys(o).forEach(function (k) { if (k === "image" || k === "photo") return; r[k] = strip(o[k]); }); return r; })(patch);
      var keys = Object.keys(clean); if (!keys.length) { out.innerHTML = '<span class="muted">The AI had no changes to suggest.</span>'; return; }
      pending = clean;
      out.innerHTML = '<p><b>Suggested changes</b></p><ul class="diff">' + keys.map(function (k) { return '<li><b>' + esc(k) + '</b><br><span>' + esc(JSON.stringify(clean[k]).slice(0, 260)) + '</span></li>'; }).join("") + '</ul>' +
        '<button type="button" class="btn btn-sm" data-act="aiapply">Apply these changes</button> <button type="button" class="btn btn-sm btn-ghost" data-act="aicancel">Cancel</button>';
    }, function (err) { out.innerHTML = '<span class="error">' + esc(err.message) + '</span>'; });
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest('[data-act="aiapply"],[data-act="aicancel"]'); if (!b || !pending) return;
    if (b.dataset.act === "aiapply") {
      var m = S.merge(S.content, pending); S.content = m; pending = null; commit(); draw(true); S.toast("Changes applied. You can undo with Discard on the Publish tab.");
    } else { pending = null; $("#ai-edit-out").innerHTML = ""; }
  });

  window.Admin = { open: open, close: close };
})();
