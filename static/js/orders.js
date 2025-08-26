/* Orders page — PRIVATE
   - Only visible when signed in
   - Shows ONLY the signed-in user's orders
*/

(function () {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const fmt = n => `$${Number(n).toFixed(2)}`;

  const ORDERS_KEY = "sb_orders";
  const CART_KEY = "sb_cart";

  function authUser() { return window.SB?.Auth?.user || null; }
  function readOrders() { try { return JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]"); } catch { return []; } }
  function writeCart(items) { localStorage.setItem(CART_KEY, JSON.stringify(items)); window.SB?.updateCartBadge?.(); }
  function appendToCart(items) {
    const current = (() => { try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch { return []; } })();
    writeCart(current.concat(items));
  }

  function escapeHtml(s) {
    return (s || "").replace(/[&<>"']/g, (ch) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[ch]
    ));
  }

  function render() {
    const user = authUser();
    if (!user) {
      // fallback guard (main.js also redirects)
      location.replace("account.html?next=myorders");
      return;
    }

    const all = readOrders();
    const mine = all
      .filter(o => (o.username || "").toLowerCase() === (user.username || "").toLowerCase())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const empty = $("#ordersEmpty");
    const list = $("#ordersList");
    list.innerHTML = "";

    if (!mine.length) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    mine.forEach(order => {
      const card = document.createElement("div");
      card.className = "card order-card";
      const date = new Date(order.createdAt);

      card.innerHTML = `
        <div class="head">
          <div>
            <div class="order-id">Order #${order.orderId}</div>
            <div class="order-meta">${date.toLocaleString()}</div>
          </div>
          <div class="order-total"><strong>Total: ${fmt(order.total)}</strong></div>
        </div>

        ${order.note ? `<p class="muted" style="margin:4px 0 8px;">Note: ${escapeHtml(order.note)}</p>` : ""}

        <div class="items">
          ${order.items.map(it => `
            <div class="item-row">
              <div class="item-left">
                <img src="${it.img}" class="item-thumb" alt="${it.name}">
                <div>
                  <div><strong>${it.name}</strong></div>
                  <div class="muted">Pack ${it.pack} · ${it.boxes} boxes · Unit ${fmt(it.unitPrice)}</div>
                </div>
              </div>
              <div class="item-right"><strong>${fmt(it.lineTotal)}</strong></div>
            </div>
          `).join("")}
        </div>

        <div class="actions">
          <button class="btn reorder" data-id="${order.orderId}" type="button">Reorder</button>
          <a class="btn" href="index.html">← Home</a>
          <a class="btn" href="cart.html">Go to Cart</a>
        </div>
      `;
      list.appendChild(card);
    });

    $$(".reorder", list).forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const ord = mine.find(o => o.orderId === id);
        if (!ord) return;
        appendToCart(ord.items.map(it => ({ ...it, addedAt: Date.now() })));
        alert("Items added to cart!");
        window.location.href = "cart.html";
      });
    });
  }

  document.addEventListener("DOMContentLoaded", render);
})();
