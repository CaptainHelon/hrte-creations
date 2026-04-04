/* ══════════════════════════════════════════════
   calculator.js — Multi-file 3D Print Calculator
   Tab switcher with per-file 3D viewer
   ══════════════════════════════════════════════ */

const MATERIALS = {
  PLA: { pricePerGram: 6,  density: 1.24 },
  ABS: { pricePerGram: 5,  density: 1.05 },
};
const QUALITY = {
  draft:    { multiplier: 0.85, speedCm3PerHr: 25, name: 'Draft'    },
  standard: { multiplier: 1.00, speedCm3PerHr: 18, name: 'Standard' },
  fine:     { multiplier: 1.30, speedCm3PerHr: 10, name: 'Fine'     },
};
const LABOUR_PER_HOUR = 400;
const BACKEND_URL     = 'http://localhost:3000';

const state = {
  files:       [],   // { name, buf, volume, triangles, weight, printTime, price }
  activeIndex: 0,    // which tab/file is currently shown in 3D viewer
  material:    'PLA',
  quality:     'standard',
  color:       'White',
  infill:      20,
  qty:         1,
};

let animId      = null;
let threeLoaded = false;
let currentRenderer = null;

/* ── DRAG & DROP ── */
const uploadZone = document.getElementById('uploadZone');
uploadZone.addEventListener('dragover',  e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop', e => {
  e.preventDefault(); uploadZone.classList.remove('drag-over');
  const files = [...e.dataTransfer.files].filter(f => f.name.toLowerCase().endsWith('.stl'));
  if (files.length) handleFiles(files); else showToast('⚠️ STL files only!');
});
document.getElementById('stlFile').addEventListener('change', e => {
  if (e.target.files.length) handleFiles([...e.target.files]);
});

/* ── HANDLE FILES ── */
async function handleFiles(newFiles) {
  if (newFiles.length + state.files.length > 10) { showToast('⚠️ Max 10 files total!'); return; }
  uploadZone.style.display = 'none';
  document.getElementById('processing').classList.add('show');
  setProgress(0, 'Starting...', '');

  for (let i = 0; i < newFiles.length; i++) {
    const file = newFiles[i];
    if (state.files.find(f => f.name === file.name)) continue; // skip duplicates
    setProgress(Math.round((i / newFiles.length) * 85), `Processing ${i+1}/${newFiles.length}...`, file.name);
    try {
      const buf  = await readFile(file);
      const info = parseSTL(buf);
      state.files.push({ name: file.name, buf, volume: info.volume, triangles: info.triangles, weight: 0, printTime: 0, price: 0 });
    } catch { showToast(`⚠️ Could not read ${file.name}`); }
  }

  setProgress(100, 'Done!', '');
  setTimeout(() => {
    document.getElementById('processing').classList.remove('show');
    updateAllPrices();
    renderTabs();
    showViewer();
    // Show the last added file in 3D view
    switchTab(state.files.length - 1);
    document.getElementById('priceEmpty').style.display     = 'none';
    document.getElementById('priceBreakdown').style.display = 'block';
  }, 300);
}

/* ── READ FILE ── */
function readFile(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload  = e => resolve(e.target.result);
    fr.onerror = reject;
    fr.readAsArrayBuffer(file);
  });
}

/* ── SHOW / HIDE VIEWER ── */
function showViewer() {
  document.getElementById('viewerCard').classList.add('show');
}

/* ── RENDER TABS ── */
function renderTabs() {
  const container = document.getElementById('viewerTabs');
  container.innerHTML = state.files.map((f, i) => `
    <div class="viewer-tab ${i === state.activeIndex ? 'active' : ''}" id="tab-${i}" onclick="switchTab(${i})">
      📦 ${truncate(f.name, 18)}
      <button class="tab-remove" onclick="event.stopPropagation(); removeFile(${i})" title="Remove">✕</button>
    </div>
  `).join('');
}

function truncate(str, n) { return str.length > n ? str.slice(0, n-1) + '…' : str; }

/* ── SCROLL TABS ── */
function scrollTabs(dir) {
  const el = document.getElementById('viewerTabs');
  el.scrollBy({ left: dir * 120, behavior: 'smooth' });
}

