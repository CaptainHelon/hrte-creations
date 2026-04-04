/* ══════════════════════════════════════════════
   products.js — Product data & rendering
   ══════════════════════════════════════════════

   TO ADD/EDIT A PRODUCT:
   - Copy any existing product object
   - Change id, name, category, price, badge, icon, desc, isCustom
   - For photos replace the emoji with:
     '<img src="images/yourphoto.jpg" style="width:100%;height:100%;object-fit:cover;" />'

   CATEGORIES (used by filter buttons):
   'laser'    → Laser Engraved filter
   'gift'     → Gifts filter
   'business' → Business filter
   '3d'       → 3D Printed filter
   'custom'   → Custom filter
   You can combine: 'laser gift' shows in both Laser AND Gifts

   isCustom: true  → shows Quote + Order buttons
   isCustom: false → shows Add to Cart button
   ══════════════════════════════════════════════ */

const PRODUCTS = [
  {
    id: 1,
    name: 'Wooden Photo Engraving',
    category: 'laser gift',
    price: 700,
    badge: 'Popular',
    icon: '<img src="images/13.jpeg" style="width:100%;height:100%;object-fit:cover;" />',
    desc: 'Your photo engraved on 100×100mm wood. Varnished & finished. Customized orders are available!.',
    isCustom: true,
  },
  {
    id: 2,
    name: 'Custom Key Tag',
    category: 'laser gift',
    price: 250,
    badge: 'Bestseller',
    icon: '<img src="images/keytag.jpeg" style="width:100%;height:100%;object-fit:cover;" />',
    desc: 'Heart-shaped or square wooden key tags with your design/name(50x50 mm Range/Keytag chain Included) Customized orders are available!.',
    isCustom: true,
  },
  {
    id: 3,
    name: 'Restaurant Table Numbers',
    category: 'laser business',
    price: 800,
    badge: null,
   icon: '<img src="images/11.jpeg" style="width:100%;height:100%;object-fit:cover;" />',
    desc: 'Custom numbered table signs or tags for your business, laser-engraved on wood. For table number stands with an attached metal stand (100+700 = 800 rs 100 x 100 mm Per Piece) Customized orders are available!.',
    isCustom: true,
  },
  {
    id: 4,
    name: 'Business Logo Sign',
    category: 'laser business',
    price: 1200,
    badge: null,
    icon: '<img src="images/businesslogo.png" style="width:100%;height:100%;object-fit:cover;" />',
    desc: 'Your logo or business name engraved on a polished wooden plaque.Both Engrave and cutting as a finished product. (100 x 100 mm Range) Customized orders are available!. ',
    isCustom: true,
  },
  {
    id: 5,
    name: 'Custom 3D Phone Cover',
    category: '3d',
    price: 2500,
    badge: 'Custom',
   icon: '<img src="images/phone.jpeg" style="width:100%;height:100%;object-fit:cover;" />',
    desc: '3D printed to fit your exact phone model. iPhone & Samsung available. Will be printed with PLA or ABS material. Only the Shown model available,Our team will add your favourite name on the phone cover and design it for you with in the given price.',
    isCustom: true,
  },
 
  {
    id: 7,
    name: 'Couple Photo Engraving',
    category: 'laser gift',
    price: 700,
    badge: 'Gift',
     icon: '<img src="images/couple1.jpeg" style="width:100%;height:100%;object-fit:cover;" />',
    desc: 'Couple photo engraved on wood. Perfect anniversary gift (100×100mm wood peices Varnished & finished. Customized orders are available!(20X20 cm, 30x30 cm Price Depends on the size).',
    isCustom: true,
  },
  {
    id: 8,
    name: 'Custom Laser Cutting',
    category: 'laser custom',
    price: null,
    badge: 'Custom',
     icon: '<img src="images/las.jpeg" style="width:100%;height:100%;object-fit:cover;" />',
    desc: 'Custom shapes cut from wood or acrylic. Upload your vector file.',
    isCustom: true,
  },
  {
    id: 9,
    name: '3D Printed Prototype',
    category: '3d custom',
    price: null,
    badge: 'Custom',
    icon: '<img src="images/3d2.jpg" style="width:100%;height:100%;object-fit:cover;" />',
    desc: 'Have a design in STL? We print it for you.',
    isCustom: true,
  },
  
  {
    id: 11,
    name: 'Acrylic Name Plate',
    category: 'laser business',
    price:100,
    badge: null,
    icon: '<img src="images/acryliccut.png" style="width:100%;height:100%;object-fit:cover;" />',
    desc: 'Laser-cut acrylic desk name plate with your name and designation.(Price is for 100x100 mm Range) Customized orders are available!.',
    isCustom: true,
  },
  {
    id: 12,
    name: 'Full Custom Order',
    category: 'custom',
    price: null,
    badge: 'Custom',
    icon: '<img src="images/customboardcreate.png" style="width:100%;height:100%;object-fit:cover;" />',
    desc: 'Describe your idea — We give the cheapest price based on complexity & material.',
    isCustom: true,
  },
];


/* ── RENDER PRODUCTS ── */
function renderProducts(filter) {
  const grid     = document.getElementById('productsGrid');
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
                ${p.category.includes('3d')
                  ? `<a href="3d-calculator.html" class="calc-mini-btn" title="Get instant price estimate">🖩 Quote</a>`
                  : ''}
                <button class="add-to-cart custom-order" onclick="scrollToSection('custom')">✏️ Order</button>
               </div>`
            : `<button class="add-to-cart" onclick="addToCart(${p.id})">+ Add</button>`
          }
        </div>
      </div>
    </div>
  `).join('');
}


/* ── FILTER BUTTONS ── */
function filterProducts(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderProducts(cat);
}


/* ── SCROLL HELPERS ── */
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
