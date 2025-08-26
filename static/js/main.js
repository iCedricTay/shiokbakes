/* ShiokBakes main.js — custom-domain friendly (shiokbakes.com):
   - cart badge
   - “Items added” buttons
   - working Products link + dropdown
   - My Orders requires sign-in
   - absolute icon paths (/static/…)
*/

(function () {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const fmt = n => `$${Number(n).toFixed(2)}`;

  const USER_KEY = "sb_user";
  const CART_KEY = "sb_cart";

  // ----- Auth (localStorage only) -----
  const Auth = {
    get user() {
      try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } catch { return null; }
    },
    login(username) {
      localStorage.setItem(USER_KEY, JSON.stringify({ username }));
      renderAuthUI();
    },
    logout() {
      localStorage.removeItem(USER_KEY);
      renderAuthUI();
    }
  };
  window.SB = window.SB || {};
  window.SB.Auth = Auth;

  // ----- Cart helpers -----
  function readCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch { return []; }
  }
  function writeCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    updateCartBadge();
  }
  function updateCartBadge() {
    const badge = $("#cartCount");
    if (!badge) return;
    const count = readCart().length;
    if (count > 0) {
      badge.textContent = String(count);
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  }
  window.SB.updateCartBadge = updateCartBadge;

  // ----- Header (search + auth + dropdown a11y) -----
  function initHeader() {
    const openSearch = $("#openSearch");
    const pop = $("#searchPop");
    const cancel = $("#searchCancel");
    const go = $("#searchGo");
    const input = $("#searchInput");

    if (openSearch && pop) {
      const show = () => pop.setAttribute("aria-hidden", "false");
      const hide = () => pop.setAttribute("aria-hidden", "true");

      openSearch.addEventListener("click", () => {
        const hidden = pop.getAttribute("aria-hidden") !== "false";
        hidden ? show() : hide();
        input?.focus();
      });
      cancel?.addEventListener("click", hide);
      go?.addEventListener("click", () => {
        const q = (input?.value || "").trim().toLowerCase();
        hide();
        if (!q) return;
        // demo search
        alert(`Searching for: ${q}`);
      });
    }

    // Auth button
    $("#logoutBtn")?.addEventListener("click", () => {
      const user = Auth.user;
      if (user) {
        if (confirm("Sign out now?")) Auth.logout();
      } else {
        window.location.href = "account.html";
      }
    });

    renderAuthUI();
    updateCartBadge();

    // Guard My Orders in nav: require sign-in
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href') || "";
      if (href.endsWith("myorders.html") && !Auth.user) {
        e.preventDefault();
        if (confirm("Please sign in to view My Orders. Go to Account page now?")) {
          window.location.href = "account.html?next=myorders";
        }
      }
    });
  }

  function renderAuthUI() {
    const user = Auth.user;
    const userBadge = $("#userBadge");
    const authIcon = $("#authIcon");

    if (user) {
      userBadge && (userBadge.textContent = user.username);
      authIcon?.setAttribute("src", "/static/images/icons/out.svg");
      authIcon?.setAttribute("alt", "Sign out");
      $("#logoutBtn")?.setAttribute("aria-label", "Sign out");
    } else {
      userBadge && (userBadge.textContent = "");
      authIcon?.setAttribute("src", "/static/images/icons/in.svg");
      authIcon?.setAttribute("alt", "Sign in");
      $("#logoutBtn")?.setAttribute("aria-label", "Sign in");
    }
  }

  // ----- Product pricing per card (runs only where cards exist) -----
  function getTierPrices(bodyEl) {
    const p4 = Number(bodyEl.dataset.price4 || "0");
    const p6 = Number(bodyEl.dataset.price6 || "0");
    const p12 = Number(bodyEl.dataset.price12 || "0");
    return { "4": p4, "6": p6, "12": p12 };
  }

  function initProductCards() {
    $$(".product-card").forEach(card => wireProductCard(card));
  }

  function wireProductCard(card) {
    const body = $(".product-body", card);
    if (!body) return;

    const prices = getTierPrices(body);
    const packName = findPackName(card);
    const packRadios = $$(`input[type="radio"][name="${packName}"]`, card);
    const boxesInput = $(".boxes-input", card);
    const customNote = $(".custom-note", card);
    const unitPriceEl = $(".unit-price", card);
    const boxesCountEl = $(".boxes-count", card);
    const totalPriceEl = $(".total-price", card);
    const addBtn = $(".add-to-cart", card);

    function priceFor(sel) {
      if (sel === "custom") return Number(unitPriceEl.dataset.unit || "0");
      return prices[sel] ?? 0;
    }

    function updateUnitPrice() {
      const sel = packRadios.find(r => r.checked)?.value || "4";
      if (customNote) customNote.hidden = (sel !== "custom");
      const price = priceFor(sel);
      unitPriceEl.dataset.unit = price.toFixed(2);
      unitPriceEl.textContent = fmt(price);
    }

    function updateTotal() {
      const unit = Number(unitPriceEl.dataset.unit || "0");
      const qty = clampInt(boxesInput?.value, 1);
      boxesCountEl.textContent = String(qty);
      totalPriceEl.textContent = fmt(unit * qty);
    }

    packRadios.forEach(r => r.addEventListener("change", () => { updateUnitPrice(); updateTotal(); }));
    boxesInput?.addEventListener("input", updateTotal);

    if (!unitPriceEl.dataset.unit) {
      const sel = packRadios.find(r => r.checked)?.value || "4";
      const price = priceFor(sel);
      unitPriceEl.dataset.unit = price.toFixed(2);
      unitPriceEl.textContent = fmt(price);
    }
    updateUnitPrice();
    updateTotal();

    // Add to cart: “Items added” (no alert) + badge
    addBtn?.addEventListener("click", () => {
      const user = Auth.user;
      if (!user) {
        if (confirm("Please sign in to add to cart. Go to Account page now?")) {
          window.location.href = "account.html";
        }
        return;
      }

      const selectedPack = packRadios.find(r => r.checked)?.value || "4";
      const packPrice = priceFor(selectedPack);
      const qty = clampInt(boxesInput?.value, 1);

      const item = {
        id: body.dataset.id,
        name: body.dataset.name,
        img: body.dataset.img,
        pack: selectedPack,
        unitPrice: Number(packPrice),
        boxes: qty,
        lineTotal: Number((packPrice * qty).toFixed(2)),
        addedAt: Date.now(),
        username: Auth.user?.username || null
      };

      const items = readCart();
      items.push(item);
      writeCart(items); // updates badge

      addBtn.classList.add("added");
      addBtn.textContent = "Items added";
      addBtn.disabled = true;
      setTimeout(() => { addBtn.disabled = false; }, 1500);
    });
  }

  function findPackName(card) {
    const r = card.querySelector('input[type="radio"][name^="pack-"]');
    return r ? r.getAttribute("name") : "pack-unknown";
  }

  function clampInt(val, min) {
    const n = parseInt(val, 10);
    return (isNaN(n) || n < min) ? min : n;
  }

  // Direct page guard: if user opens myorders.html without login, redirect
  function guardDirectMyOrders() {
    const path = (location.pathname || "").toLowerCase();
    const file = path.split('/').pop() || "";
    if (file === "myorders.html" && !Auth.user) {
      location.replace("account.html?next=myorders");
    }
  }

  // Boot
  document.addEventListener("DOMContentLoaded", () => {
    initHeader();
    initProductCards(); // harmless where no product-cards exist
    guardDirectMyOrders();
  });

})();
