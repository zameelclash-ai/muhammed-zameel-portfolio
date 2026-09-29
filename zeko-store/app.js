// ZEKO Tools — brand site. Static content, no backend, no cart.

const PRODUCTS = [
  {
    id: "drop-sheet",
    name: "Heavy-Duty Drop Sheet",
    spec: "4 MTR x 8 MTR (32 m²) · 500 GSM",
    category: "protection",
    image: "images/drop-sheet.jpg",
  },
  {
    id: "poly-roll-compact",
    name: "Polythene Roll — Compact Pack",
    spec: "3 MTR x 25 MTR · 300 grams",
    category: "protection",
    image: "images/polythene-roll.jpg",
  },
  {
    id: "poly-roll-trade",
    name: "Polythene Roll — Trade Roll",
    spec: "5 MTR x 30 MTR · 500 grams",
    category: "protection",
    image: "images/polythene-roll-large.jpg",
  },
  {
    id: "putty-knife",
    name: "Multi-Tool Paint Scraper",
    spec: "Stainless blade · nail-puller notch",
    category: "tools",
    image: "images/putty-knife.jpg",
  },
  {
    id: "paint-tray",
    name: "Z-Grip Paint Tray",
    spec: "Deep-well tray · ribbed load-off ramp",
    category: "tools",
    image: "images/paint-tray.jpg",
  },
  {
    id: "roller",
    name: "Professional Paint Roller",
    spec: "9-inch cage frame · non-slip handle",
    category: "tools",
    image: "images/roller.jpg",
  },
  {
    id: "extension-pole",
    name: "Roller Extension Pole",
    spec: "Threaded handle extension",
    category: "tools",
    image: "images/extension-pole.jpg",
  },
  {
    id: "masking-tape",
    name: "Painter's Masking Tape — Twin Pack",
    spec: "Clean-release crepe tape",
    category: "tape",
    image: "images/masking-tape.jpg",
  },
  {
    id: "pro-kit",
    name: "Complete Pro Tool Kit",
    spec: "Scraper, tray, roller, pole, roll &amp; tape",
    category: "kits",
    image: "images/tool-kit.jpg",
  },
];

const grid = document.getElementById("product-grid");

function renderProducts(filter = "all") {
  const items = filter === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.category === filter);
  grid.innerHTML = items
    .map(
      (p) => `
    <article class="product-card reveal is-visible">
      <div class="product-media">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
      </div>
      <div class="product-body">
        <h3 class="product-name">${p.name}</h3>
        <p class="product-spec">${p.spec}</p>
      </div>
    </article>`
    )
    .join("");
}

document.querySelectorAll(".filter-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".filter-chip").forEach((c) => {
      c.classList.remove("is-active");
      c.setAttribute("aria-selected", "false");
    });
    chip.classList.add("is-active");
    chip.setAttribute("aria-selected", "true");
    renderProducts(chip.dataset.filter);
  });
});

// ---- mobile nav ----
const navToggle = document.getElementById("nav-toggle");
const mobileMenu = document.getElementById("mobile-menu");
navToggle.addEventListener("click", () => {
  const open = navToggle.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(open));
  mobileMenu.hidden = !open;
});
mobileMenu.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    navToggle.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    mobileMenu.hidden = true;
  }
});

// ---- scroll reveal ----
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function setUpReveal() {
  const targets = document.querySelectorAll(".reveal");
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  targets.forEach((el) => observer.observe(el));
}

document.getElementById("year").textContent = new Date().getFullYear();

renderProducts();
setUpReveal();
