// ZEKO Tools — demo storefront. All state (cart) lives in localStorage; there is no backend.

const PRODUCTS = [
  {
    id: "drop-sheet",
    name: "Heavy-Duty Drop Sheet",
    spec: "4 MTR x 8 MTR (32 m²) · 500 GSM premium surface protection",
    price: 349,
    was: 429,
    category: "protection",
    badge: "Bestseller",
    image: "images/drop-sheet.jpg",
  },
  {
    id: "poly-roll-compact",
    name: "Polythene Roll — Compact Pack",
    spec: "3 MTR x 25 MTR · 300 grams · easy-carry job-bag size",
    price: 279,
    category: "protection",
    image: "images/polythene-roll.jpg",
  },
  {
    id: "poly-roll-trade",
    name: "Polythene Roll — Trade Roll",
    spec: "5 MTR x 30 MTR · 500 grams · for larger surface coverage",
    price: 399,
    category: "protection",
    badge: "New",
    image: "images/polythene-roll-large.jpg",
  },
  {
    id: "putty-knife",
    name: "Multi-Tool Paint Scraper",
    spec: "Stainless steel blade with nail-puller notch, soft-grip handle",
    price: 199,
    category: "tools",
    image: "images/putty-knife.jpg",
  },
  {
    id: "paint-tray",
    name: "Z-Grip Paint Tray",
    spec: "Deep-well roller tray with ribbed load-off ramp",
    price: 229,
    category: "tools",
    image: "images/paint-tray.jpg",
  },
  {
    id: "roller",
    name: "Professional Paint Roller",
    spec: "9-inch cage frame with contoured non-slip handle",
    price: 249,
    category: "tools",
    image: "images/roller.jpg",
  },
  {
    id: "extension-pole",
    name: "Roller Extension Pole",
    spec: "Threaded handle extension for ceilings and high walls",
    price: 329,
    category: "tools",
    image: "images/extension-pole.jpg",
  },
  {
    id: "masking-tape",
    name: "Painter's Masking Tape — Twin Pack",
    spec: "Clean-release crepe tape for sharp, straight edges",
    price: 149,
    category: "tape",
    image: "images/masking-tape.jpg",
  },
  {
    id: "pro-kit",
    name: "Complete Pro Tool Kit",
    spec: "Scraper, tray, roller, extension pole, trade poly roll & tape",
    price: 1199,
    was: 1489,
    category: "kits",
    badge: "Best Value",
    image: "images/tool-kit.jpg",
  },
];

const CART_KEY = "zeko-demo-cart";
const money = (n) => `₹${n.toLocaleString("en-IN")}`;

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || {};
  } catch {
    return {};
  }
}
function saveCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    /* private browsing / storage disabled — cart just won't persist */
  }
}

let cart = loadCart();

const grid = document.getElementById("product-grid");
const cartToggle = document.getElementById("cart-toggle");
const cartClose = document.getElementById("cart-close");
const cartDrawer = document.getElementById("cart-drawer");
const drawerOverlay = document.getElementById("drawer-overlay");
const cartItemsEl = document.getElementById("cart-items");
const cartEmptyEl = document.getElementById("cart-empty");
const cartFooterEl = document.getElementById("cart-footer");
const cartSubtotalEl = document.getElementById("cart-subtotal-amount");
const cartCountEl = document.getElementById("cart-count");
const toastEl = document.getElementById("toast");
const modalOverlay = document.getElementById("modal-overlay");

function renderProducts(filter = "all") {
  const items = filter === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.category === filter);
  grid.innerHTML = items
    .map(
      (p) => `
    <article class="product-card" data-id="${p.id}">
      <div class="product-media">
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ""}
        <img src="${p.image}" alt="${p.name}" loading="lazy">
      </div>
      <div class="product-body">
        <h3 class="product-name">${p.name}</h3>
        <p class="product-spec">${p.spec}</p>
        <div class="product-footer">
          <div class="product-price">
            <span class="price-now">${money(p.price)}</span>
            ${p.was ? `<span class="price-was">${money(p.was)}</span>` : ""}
          </div>
          <button class="add-btn" data-add="${p.id}">Add to cart</button>
        </div>
      </div>
    </article>`
    )
    .join("");
}

