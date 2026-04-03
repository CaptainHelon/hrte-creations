/* ══════════════════════════════════════════════
   HRTE CREATIONS — script.js
   ══════════════════════════════════════════════ */

/* ════════════════════════════════
   PRODUCT DATA
   To add your own product photos, change the icon field like this:
   icon: '<img src="images/product1.jpg" style="width:100%;height:100%;object-fit:cover;" />'
════════════════════════════════ */
const PRODUCTS = [
  { id:1,  name:'Wooden Photo Engraving',    category:'laser gift',     price:700,  badge:'Popular',    icon:'🖼️', desc:'Your photo engraved on 100×100mm wood. Varnished & finished.',                             isCustom:false },
  { id:2,  name:'Custom Key Tag',            category:'laser gift',     price:100,  badge:'Bestseller', icon:'🏷️', desc:'Heart-shaped or square wooden key tags with your design/name.',                           isCustom:false },
  { id:3,  name:'Restaurant Table Numbers',  category:'laser business', price:350,  badge:null,         icon:'📋', desc:'Custom numbered table signs laser-engraved on wood. Per piece.',                          isCustom:false },
  { id:4,  name:'Business Logo Sign',        category:'laser business', price:1200, badge:null,         icon:'🪵', desc:'Your logo or business name engraved on a polished wooden plaque.',                        isCustom:false },
  { id:5,  name:'Custom 3D Phone Cover',     category:'3d',             price:2000, badge:'Custom',     icon:'📱', desc:'3D printed to fit your exact phone model. iPhone & Samsung available.',                   isCustom:true  },
  { id:6,  name:'3D Photo Frame',            category:'3d',             price:800,  badge:null,         icon:'🖼️', desc:'Sleek 3D printed frames — black or white PLA. Custom sizes available.',                  isCustom:false },
  { id:7,  name:'Couple Photo Engraving',    category:'laser gift',     price:1200, badge:'Gift',       icon:'💑', desc:'Two photos side by side engraved on wood. Perfect anniversary gift.',                     isCustom:false },
  { id:8,  name:'Custom Laser Cutting',      category:'laser custom',   price:500,  badge:'Custom',     icon:'✂️', desc:'Custom shapes cut from wood or acrylic. Upload your vector file.',                       isCustom:true  },
  { id:9,  name:'3D Printed Prototype',      category:'3d custom',      price:1500, badge:'Custom',     icon:'🔩', desc:'Have a design in Fusion 360 or STL? We print it for you.',                               isCustom:true  },
  { id:10, name:'Keychain Gift Set (3pcs)',   category:'laser gift',     price:250,  badge:'Value',      icon:'🎁', desc:'Set of 3 customized wooden keychains — perfect for gifting.',                             isCustom:false },
  { id:11, name:'Acrylic Name Plate',        category:'laser business', price:900,  badge:null,         icon:'🔮', desc:'Laser-cut acrylic desk name plate with your name and designation.',                      isCustom:false },
  { id:12, name:'Full Custom Order',         category:'custom',         price:null, badge:'Custom',     icon:'✨', desc:'Describe your idea — we price it based on complexity & material.',                        isCustom:true  },
];

/* ════════════════════════════════
   CART STATE
════════════════════════════════ */
let cart = JSON.parse(localStorage.getItem('hrte_cart') || '[]');


/* ════════════════════════════════
   RENDER PRODUCTS
════════════════════════════════ */
function renderProducts(filter) {
  const grid = document.getElementById('productsGrid');
  const filtered = filter === 'all'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category.includes(filter));

  grid.innerHTML = filtered.map(p => `
    <div class="product-card">
      <div class="product-img">
        ${p.icon}
        ${p.badge ? `<div class="product-badge ${p.isCustom ? 'custom' : ''}">${p.badge}</div>` : ''}
      </div>
      <div class="product-info">
        <div class="product-cat">${p.category.split(' ').map(c => c.toUpperCase()).join(' · ')}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-desc">${p.desc}</div>
        <div class="product-footer">
          <div class="product-price">
            ${p.price ? 'Rs ' + p.price : 'Quote'}
            ${p.price ? '<span>/ piece</span>' : ''}
          </div>
          ${p.isCustom
            ? `<div class="product-btn-row">
                ${(p.category.includes('3d')) ? `<a href="3d-calculator.html" class="calc-mini-btn" title="Get instant price estimate">🖩 Quote</a>` : ''}
                <button class="add-to-cart custom-order" onclick="scrollToSection('custom')">✏️ Order</button>
               </div>`
            : `<button class="add-to-cart" onclick="addToCart(${p.id})">+ Add</button>`
          }
        </div>
      </div>
    </div>
  `).join('');
}


