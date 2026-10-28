/* SISTEMA ALP · EXTRAS: Calculadora, Conversión KG→Metros, Admin y Metro (regla)
   Se carga DESPUÉS del script principal. No modifica nada de lo que ya funciona. */
(function () {
  'use strict';
  // ======= CAMBIA AQUÍ LA CLAVE ÚNICA DEL ADMIN =======
  const CLAVE_ADMIN = 'ALP2026';
  // =====================================================

  const $ = id => document.getElementById(id);
  const ESC = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = s => { const n = parseFloat(String(s).trim().replace(/\s/g, '').replace(',', '.')); return isNaN(n) ? null : n; };
  const fmt = (n, d = 6) => { if (!isFinite(n)) return 'Error'; let t = (+n.toFixed(d)).toString(); if (/e/i.test(t)) t = n.toFixed(d); return t.replace('.', ','); };

  // ---------- ESTILOS ----------
  const st = document.createElement('style');
  st.textContent = `
  .calc-disp{background:rgba(0,0,0,.45);border:1px solid var(--border);border-radius:18px;padding:12px 14px;margin-bottom:10px;text-align:right;min-height:96px;display:flex;flex-direction:column;justify-content:flex-end}
  .calc-exp{font-size:.95rem;color:var(--t2);word-break:break-all;min-height:1.3em}
  .calc-res{font-size:2.2rem;font-weight:700;color:var(--accent);word-break:break-all;line-height:1.15}
  .calc-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:10px}
  .ck{padding:15px 0;border:none;border-radius:14px;background:rgba(118,118,128,.32);color:#fff;font-size:1.15rem;font-weight:600;cursor:pointer}
  .ck:active{transform:scale(.94);opacity:.8}
  .ck.op{background:var(--blue)}.ck.fn{background:rgba(118,118,128,.55)}.ck.eq{background:var(--accent);color:#000}.ck.mm{background:rgba(255,214,10,.18);color:var(--gold);font-size:.9rem;padding:11px 0}
  .calc-hist{font-size:.78rem;color:var(--t2);max-height:130px;overflow-y:auto}
  .calc-hist div{padding:6px 8px;border-bottom:1px solid rgba(255,255,255,.07);cursor:pointer;text-align:right}
  .big-in{font-size:1.9rem!important;text-align:center;padding:20px!important;font-weight:700}
  .conv-res{background:rgba(0,0,0,.4);border:1px solid var(--border);border-radius:20px;padding:18px;text-align:center;margin-top:6px}
  .conv-res .v{font-size:2.4rem;font-weight:800;color:var(--accent);word-break:break-all}
  .conv-res .s{font-size:.8rem;color:var(--t2);margin-top:6px}
  .arv-item{display:flex;justify-content:space-between;align-items:center;gap:8px;background:rgba(255,255,255,.05);border:1px solid var(--border);border-radius:14px;padding:10px 12px;margin-bottom:8px}
  .arv-item b{color:var(--accent)}.arv-item small{color:var(--t2);display:block}
  .arv-item .a{display:flex;gap:6px}
  #metro-ov{display:none;position:fixed;top:0;left:0;z-index:2000;background:#f4efd8;color:#222;flex-direction:column;transform-origin:top left;touch-action:none;user-select:none;-webkit-user-select:none}
  #metro-ov canvas{flex:1;min-height:0;width:100%;display:block;touch-action:none}
  #metro-bar{height:54px;display:flex;gap:8px;align-items:center;padding:6px 10px;background:#0b1220}
  #metro-bar button{flex:1;height:40px;border-radius:12px;border:1px solid var(--border);background:rgba(0,242,255,.12);color:var(--accent);font-weight:700;font-size:.8rem;cursor:pointer}
  #metro-cal{display:none;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:#0b1220;color:#fff;border:1px solid var(--border);border-radius:18px;padding:14px;text-align:center;max-width:90%;z-index:3}
  #metro-cal .card{margin:8px auto;border:2px dashed var(--accent);border-radius:8px;background:rgba(0,242,255,.08)}
  #metro-cal input[type=range]{width:100%;padding:0;margin:6px 0}
  `;
  document.head.appendChild(st);

  // ---------- MENÚ + VISTAS ----------
  const box = document.querySelector('.dr-box');
  [['calc', '🧮 Calculadora'], ['conv', '⚖️ Conversión KG a Metros'], ['metro', '📏 Metro (regla)'], ['admin', '🔐 Admin (arvidales)']].forEach(([k, t]) => {
    const b = document.createElement('button'); b.className = 'dr-item'; b.textContent = t; b.onclick = () => irA(k); box.appendChild(b);
  });
  const tabs = document.querySelector('.tabs');
  const card = document.querySelector('.app-card');
  const footer = document.querySelector('.footer-tag');
  ['calc', 'conv', 'metro', 'admin'].forEach(k => { // botones-fantasma para que switchTab funcione sin tocar nada
    const b = document.createElement('button'); b.id = 't-' + k; b.className = 'tab-btn'; b.style.display = 'none'; tabs.appendChild(b);
    const v = document.createElement('div'); v.id = 'v-' + k; v.className = 'view'; card.insertBefore(v, footer);
  });

  $('v-calc').innerHTML = `
    <div class="lbl">🧮 Calculadora</div>
    <div class="calc-disp"><div class="calc-exp" id="c-exp"></div><div class="calc-res" id="c-res">0</div></div>
    <div class="calc-grid">
      <button class="ck mm" data-k="MC">MC</button><button class="ck mm" data-k="MR">MR</button><button class="ck mm" data-k="M-">M−</button><button class="ck mm" data-k="M+">M+</button>
      <button class="ck fn" data-k="C">C</button><button class="ck fn" data-k="(">(</button><button class="ck fn" data-k=")">)</button><button class="ck fn" data-k="BK">⌫</button>
      <button class="ck" data-k="7">7</button><button class="ck" data-k="8">8</button><button class="ck" data-k="9">9</button><button class="ck op" data-k="÷">÷</button>
      <button class="ck" data-k="4">4</button><button class="ck" data-k="5">5</button><button class="ck" data-k="6">6</button><button class="ck op" data-k="×">×</button>
      <button class="ck" data-k="1">1</button><button class="ck" data-k="2">2</button><button class="ck" data-k="3">3</button><button class="ck op" data-k="−">−</button>
      <button class="ck" data-k="0">0</button><button class="ck" data-k=".">,</button><button class="ck fn" data-k="%">%</button><button class="ck op" data-k="+">+</button>
      <button class="ck fn" data-k="NEG">±</button><button class="ck eq" data-k="=" style="grid-column:span 3">=</button>
    </div>
    <div class="lbl">Historial (toca uno para reutilizarlo)</div><div class="calc-hist" id="c-hist"></div>`;

  $('v-conv').innerHTML = `
    <div class="lbl">⚖️ Conversión de KG a Metros</div>
    <select id="cv-sel"><option value="">Selecciona el arvidal</option></select>
    <div class="lbl">Kilos que piden</div>
    <input type="text" inputmode="decimal" id="cv-kg" class="big-in" placeholder="0">
    <div class="conv-res"><div class="s">Metros que debes sacar de la máquina</div><div class="v" id="cv-out">0 m</div><div class="s" id="cv-det"></div></div>`;

  $('v-metro').innerHTML = `
    <div class="lbl">📏 Metro (regla horizontal)</div>
    <div class="obs">Se abre una regla en pantalla completa y horizontal. Deja el dedo presionado sobre la regla y arrastra para medir.<br><br>Para que las medidas sean exactas, calibra una vez con una tarjeta de banco o cédula (botón Calibrar).</div>
    <button class="btn btn-send" onclick="switchTab('metro')" style="margin-top:12px">📏 Abrir regla</button>`;

  $('v-admin').innerHTML = `
    <div class="lbl">🔐 Administrador de arvidales</div>
    <div id="ad-lock">
      <input type="password" id="ad-pass" placeholder="Clave de administrador" onkeydown="if(event.key==='Enter')document.getElementById('ad-go').click()">
      <button class="btn btn-send" id="ad-go">Entrar</button>
    </div>
    <div id="ad-panel" class="hidden">
      <div class="lbl" id="ad-tit">Nuevo arvidal</div>
      <input type="text" id="ad-nom" placeholder="Nombre del arvidal">
      <input type="text" inputmode="decimal" id="ad-fac" placeholder="Número de conversión (ej: 3,25 metros por cada kg)">
      <div class="acts"><button class="btn btn-gray" id="ad-can">Cancelar</button><button class="btn btn-send" style="margin:0" id="ad-sav">💾 Guardar</button></div>
      <div class="lbl" style="margin-top:14px">Arvidales registrados</div>
      <div id="ad-list"></div>
      <button class="btn btn-gray" id="ad-out" style="margin-top:10px">🔒 Cerrar sesión admin</button>
    </div>`;

  // ---------- CALCULADORA ----------
  let exp = '', hist = [], mem = 0, ultimo = null;
  function evaluar(src) {
    let s = src.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/,/g, '.');
    const o = (s.match(/\(/g) || []).length, c = (s.match(/\)/g) || []).length;
    if (o > c) s += ')'.repeat(o - c);
    const tk = s.match(/\d*\.?\d+|[-+*/()%]/g) || []; if (tk.join('') !== s.replace(/\s/g, '')) throw 0;
    let p = 0;
    const E = () => { let l = T(); while (tk[p] === '+' || tk[p] === '-') { const op = tk[p++], r = T(); const rv = (r.pct && !r.mul) ? l.v * r.v : r.v; l = { v: op === '+' ? l.v + rv : l.v - rv }; } return l; };
    const T = () => { let l = F(); while (tk[p] === '*' || tk[p] === '/') { const op = tk[p++], r = F(); if (op === '/' && r.v === 0) throw 0; l = { v: op === '*' ? l.v * r.v : l.v / r.v, mul: true }; } return l; };
    const F = () => {
      if (tk[p] === '-') { p++; const f = F(); return { v: -f.v, pct: f.pct }; }
      if (tk[p] === '+') { p++; return F(); }
      let r = P(), pct = false; while (tk[p] === '%') { p++; r = { v: r.v / 100 }; pct = true; } return { v: r.v, pct };
    };
    const P = () => { if (tk[p] === '(') { p++; const e = E(); if (tk[p++] !== ')') throw 0; return { v: e.v }; } if (tk[p] === undefined || !/\d|\./.test(tk[p][0])) throw 0; return { v: parseFloat(tk[p++]) }; };
    const r = E(); if (p !== tk.length) throw 0;
    return +r.v.toPrecision(14);
  }
  function pintaCalc() {
    $('c-exp').textContent = exp || '\u00a0';
    let vista = '0';
    if (exp) { try { vista = fmt(evaluar(exp), 10); } catch (e) { vista = ultimo !== null ? fmt(ultimo, 10) : '…'; } }
    $('c-res').textContent = vista;
  }
  function pintaHist() {
    $('c-hist').innerHTML = hist.slice(0, 15).map((h, i) => `<div data-i="${i}">${ESC(h.e)} = <b style="color:var(--accent)">${ESC(h.r)}</b></div>`).join('') || '<div>Sin operaciones aún</div>';
  }
  function tecla(k) {
    const ops = '+−×÷';
    if (/^\d$/.test(k)) { exp += k; }
    else if (k === '.') { const m = exp.match(/[\d.,]*$/)[0]; if (!m.includes('.')) exp += m === '' ? '0.' : '.'; }
    else if (ops.includes(k)) { if (!exp) { if (ultimo !== null) exp = String(ultimo).replace('.', '.'); else if (k === '−') exp = '−'; else return; } if (ops.includes(exp.slice(-1)) && exp.length > 1) exp = exp.slice(0, -1); exp += k; }
    else if (k === '%') { if (exp && /[\d)%]$/.test(exp)) exp += '%'; }
    else if (k === '(') { exp += (/[\d)%]$/.test(exp) ? '×' : '') + '('; }
    else if (k === ')') { const o = (exp.match(/\(/g) || []).length, c = (exp.match(/\)/g) || []).length; if (o > c && /[\d)%]$/.test(exp)) exp += ')'; }
    else if (k === 'BK') exp = exp.slice(0, -1);
    else if (k === 'C') { exp = ''; ultimo = null; }
    else if (k === 'NEG') { try { const v = exp ? evaluar(exp) : ultimo; if (v !== null && v !== undefined) exp = (v < 0 ? String(-v) : '−' + v).replace('−-', ''); } catch (e) {} }
    else if (k === '=') { if (!exp) return; try { const r = evaluar(exp); hist.unshift({ e: exp, r: fmt(r, 10) }); ultimo = r; exp = ''; pintaHist(); $('c-res').textContent = fmt(r, 10); $('c-exp').textContent = hist[0].e + ' ='; return; } catch (e) { $('c-res').textContent = 'Error'; return; } }
    else if (k === 'MC') mem = 0;
    else if (k === 'MR') { exp += String(mem).replace('-', '−'); }
    else if (k === 'M+' || k === 'M-') { try { const v = exp ? evaluar(exp) : (ultimo || 0); mem += k === 'M+' ? v : -v; $('c-exp').textContent = 'Memoria: ' + fmt(mem, 10); return; } catch (e) { return; } }
    pintaCalc();
  }
  $('v-calc').addEventListener('click', e => {
    const b = e.target.closest('.ck'); if (b) return tecla(b.dataset.k);
    const h = e.target.closest('[data-i]'); if (h) { exp = hist[+h.dataset.i].r.replace(/-/g, '−'); pintaCalc(); }
  });
  addEventListener('keydown', e => {
    if (!$('v-calc').classList.contains('active') || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    const m = { '*': '×', '/': '÷', '-': '−', '+': '+', ',': '.', '.': '.', 'Enter': '=', '=': '=', 'Backspace': 'BK', 'Escape': 'C', '%': '%', '(': '(', ')': ')' };
    if (/^\d$/.test(e.key)) tecla(e.key); else if (m[e.key]) { e.preventDefault(); tecla(m[e.key]); }
  });
  pintaHist(); pintaCalc();

  // ---------- ARVIDALES (Firebase, colección "arvidales") ----------
  let arv = [], editArv = null;
  db.collection('arvidales').orderBy('nombre').onSnapshot(snap => {
    arv = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const s = $('cv-sel'), v = s.value;
    s.innerHTML = '<option value="">Selecciona el arvidal</option>' + arv.map(a => `<option value="${ESC(a.id)}">${ESC(a.nombre)}</option>`).join('');
    s.value = arv.some(a => a.id === v) ? v : ''; calcConv(); pintaAdmin();
  }, e => { $('cv-det').textContent = 'No se pudo leer la base de datos (revisa las reglas de Firestore).'; });

  function calcConv() {
    const a = arv.find(x => x.id === $('cv-sel').value), kg = num($('cv-kg').value);
    if (!a || kg === null) { $('cv-out').textContent = '0 m'; $('cv-det').textContent = a ? '' : 'Elige un arvidal y escribe los kilos'; return; }
    const m = kg * Number(a.factor);
    $('cv-out').textContent = fmt(m, 4) + ' m';
    $('cv-det').textContent = `${fmt(kg, 6)} kg × ${fmt(Number(a.factor), 8)} = ${fmt(m, 8)} m`;
  }
  $('cv-sel').onchange = calcConv; $('cv-kg').oninput = calcConv;

  // ---------- ADMIN ----------
  $('ad-go').onclick = () => {
    if ($('ad-pass').value === CLAVE_ADMIN) { $('ad-lock').classList.add('hidden'); $('ad-panel').classList.remove('hidden'); $('ad-pass').value = ''; pintaAdmin(); }
    else alert('Clave incorrecta');
  };
  $('ad-out').onclick = () => { $('ad-panel').classList.add('hidden'); $('ad-lock').classList.remove('hidden'); limpiaAdmin(); };
  function limpiaAdmin() { editArv = null; $('ad-nom').value = ''; $('ad-fac').value = ''; $('ad-tit').textContent = 'Nuevo arvidal'; }
  $('ad-can').onclick = limpiaAdmin;
  $('ad-sav').onclick = async () => {
    const nombre = $('ad-nom').value.trim(), factor = num($('ad-fac').value);
    if (!nombre || factor === null || factor <= 0) return alert('Escribe el nombre y un número de conversión válido.');
    try {
      if (editArv) await db.collection('arvidales').doc(editArv).update({ nombre, factor });
      else await db.collection('arvidales').add({ nombre, factor });
      limpiaAdmin();
    } catch (e) { alert('Error al guardar'); }
  };
  function pintaAdmin() {
    $('ad-list').innerHTML = arv.map(a => `<div class="arv-item"><div><b>${ESC(a.nombre)}</b><small>Conversión: ${fmt(Number(a.factor), 8)}</small></div>
      <div class="a"><button class="btn-del" style="color:#fff;border-color:var(--border)" data-ed="${ESC(a.id)}">✏️</button><button class="btn-del" data-del="${ESC(a.id)}">🗑️</button></div></div>`).join('') || '<div class="obs">Aún no hay arvidales registrados.</div>';
  }
  $('ad-list').addEventListener('click', async e => {
    const ed = e.target.closest('[data-ed]'), de = e.target.closest('[data-del]');
    if (ed) { const a = arv.find(x => x.id === ed.dataset.ed); editArv = a.id; $('ad-nom').value = a.nombre; $('ad-fac').value = String(a.factor).replace('.', ','); $('ad-tit').textContent = 'Editando arvidal'; scrollTo(0, 0); }
    if (de && confirm('¿Eliminar este arvidal?')) await db.collection('arvidales').doc(de.dataset.del).delete();
  });

  // ---------- METRO (regla horizontal) ----------
  let pxmm = parseFloat(localStorage.getItem('alp_pxmm')) || (96 / 25.4), modo = 'cero', ini = null, fin = null, midiendo = false, ORG = 24;
  const ov = document.createElement('div'); ov.id = 'metro-ov';
  ov.innerHTML = `<canvas id="m-cv"></canvas>
    <div id="metro-cal"><b>Calibrar</b><div style="font-size:.78rem;color:rgba(255,255,255,.7)">Apoya una tarjeta de banco o cédula (85,6 mm de ancho) sobre el recuadro y ajusta hasta que coincidan.</div>
      <div class="card" id="m-card"></div><input type="range" id="m-rng" min="2" max="9" step="0.005"><div id="m-val" style="font-size:.75rem;margin-bottom:8px"></div>
      <button class="btn btn-send" id="m-ok" style="margin:0">Guardar calibración</button></div>
    <div id="metro-bar"><button id="m-x">✕ Cerrar</button><button id="m-mod">Modo: desde 0</button><button id="m-cal">🎯 Calibrar</button></div>`;
  document.body.appendChild(ov);
  const cv = $('m-cv'), g = cv.getContext('2d');
  function layout() {
    const w = innerWidth, h = innerHeight, vert = h > w;
    ov.style.width = (vert ? h : w) + 'px'; ov.style.height = (vert ? w : h) + 'px';
    ov.style.transform = vert ? `translateX(${w}px) rotate(90deg)` : 'none';
    cv.width = cv.clientWidth * devicePixelRatio; cv.height = cv.clientHeight * devicePixelRatio; dibuja();
  }
  function dibuja() {
    const W = cv.clientWidth, H = cv.clientHeight, r = devicePixelRatio; g.setTransform(r, 0, 0, r, 0, 0);
    g.fillStyle = '#f4efd8'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#222'; g.fillStyle = '#222'; g.textAlign = 'center'; g.font = '700 13px sans-serif';
    const maxmm = (W - ORG) / pxmm;
    for (let i = 0; i <= maxmm; i++) { // cm y mm (arriba)
      const x = ORG + i * pxmm, t = i % 10 === 0 ? 30 : i % 5 === 0 ? 21 : 13;
      g.lineWidth = i % 10 === 0 ? 1.6 : 1; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, t); g.stroke();
      if (i % 10 === 0) g.fillText(String(i / 10), x, 46);
    }
    g.font = '600 11px sans-serif'; g.textAlign = 'left'; g.fillText('cm', 4, 46);
    const pin = 25.4 * pxmm; g.textAlign = 'center'; // pulgadas (abajo)
    for (let i = 0; i * pin / 16 <= W - ORG; i++) {
      const x = ORG + i * pin / 16, t = i % 16 === 0 ? 30 : i % 8 === 0 ? 24 : i % 4 === 0 ? 18 : i % 2 === 0 ? 12 : 8;
      g.lineWidth = i % 16 === 0 ? 1.6 : 1; g.beginPath(); g.moveTo(x, H); g.lineTo(x, H - t); g.stroke();
      if (i % 16 === 0) { g.font = '700 13px sans-serif'; g.fillText(String(i / 16), x, H - 36); }
    }
    g.textAlign = 'left'; g.font = '600 11px sans-serif'; g.fillText('in', 4, H - 36);
    if (ini !== null && fin !== null) {
      const a = Math.min(ini, fin), b = Math.max(ini, fin), y = H / 2, mm = (b - a) / pxmm;
      g.strokeStyle = '#d70015'; g.fillStyle = '#d70015'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(a, y); g.lineTo(b, y); g.stroke();
      g.lineWidth = 3; [a, b].forEach(x => { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); });
      g.textAlign = 'center'; g.font = '800 44px sans-serif';
      g.fillText((mm / 10).toFixed(2).replace('.', ',') + ' cm', W / 2, y - 22);
      g.font = '600 20px sans-serif'; g.fillStyle = '#333';
      g.fillText(mm.toFixed(1).replace('.', ',') + ' mm  ·  ' + (mm / 1000).toFixed(3).replace('.', ',') + ' m  ·  ' + (mm / 25.4).toFixed(2).replace('.', ',') + ' in', W / 2, y + 34);
    } else {
      g.fillStyle = '#555'; g.textAlign = 'center'; g.font = '600 18px sans-serif';
      g.fillText('Deja el dedo presionado y arrastra para medir', W / 2, H / 2);
    }
  }
  const lx = e => (innerHeight > innerWidth ? e.clientY : e.clientX);
  cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); midiendo = true; const x = lx(e); ini = modo === 'cero' ? ORG : x; fin = x; dibuja(); });
  cv.addEventListener('pointermove', e => { if (midiendo) { fin = Math.max(ORG, lx(e)); dibuja(); } });
  ['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, () => { midiendo = false; }));
  $('m-mod').onclick = () => { modo = modo === 'cero' ? 'puntos' : 'cero'; $('m-mod').textContent = modo === 'cero' ? 'Modo: desde 0' : 'Modo: entre 2 puntos'; ini = fin = null; dibuja(); };
  function pintaCal() { $('m-card').style.width = (85.6 * pxmm) + 'px'; $('m-card').style.height = (54 * pxmm) + 'px'; $('m-val').textContent = 'Ajuste: ' + pxmm.toFixed(3) + ' px/mm'; }
  $('m-cal').onclick = () => { $('m-rng').value = pxmm; pintaCal(); $('metro-cal').style.display = 'block'; };
  $('m-rng').oninput = e => { pxmm = parseFloat(e.target.value); pintaCal(); dibuja(); };
  $('m-ok').onclick = () => { localStorage.setItem('alp_pxmm', pxmm); $('metro-cal').style.display = 'none'; dibuja(); };
  function abreMetro() {
    ov.style.display = 'flex'; ini = fin = null;
    try { (document.documentElement.requestFullscreen || (() => Promise.reject())).call(document.documentElement).catch(() => {}); } catch (e) {}
    try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) {}
    setTimeout(layout, 60);
  }
  function cierraMetro() {
    ov.style.display = 'none'; $('metro-cal').style.display = 'none';
    try { screen.orientation.unlock(); } catch (e) {}
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
    switchTab('emisor');
  }
  $('m-x').onclick = cierraMetro;
  addEventListener('resize', () => { if (ov.style.display === 'flex') setTimeout(layout, 80); });

  // ---------- ENGANCHE A switchTab (sin tocar el original) ----------
  const orig = window.switchTab;
  window.switchTab = function (t) { orig(t); if (t === 'metro') abreMetro(); };

  // ---------- INSTRUCTIVO ----------
  const ent = document.querySelector('#modal-help .btn-send');
  if (ent) ent.insertAdjacentHTML('beforebegin', `
    <h3>🧮 CALCULADORA</h3><ul><li>En el menú ☰. Suma, resta, multiplica, divide, paréntesis y %. Tiene memoria (MC, MR, M+, M−), historial y funciona con el teclado. Ejemplo: 200 + 10% = 220.</li></ul>
    <h3>⚖️ CONVERSIÓN KG A METROS</h3><ul><li>Elige el <b>arvidal</b>, escribe los kilos y abajo ves cuántos <b>metros</b> sacar de la máquina (kilos × número de conversión, con todos sus decimales).</li></ul>
    <h3>🔐 ADMIN (ARVIDALES)</h3><ul><li>Entra con la clave única. Aquí registras, editas ✏️ o eliminas 🗑️ los arvidales y su número de conversión.</li></ul>
    <h3>📏 METRO</h3><ul><li>Abre una regla horizontal. Deja el dedo presionado y arrastra para medir (en cm, mm, m y pulgadas). <b>Calibra una vez</b> con una tarjeta de banco para que sea exacta.</li></ul>`);
})();