/* ── SWITCH ACTIVE TAB ── */
function switchTab(i) {
  if (i < 0 || i >= state.files.length) return;
  state.activeIndex = i;

  // Update tab highlights
  document.querySelectorAll('.viewer-tab').forEach((t, idx) => {
    t.classList.toggle('active', idx === i);
  });

  // Scroll tab into view
  const activeTab = document.getElementById(`tab-${i}`);
  if (activeTab) activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

  // Load 3D model for this file
  const f = state.files[i];
  loadThreeAndRender(f.buf, f);

  // Update stats bar
  updateViewerStats(f);
}

/* ── UPDATE VIEWER STATS BAR ── */
function updateViewerStats(f) {
  document.getElementById('stat-vol').textContent    = f.volume.toFixed(1);
  document.getElementById('stat-weight').textContent = f.weight.toFixed(1);
  document.getElementById('stat-tris').textContent   = f.triangles > 1000 ? (f.triangles/1000).toFixed(1)+'K' : f.triangles;
  const h = Math.floor(f.printTime), m = Math.round((f.printTime-h)*60);
  document.getElementById('stat-time').textContent = h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/* ── REMOVE FILE ── */
function removeFile(i) {
  state.files.splice(i, 1);
  if (state.files.length === 0) { resetAll(); return; }
  state.activeIndex = Math.min(state.activeIndex, state.files.length - 1);
  updateAllPrices();
  renderTabs();
  switchTab(state.activeIndex);
}

/* ── ADD MORE FILES ── */
function addMoreFiles() { document.getElementById('stlFile').click(); }

/* ── UPDATE ALL PRICES ── */
function updateAllPrices() {
  const mat = MATERIALS[state.material];
  const q   = QUALITY[state.quality];
  const eff = 0.25 + 0.75 * (state.infill / 100);
  let totW = 0, totT = 0, totP = 0;

  state.files.forEach(f => {
    f.weight    = f.volume * mat.density * eff;
    f.printTime = f.volume / q.speedCm3PerHr;
    const mc    = f.weight * mat.pricePerGram * q.multiplier;
    const lc    = f.printTime * LABOUR_PER_HOUR;
    f.price     = Math.ceil((mc + lc) * 1.2);
    totW += f.weight; totT += f.printTime; totP += f.price;
  });

  const grand = totP * state.qty;
  const H = Math.floor(totT), M = Math.round((totT-H)*60);

  // Per-file breakdown list
  document.getElementById('fileBreakdownList').innerHTML = state.files.map(f => `
    <div class="file-breakdown-item">
      <span class="file-breakdown-name">📦 ${f.name}</span>
      <span class="file-breakdown-price">Rs ${f.price.toLocaleString()}</span>
    </div>
  `).join('');

  document.getElementById('pb-files').textContent    = state.files.length + ' file' + (state.files.length > 1 ? 's' : '');
  document.getElementById('pb-material').textContent = state.material;
  document.getElementById('pb-weight').textContent   = totW.toFixed(1) + ' g';
  document.getElementById('pb-time').textContent     = H > 0 ? `${H}h ${M}m` : `${M}m`;
  document.getElementById('pb-quality').textContent  = q.name;
  document.getElementById('pb-infill').textContent   = state.infill + '%';
  document.getElementById('pb-color').textContent    = state.color;
  document.getElementById('pb-qty').textContent      = '× ' + state.qty;
  document.getElementById('pb-total').textContent    = 'Rs ' + grand.toLocaleString();
  document.getElementById('pb-persub').textContent   = state.qty > 1 ? `Rs ${totP.toLocaleString()} per set` : 'for all files';
  document.getElementById('pb-totalqty').textContent = state.qty > 1 ? `Grand total: Rs ${grand.toLocaleString()}` : '';

  // Refresh active tab stats
  if (state.files[state.activeIndex]) updateViewerStats(state.files[state.activeIndex]);
}

/* ── STL PARSER ── */
function parseSTL(buffer) {
  const view = new DataView(buffer);
  const n    = view.getUint32(80, true);
  const isBin= buffer.byteLength === (84 + n * 50) && n > 0;
  let vol = 0, tris = 0;
  if (isBin) {
    tris = n;
    for (let i = 0; i < n; i++) {
      const b=84+i*50+12;
      const v1x=view.getFloat32(b,true),   v1y=view.getFloat32(b+4,true),  v1z=view.getFloat32(b+8,true);
      const v2x=view.getFloat32(b+12,true), v2y=view.getFloat32(b+16,true), v2z=view.getFloat32(b+20,true);
      const v3x=view.getFloat32(b+24,true), v3y=view.getFloat32(b+28,true), v3z=view.getFloat32(b+32,true);
      vol += (v1x*(v2y*v3z-v2z*v3y) - v1y*(v2x*v3z-v2z*v3x) + v1z*(v2x*v3y-v2y*v3x)) / 6;
    }
  } else {
    const text = new TextDecoder().decode(buffer);
    const m    = text.match(/vertex\s+([\d.eE+\-]+)\s+([\d.eE+\-]+)\s+([\d.eE+\-]+)/g) || [];
    tris = Math.floor(m.length/3);
    for (let i=0; i<tris; i++) {
      const p=s=>{const r=s.match(/vertex\s+([\d.eE+\-]+)\s+([\d.eE+\-]+)\s+([\d.eE+\-]+)/);return r?[+r[1],+r[2],+r[3]]:[0,0,0];};
      const [a,b,c]=[p(m[i*3]),p(m[i*3+1]),p(m[i*3+2])];
      vol += (a[0]*(b[1]*c[2]-b[2]*c[1]) - a[1]*(b[0]*c[2]-b[2]*c[0]) + a[2]*(b[0]*c[1]-b[1]*c[0]))/6;
    }
  }
  return { volume: Math.abs(vol)/1000, triangles: tris };
}

/* ── LAZY LOAD THREE.JS ── */
function loadThreeAndRender(buffer, fileObj) {
  if (threeLoaded) { render3D(buffer); return; }
  setProgress(90, 'Loading 3D viewer...', '');
  const s = document.createElement('script');
  s.src    = 'js/three.min.js';
  s.onload = () => { threeLoaded = true; render3D(buffer); };
  s.onerror= () => {
    const cdn = document.createElement('script');
    cdn.src   = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    cdn.onload= () => { threeLoaded = true; render3D(buffer); };
    document.head.appendChild(cdn);
  };
  document.head.appendChild(s);
}

/* ── 3D RENDERER ── */
function render3D(buffer) {
  if (typeof THREE === 'undefined') return;
  if (animId) { cancelAnimationFrame(animId); animId = null; }
  if (currentRenderer) { currentRenderer.dispose(); currentRenderer = null; }

  const canvas = document.getElementById('stl-canvas');
  const w = canvas.offsetWidth || 600;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(w, 320);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x0d0d0d);
  currentRenderer = renderer;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, w/320, 0.1, 100000);

  // Build geometry
  const view = new DataView(buffer);
  const n    = view.getUint32(80, true);
  const isBin= buffer.byteLength === (84+n*50) && n>0;
  const pos  = [];
  if (isBin) {
    const step = n > 200000 ? Math.ceil(n/200000) : 1;
    for (let i=0; i<n; i+=step) {
      const b=84+i*50+12;
      pos.push(
        view.getFloat32(b,true),    view.getFloat32(b+4,true),  view.getFloat32(b+8,true),
        view.getFloat32(b+12,true), view.getFloat32(b+16,true), view.getFloat32(b+20,true),
        view.getFloat32(b+24,true), view.getFloat32(b+28,true), view.getFloat32(b+32,true)
      );
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  geo.center();

  const mat  = new THREE.MeshPhongMaterial({ color:0xc8853a, specular:0x222222, shininess:60 });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  const box    = new THREE.Box3().setFromObject(mesh);
  const size   = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  mesh.scale.set(100/(maxDim||1), 100/(maxDim||1), 100/(maxDim||1));
  camera.position.set(0, 0, 220);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const dl  = new THREE.DirectionalLight(0xffffff, 0.8); dl.position.set(1,2,3);   scene.add(dl);
  const dl2 = new THREE.DirectionalLight(0xffa040, 0.4); dl2.position.set(-2,-1,-1); scene.add(dl2);

  let rot = 0;
  (function animate() {
    animId = requestAnimationFrame(animate);
    rot += 0.008;
    mesh.rotation.y = rot;
    mesh.rotation.x = Math.sin(rot*0.3)*0.2;
    renderer.render(scene, camera);
  })();
}

/* ── PROGRESS ── */
function setProgress(pct, label, step) {
  document.getElementById('progressBar').style.width   = pct + '%';
  document.getElementById('progressLabel').textContent = label;
  document.getElementById('progressStep').textContent  = step || '';
}

/* ── SETTINGS ── */
function setMaterial(m,el){ state.material=m; document.querySelectorAll('.mat-btn').forEach(b=>b.classList.remove('active')); el.classList.add('active'); updateAllPrices(); }
function setQuality(q,el) { state.quality=q;  document.querySelectorAll('.qual-btn').forEach(b=>b.classList.remove('active')); el.classList.add('active'); updateAllPrices(); }
function setColor(c,el) {
  state.color=c;
  document.querySelectorAll('.clr').forEach(x=>{x.classList.remove('active');x.innerHTML='';});
  el.classList.add('active');
  el.innerHTML=`<span style="color:${c==='Black'?'#aaa':'#555'}">✓</span>`;
  updateAllPrices();
}
function updateInfill(v){ state.infill=parseInt(v); document.getElementById('infillVal').textContent=v+'%'; updateAllPrices(); }
function changeQty(d)   { state.qty=Math.max(1,Math.min(99,state.qty+d)); document.getElementById('qtyNum').textContent=state.qty; updateAllPrices(); }

/* ── RESET ── */
function resetAll() {
  state.files=[]; state.activeIndex=0;
  if (animId){ cancelAnimationFrame(animId); animId=null; }
  if (currentRenderer){ currentRenderer.dispose(); currentRenderer=null; }
  document.getElementById('uploadZone').style.display      = 'block';
  document.getElementById('viewerCard').classList.remove('show');
  document.getElementById('priceEmpty').style.display      = 'block';
  document.getElementById('priceBreakdown').style.display  = 'none';
  document.getElementById('stlFile').value='';
  setProgress(0,'','');
}

/* ── ORDER ── */
async function placeOrder() {
  const name=document.getElementById('o-name').value.trim();
  const phone=document.getElementById('o-phone').value.trim();
  if (!state.files.length){ showToast('⚠️ Upload at least one STL file!'); return; }
  if (!name||!phone)       { showToast('⚠️ Enter your name and phone!');    return; }
  const btn=document.getElementById('orderBtn');
  btn.disabled=true; btn.textContent='Placing order...';
  const total=state.files.reduce((a,f)=>a+f.price,0)*state.qty;
  const orderData={ type:'custom_order', name, phone, service:'3d-printing', material:state.material, qty:state.qty,
    description:`Files: ${state.files.map(f=>f.name).join(', ')} | Mat:${state.material} | Q:${state.quality} | Infill:${state.infill}% | Color:${state.color} | Total:Rs${total} | Notes:${document.getElementById('o-notes').value}`,
    date:new Date().toISOString() };
  try {
    const res=await fetch(`${BACKEND_URL}/api/custom-order`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(orderData)});
    if(res.ok){showToast("🎉 Order placed!"); btn.textContent='✅ Order Placed!';}
    else throw new Error();
  } catch { orderViaWhatsApp(); }
  finally { setTimeout(()=>{btn.disabled=false;btn.innerHTML='🖨️ Place 3D Print Order';},3000); }
}

function orderViaWhatsApp() {
  const name=document.getElementById('o-name').value||'Customer';
  const notes=document.getElementById('o-notes').value;
  const total=state.files.reduce((a,f)=>a+f.price,0)*state.qty;
  const lines=state.files.map(f=>`  • ${f.name} — Rs ${f.price.toLocaleString()}`).join('\n');
  const msg=encodeURIComponent(`Hi HRTE Creations! 3D Print Order:\n\nName: ${name}\nMaterial: ${state.material}\nQuality: ${QUALITY[state.quality].name}\nColor: ${state.color}\nInfill: ${state.infill}%\nQty: ${state.qty}\n\nFiles:\n${lines}\n\nTotal: Rs ${total.toLocaleString()}\n${notes?'Notes: '+notes:''}`);
  window.open(`https://wa.me/94714754871?text=${msg}`,'_blank');
}

let toastTimer;
function showToast(msg) {
  const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove('show'),3000);
}