/* ════════════════════════════════
   FILTER BUTTONS
════════════════════════════════ */
function filterProducts(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderProducts(cat);
}


/* ════════════════════════════════
   SCROLL HELPERS
════════════════════════════════ */
function scrollToShop(filter) {
  document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => {
    const btn = [...document.querySelectorAll('.filter-btn')]
      .find(b => b.textContent.toLowerCase().includes(filter === '3d' ? '3d' : filter));
    if (btn) filterProducts(filter, btn);
  }, 600);
}

function scrollToSection(id) {
  document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}


/* ════════════════════════════════
   CART — ADD / REMOVE / QTY
════════════════════════════════ */
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

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  updateCartUI();
  renderCartItems();
}

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

function saveCart() {
  localStorage.setItem('hrte_cart', JSON.stringify(cart));
}


/* ════════════════════════════════
   CART — UI UPDATE
════════════════════════════════ */
function updateCartUI() {
  const count   = cart.reduce((a, i) => a + i.qty, 0);
  const total   = cart.reduce((a, i) => a + (i.price || 0) * i.qty, 0);
  const countEl = document.getElementById('cartCount');

  countEl.textContent   = count;
  countEl.style.display = count > 0 ? 'flex' : 'none';

  document.getElementById('cartTotal').textContent      = 'Rs ' + total.toLocaleString();
  document.getElementById('cartFooter').style.display   = cart.length > 0 ? 'block' : 'none';
  document.getElementById('cartEmpty').style.display    = cart.length > 0 ? 'none'  : 'flex';
}

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
          <button class="qty-btn" onclick="changeQty(${i.id},  1)">+</button>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart(${i.id})">🗑️</button>
    </div>
  `).join('');
}


/* ════════════════════════════════
   CART SIDEBAR OPEN / CLOSE
════════════════════════════════ */
function openCart() {
  document.getElementById('cartSidebar').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
  renderCartItems();
}

function closeCart() {
  document.getElementById('cartSidebar').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
}


/* ════════════════════════════════
   CHECKOUT MODAL OPEN / CLOSE
════════════════════════════════ */
function openCheckout() {
  closeCart();
  document.getElementById('checkoutModal').classList.add('open');
}

function closeCheckout() {
  document.getElementById('checkoutModal').classList.remove('open');
}


/* ════════════════════════════════
   PAYMENT OPTION SELECT
════════════════════════════════ */
function selectPayment(el) {
  document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  el.querySelector('input[type="radio"]').checked = true;
}


/* ════════════════════════════════
   PLACE SHOP ORDER
   — Sends data to Node.js backend
   — Falls back to WhatsApp if server is offline
════════════════════════════════ */
async function placeOrder() {
  const name    = document.getElementById('co-name').value.trim();
  const phone   = document.getElementById('co-phone').value.trim();
  const address = document.getElementById('co-address').value.trim();

  if (!name || !phone || !address) {
    alert('Please fill all required fields.');
    return;
  }

  const payment   = document.querySelector('input[name="payment"]:checked')?.value || 'bank';
  const orderData = {
    type: 'shop_order',
    name, phone,
    email:   document.getElementById('co-email').value,
    address, payment,
    items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price, total: i.price * i.qty })),
    total: cart.reduce((a, i) => a + (i.price || 0) * i.qty, 0),
    date:  new Date().toISOString(),
  };

  try {
    /*
      ─── BACKEND URL ───
      Replace 'http://localhost:3000' with your live server URL when deployed.
      Example: 'https://hrte-backend.railway.app'
    */
    const res = await fetch('http://localhost:3000/api/order', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(orderData),
    });

    if (res.ok) {
      closeCheckout();
      cart = [];
      saveCart();
      updateCartUI();
      showToast("🎉 Order placed! We'll contact you soon.");
      const msg = encodeURIComponent(
        `Hi HRTE Creations! I just placed an order.\nName: ${name}\nPhone: ${phone}\nTotal: Rs ${orderData.total}`
      );
      setTimeout(() => window.open(`https://wa.me/94714754871?text=${msg}`, '_blank'), 1500);
    } else {
      alert('Something went wrong. Please WhatsApp us directly!');
    }
  } catch (e) {
    /* Fallback — send order summary via WhatsApp if backend is unavailable */
    const msg = encodeURIComponent(
      `Hi HRTE Creations! I want to place an order.\nName: ${name}\nPhone: ${phone}\nItems: ${cart.map(i => `${i.name} x${i.qty}`).join(', ')}\nTotal: Rs ${orderData.total}`
    );
    window.open(`https://wa.me/94714754871?text=${msg}`, '_blank');
    closeCheckout();
    cart = [];
    saveCart();
    updateCartUI();
    showToast('✅ Redirected to WhatsApp!');
  }
}


