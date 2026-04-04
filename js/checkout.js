/* ══════════════════════════════════════════════
   checkout.js — Order placement & payment
   ══════════════════════════════════════════════

   BACKEND URL:
   Change 'http://localhost:3000' to your live server URL
   once you deploy to Railway / Render etc.
   Example: 'https://hrte-backend.onrender.com'
   ══════════════════════════════════════════════ */

const BACKEND_URL = 'http://localhost:3000'; // ← change this when deploying


/* ── OPEN / CLOSE CHECKOUT MODAL ── */
function openCheckout() {
  closeCart();
  document.getElementById('checkoutModal').classList.add('open');
}

function closeCheckout() {
  document.getElementById('checkoutModal').classList.remove('open');
}


/* ── SELECT PAYMENT METHOD ── */
function selectPayment(el) {
  document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  el.querySelector('input[type="radio"]').checked = true;
}


/* ── PLACE SHOP ORDER ──
   Sends cart data to backend → falls back to WhatsApp */
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
    const res = await fetch(`${BACKEND_URL}/api/order`, {
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
  } catch {
    /* Fallback to WhatsApp if backend is offline */
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


/* ── SUBMIT CUSTOM ORDER FORM ── */
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
    const res = await fetch(`${BACKEND_URL}/api/custom-order`, {
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


/* ── FILE UPLOAD LABEL ── */
function showFileName(input) {
  const f = input.files[0];
  document.getElementById('file-name-display').textContent =
    f ? `📎 ${f.name}` : 'Click to upload JPG, PNG, PDF, SVG, DXF';
}
