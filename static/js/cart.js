/* Cart page logic */

(function(){
  const $  = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const fmt = n => `$${Number(n).toFixed(2)}`;

  const CART_KEY   = "sb_cart";
  const ORDERS_KEY = "sb_orders";

  function readCart(){ try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch { return []; } }
  function writeCart(items){ localStorage.setItem(CART_KEY, JSON.stringify(items)); window.SB?.updateCartBadge?.(); }

  function readOrders(){ try { return JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]"); } catch { return []; } }
  function writeOrders(arr){ localStorage.setItem(ORDERS_KEY, JSON.stringify(arr)); }

  function render(){
    const items = readCart();
    const empty = $("#cartEmpty");
    const content = $("#cartContent");
    const list = $("#cartItems");
    list.innerHTML = "";

    if (!items.length){
      empty.hidden = false;
      content.hidden = true;
      return;
    }
    empty.hidden = true;
    content.hidden = false;

    items.forEach((it, idx) => {
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <img class="cart-thumb" src="${it.img}" alt="${it.name}">
        <div>
          <h3 class="item-title">${it.name}</h3>
          <div class="item-sub">Pack: ${it.pack} • Unit: ${fmt(it.unitPrice)}</div>
          <div class="qty-row">
            <label>Boxes:
              <input class="qty-input" type="number" min="1" value="${it.boxes}" data-idx="${idx}">
            </label>
            <button class="btn remove" data-idx="${idx}" type="button">Remove</button>
          </div>
        </div>
        <div class="item-actions">
          <div class="item-price" id="line-${idx}">${fmt(it.lineTotal)}</div>
        </div>
      `;
      list.appendChild(row);
    });

    $$(".qty-input", list).forEach(inp => {
      inp.addEventListener("input", () => {
        const idx = Number(inp.dataset.idx);
        const qty = Math.max(1, parseInt(inp.value || "1", 10));
        inp.value = String(qty);

        const items = readCart();
        const it = items[idx];
        it.boxes = qty;
        it.lineTotal = Number((it.unitPrice * qty).toFixed(2));
        writeCart(items);

        $("#line-"+idx).textContent = fmt(it.lineTotal);
        updateSummary();
      });
    });

    $$(".remove", list).forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.idx);
        const items = readCart();
        items.splice(idx, 1);
        writeCart(items);
        render();
      });
    });

    updateSummary();
  }

  function updateSummary(){
    const items = readCart();
    const subtotal = items.reduce((s, it) => s + it.lineTotal, 0);
    $("#sumSubtotal").textContent = fmt(subtotal);
    $("#sumTotal").textContent = fmt(subtotal);
  }

  function placeOrder(){
    const user = window.SB?.Auth?.user;
    if (!user) {
      if (confirm("Please sign in to place your order. Go to Account page now?")) {
        window.location.href = "account.html";
      }
      return;
    }

    const items = readCart();
    if (!items.length) return alert("Your cart is empty.");

    const orders = readOrders();
    const orderId = "SB" + Date.now();
    const total = Number(items.reduce((s, it) => s + it.lineTotal, 0).toFixed(2));
    const note = ($("#orderNote")?.value || "").trim();

    const order = {
      orderId,
      username: user.username,
      items,
      note,
      total,
      createdAt: new Date().toISOString()
    };

    orders.push(order);
    writeOrders(orders);

    writeCart([]); // clears cart + updates badge
    alert(`Order placed! #${orderId}`);
    window.location.href = "myorders.html";
  }

  document.addEventListener("DOMContentLoaded", () => {
    render();
    $("#clearCart")?.addEventListener("click", () => {
      if (confirm("Clear all items from cart?")) {
        writeCart([]);
        render();
      }
    });
    $("#placeOrder")?.addEventListener("click", placeOrder);
  });
})();
