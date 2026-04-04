/* ══════════════════════════════════════════════
   cart.js — Shopping cart logic
   Add, remove, change quantity, save to localStorage
   ══════════════════════════════════════════════ */

let cart = JSON.parse(localStorage.getItem('hrte_cart') || '[]');


/* ── ADD TO CART ── */
function addToCart(id) {
  const product  = PRODUCTS.find(p => p.id === id);
  const existing = cart.find(i => i.id === id);

  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  saveCart();
  showToast(`✅ ${product.name} added!`);
  updateCartUI();
}


/* ── REMOVE FROM CART ── */
function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  updateCartUI();
  renderCartItems();
}


/* ── CHANGE QUANTITY ── */
function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  item.qty += delta;

  if (item.qty <= 0) {
    removeFromCart(id);
  } else {
    saveCart();
    updateCartUI();
    renderCartItems();
  }
}


/* ── SAVE TO LOCALSTORAGE ── */
function saveCart() {
  localStorage.setItem('hrte_cart', JSON.stringify(cart));
}


/* ── UPDATE CART COUNT + TOTAL IN UI ── */
function updateCartUI() {
  const count   = cart.reduce((a, i) => a + i.qty, 0);
  const total   = cart.reduce((a, i) => a + (i.price || 0) * i.qty, 0);
  const countEl = document.getElementById('cartCount');

  countEl.textContent   = count;
  countEl.style.display = count > 0 ? 'flex' : 'none';

  document.getElementById('cartTotal').textContent    = 'Rs ' + total.toLocaleString();
  document.getElementById('cartFooter').style.display = cart.length > 0 ? 'block' : 'none';
  document.getElementById('cartEmpty').style.display  = cart.length > 0 ? 'none'  : 'flex';
}


/* ── RENDER CART ITEMS IN SIDEBAR ── */
function renderCartItems() {
  const container = document.getElementById('cartItems');

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty" id="cartEmpty">
        <div class="cart-empty-icon">🛒</div>
        <p>Your cart is empty.<br/>Add some amazing products!</p>
      </div>`;
    return;
  }

  container.innerHTML = cart.map(i => `
    <div class="cart-item">
      <div class="cart-item-icon">${i.icon}</div>
      <div class="cart-item-details">
        <div class="cart-item-name">${i.name}</div>
        <div class="cart-item-price">Rs ${(i.price * i.qty).toLocaleString()}</div>
        <div class="cart-qty">
          <button class="qty-btn" onclick="changeQty(${i.id}, -1)">−</button>
          <span class="qty-val">${i.qty}</span>
          <button class="qty-btn" onclick="changeQty(${i.id}, 1)">+</button>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart(${i.id})">🗑️</button>
    </div>
  `).join('');
}


/* ── OPEN / CLOSE CART SIDEBAR ── */
function openCart() {
  document.getElementById('cartSidebar').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
  renderCartItems();
}

function closeCart() {
  document.getElementById('cartSidebar').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
}