/* ════════════════════════════════
   SUBMIT CUSTOM ORDER FORM
════════════════════════════════ */
async function submitCustomOrder(e) {
  e.preventDefault();

  const orderData = {
    type:        'custom_order',
    name:        document.getElementById('cf-name').value,
    phone:       document.getElementById('cf-phone').value,
    email:       document.getElementById('cf-email').value,
    service:     document.getElementById('cf-service').value,
    material:    document.getElementById('cf-material').value,
    qty:         document.getElementById('cf-qty').value,
    description: document.getElementById('cf-desc').value,
    date:        new Date().toISOString(),
  };

  try {
    const res = await fetch('http://localhost:3000/api/custom-order', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(orderData),
    });

    if (res.ok) {
      showToast("✅ Custom order sent! We'll WhatsApp you soon.");
      document.getElementById('customOrderForm').reset();
      document.getElementById('file-name-display').textContent = 'Click to upload JPG, PNG, PDF, SVG, DXF';
    } else {
      throw new Error('Server error');
    }
  } catch {
    /* Fallback to WhatsApp */
    const msg = encodeURIComponent(
      `Hi! I want a custom order.\nName: ${orderData.name}\nService: ${orderData.service}\nQty: ${orderData.qty}\n\n${orderData.description}`
    );
    window.open(`https://wa.me/94714754871?text=${msg}`, '_blank');
    showToast('✅ Redirected to WhatsApp!');
  }
}


/* ════════════════════════════════
   FILE UPLOAD LABEL
════════════════════════════════ */
function showFileName(input) {
  const f = input.files[0];
  document.getElementById('file-name-display').textContent =
    f ? `📎 ${f.name}` : 'Click to upload JPG, PNG, PDF, SVG, DXF';
}


/* ════════════════════════════════
   HERO SLIDESHOW
════════════════════════════════ */
let currentSlide = 0;
const slides = document.querySelectorAll('.hero-slide');
const dots   = document.querySelectorAll('.hero-dot');

function goToSlide(n) {
  slides[currentSlide].classList.remove('active');
  dots[currentSlide].classList.remove('active');
  currentSlide = n;
  slides[currentSlide].classList.add('active');
  dots[currentSlide].classList.add('active');
}

setInterval(() => goToSlide((currentSlide + 1) % slides.length), 5000);


/* ════════════════════════════════
   TOAST NOTIFICATION
════════════════════════════════ */
let toastTimer;

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}


/* ════════════════════════════════
   NAVBAR SHRINK ON SCROLL
════════════════════════════════ */
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
});


/* ════════════════════════════════
   SCROLL REVEAL ANIMATION
════════════════════════════════ */
const observer = new IntersectionObserver(
  entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
  { threshold: 0.1 }
);
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));


/* ════════════════════════════════
   INITIALISE
════════════════════════════════ */
renderProducts('all');
updateCartUI();
