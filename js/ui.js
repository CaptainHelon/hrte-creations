/* ══════════════════════════════════════════════
   ui.js — Hero slideshow, toast, navbar, scroll reveal
   ══════════════════════════════════════════════ */


/* ── HERO SLIDESHOW ──
   Change the interval (5000 = 5 seconds) to speed up/slow down */
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


/* ── TOAST NOTIFICATION ── */
let toastTimer;

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}


/* ── NAVBAR SHRINK ON SCROLL ── */
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
});


/* ── SCROLL REVEAL ANIMATION ── */
const observer = new IntersectionObserver(
  entries => entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('visible');
  }),
  { threshold: 0.1 }
);
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));


/* ── INITIALISE PAGE ── */
renderProducts('all');
updateCartUI();
