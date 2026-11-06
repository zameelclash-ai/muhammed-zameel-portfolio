/* Scroll motion and navigation state. Hidden start states exist only when motion is allowed (html.motion),
   so the page always reads fully without motion. Only transform and opacity are animated. */
(function () {
  "use strict";
  var S = window.Site; if (!S) return;
  var $ = S.$, $$ = S.$$, motion = S.motion;
  var seen = (typeof WeakSet !== "undefined") ? new WeakSet() : { has: function () { return false; }, add: function () {} };
  var io = null;
  if (motion) document.documentElement.classList.add("motion");
  if (motion && "IntersectionObserver" in window) {
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  }
  var BLOCKS = ".sec-head,.about-text,.about-photo,.acc,.infonote,.cta-band .wrap,.contact>div,.searchbox";
  var ITEMS = ".dept,.svc-item,.why li,.person,.news-item,.gal figure,.review,#faq-list details";
  function add(el, delay) {
    if (!io || seen.has(el)) return; seen.add(el);
    el.classList.add("sr"); el.style.setProperty("--d", delay + "ms"); io.observe(el);
  }
  function scan() {
    if (!io) return;
    $$(BLOCKS).forEach(function (el) { add(el, 0); });
    $$(ITEMS).forEach(function (el) {
      var i = Array.prototype.indexOf.call(el.parentNode.children, el);
      add(el, (i % 4) * 70);
    });
  }

  /* headline: words rise in one by one, once */
  var introDone = false;
  function splitWords(el, start) {
    var words = el.textContent.split(/\s+/).filter(Boolean);
    el.innerHTML = words.map(function (w, i) {
      return '<span class="w"><span style="--wd:' + (0.15 + (start + i) * 0.07).toFixed(2) + 's">' + S.esc(w) + '</span></span>';
    }).join(" ");
    return words.length;
  }
  function hero() {
    if (!motion) return;
    var t = $("#h-title"), a = $("#h-accent"), h = $(".hero"); if (!t || !a) return;
    var n = splitWords(t, 0); splitWords(a, n);
    if (!introDone) {
      introDone = true; h.classList.add("intro");
      setTimeout(function () { h.classList.remove("intro"); }, 2600);
    }
  }

  /* scroll state: progress bar, glass header, active tab */
  var bar = $("#progress"), header = $(".header"), ticking = false;
  var ORDER = ["home", "departments", "services", "updates", "about", "why", "gallery", "leadership", "reviews", "faq", "contact"];
  function activeId() {
    var cur = "home", line = window.innerHeight * 0.38;
    ORDER.forEach(function (id) { var el = document.getElementById(id); if (el && !el.hidden && el.getBoundingClientRect().top <= line) cur = id; });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = "contact";
    return cur;
  }
  var heroBg = $(".hero-bg"), heroEl = $(".hero");
  function onScroll() {
    ticking = false;
    if (motion && heroBg) { var hy = Math.min(window.scrollY, heroEl.offsetHeight); heroBg.style.transform = "translate3d(0," + (hy * 0.28).toFixed(1) + "px,0)"; }
    var y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0) + ")";
    header.classList.toggle("scrolled", y > 6);
    var id = activeId();
    $$(".navpill a").forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + id); });
    $$(".tabbar [data-nav]").forEach(function (a) { a.classList.toggle("active", a.dataset.nav === id); });
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener("resize", onScroll);

  var prev = S.onRender;
  S.onRender = function () { if (prev) prev(); hero(); scan(); onScroll(); };
  hero(); scan(); onScroll();
})();