function renderCart() {
  const ids = Object.keys(cart);
  const totalQty = ids.reduce((sum, id) => sum + cart[id], 0);

  if (totalQty > 0) {
    cartCountEl.hidden = false;
    cartCountEl.textContent = totalQty;
  } else {
    cartCountEl.hidden = true;
  }

  if (ids.length === 0) {
    cartItemsEl.innerHTML = "";
    cartEmptyEl.hidden = false;
    cartFooterEl.hidden = true;
    return;
  }

  cartEmptyEl.hidden = true;
  cartFooterEl.hidden = false;

  let subtotal = 0;
  cartItemsEl.innerHTML = ids
    .map((id) => {
      const p = PRODUCTS.find((prod) => prod.id === id);
      if (!p) return "";
      const qty = cart[id];
      subtotal += p.price * qty;
      return `
      <div class="cart-line" data-id="${p.id}">
        <img src="${p.image}" alt="${p.name}">
        <div class="cart-line-info">
          <p class="cart-line-name">${p.name}</p>
          <span class="cart-line-price">${money(p.price)} each</span>
          <div class="cart-line-actions">
            <div class="qty-stepper">
              <button data-step="-1" aria-label="Decrease quantity">−</button>
              <span>${qty}</span>
              <button data-step="1" aria-label="Increase quantity">+</button>
            </div>
            <button class="remove-line" data-remove="${p.id}">Remove</button>
          </div>
        </div>
      </div>`;
    })
    .join("");

  cartSubtotalEl.textContent = money(subtotal);
}

function addToCart(id, btn) {
  cart[id] = (cart[id] || 0) + 1;
  saveCart(cart);
  renderCart();
  showToast("Added to cart");
  if (btn) {
    const original = btn.textContent;
    btn.textContent = "Added ✓";
    btn.classList.add("is-added");
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove("is-added");
    }, 1200);
  }
}

function changeQty(id, delta) {
  if (!cart[id]) return;
  cart[id] += delta;
  if (cart[id] <= 0) delete cart[id];
  saveCart(cart);
  renderCart();
}

function removeFromCart(id) {
  delete cart[id];
  saveCart(cart);
  renderCart();
}

let toastTimer;
function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 1800);
}

function openCart() {
  drawerOverlay.hidden = false;
  cartDrawer.hidden = false;
}
function closeCart() {
  drawerOverlay.hidden = true;
  cartDrawer.hidden = true;
}

function openModal() {
  modalOverlay.hidden = false;
}
function closeModal() {
  modalOverlay.hidden = true;
}

// ---- events ----
grid.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-add]");
  if (btn) addToCart(btn.dataset.add, btn);
});

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

cartToggle.addEventListener("click", openCart);
cartClose.addEventListener("click", closeCart);
drawerOverlay.addEventListener("click", closeCart);
document.getElementById("cart-empty-shop").addEventListener("click", closeCart);

cartItemsEl.addEventListener("click", (e) => {
  const stepBtn = e.target.closest("[data-step]");
  const removeBtn = e.target.closest("[data-remove]");
  if (stepBtn) {
    const id = stepBtn.closest(".cart-line").dataset.id;
    changeQty(id, Number(stepBtn.dataset.step));
  } else if (removeBtn) {
    removeFromCart(removeBtn.dataset.remove);
  }
});

document.getElementById("checkout-btn").addEventListener("click", () => {
  openModal();
});
document.getElementById("modal-ok").addEventListener("click", closeModal);
document.getElementById("modal-close").addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!modalOverlay.hidden) closeModal();
  else if (!cartDrawer.hidden) closeCart();
});

document.getElementById("year").textContent = new Date().getFullYear();

renderProducts();
renderCart();
