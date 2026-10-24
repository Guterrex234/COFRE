'use strict';

(() => {
  const VERSION = '1.1.0';

  // ================= Utilidades =================
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const app = $('#app');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const safeColor = (c) => (/^#[0-9a-f]{6}$/i.test(c) ? c : '#8e8e93');
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const sum = (arr, f = (x) => x.amount) => arr.reduce((t, x) => t + (f(x) || 0), 0);

  // Moedas disponíveis. A formatação dos números segue o padrão brasileiro (1.234,56).
  const CURRENCIES = [
    ['EUR', 'Euro', '€'],
    ['BRL', 'Real', 'R$'],
    ['USD', 'Dólar americano', 'US$'],
    ['GBP', 'Libra esterlina', '£'],
    ['CHF', 'Franco suíço', 'CHF'],
  ];
  let FMT, FMT_SHORT;
  function setCurrency(code) {
    if (!CURRENCIES.some(([c]) => c === code)) code = 'EUR';
    FMT = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: code });
    FMT_SHORT = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: code, notation: 'compact', maximumFractionDigits: 1 });
  }
  setCurrency('EUR');
  const money = (c) => FMT.format((c || 0) / 100);
  const moneyShort = (c) => FMT_SHORT.format((c || 0) / 100);
  const centsToInput = (c) => (c / 100).toFixed(2).replace('.', ',').replace(/,00$/, '');
  // Lê valores digitados como "1.234,56" ou "1234.56"
  function parseMoney(str) {
    let s = String(str || '').replace(/[^\d,.-]/g, '');
    if (!s) return null;
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    else if ((s.match(/\./g) || []).length > 1 || /\.\d{3}$/.test(s)) s = s.replace(/\./g, '');
    const v = Math.round(parseFloat(s) * 100);
    return isFinite(v) ? v : null;
  }

  const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const pad = (n) => String(n).padStart(2, '0');
  const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d || 1); };
  const today = () => toISO(new Date());
  const monthOf = (iso) => iso.slice(0, 7);
  const monthLabel = (key) => { const [y, m] = key.split('-').map(Number); return `${MONTHS[m - 1]} ${y}`; };
  const monthShort = (key) => MONTHS[Number(key.slice(5, 7)) - 1].slice(0, 3);
  const fmtDay = (iso) => { const d = parseISO(iso); return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`; };
  const fmtDate = (iso) => { const d = parseISO(iso); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`; };
  const daysUntil = (iso) => Math.round((parseISO(iso) - parseISO(today())) / 86400000);
  function addMonths(iso, n) {
    const [y, m, d] = iso.split('-').map(Number);
    const date = new Date(y, m - 1 + n, 1);
    const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    date.setDate(Math.min(d, last));
    return toISO(date);
  }
  const shiftMonth = (key, n) => addMonths(key + '-01', n).slice(0, 7);
  const dayInMonth = (key, day) => { const [y, m] = key.split('-').map(Number); const last = new Date(y, m, 0).getDate(); return `${key}-${pad(Math.min(day, last))}`; };
  function relDay(iso) {
    const n = daysUntil(iso);
    if (n === 0) return 'Hoje';
    if (n === -1) return 'Ontem';
    const d = parseISO(iso);
    return `${d.getDate()} de ${MONTHS[d.getMonth()]}`;
  }
  function firstGrapheme(s) {
    s = String(s || '').trim();
    if (!s) return '';
    if (window.Intl && Intl.Segmenter) return [...new Intl.Segmenter().segment(s)][0].segment;
    return Array.from(s)[0];
  }
  function groupBy(items, keyFn) {
    const m = new Map();
    for (const it of items) { const k = keyFn(it); if (!m.has(k)) m.set(k, []); m.get(k).push(it); }
    return m;
  }
  const byDateDesc = (a, b) => b.date.localeCompare(a.date) || (b.at || 0) - (a.at || 0);
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  // ================= Ícones =================
  const svg = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const I = {
    logo: svg('<rect x="3" y="4" width="18" height="15" rx="4"/><circle cx="12" cy="11.5" r="3.6"/><path d="M12 7.9v1.2M12 13.9v1.2M8.4 11.5h1.2M14.4 11.5h1.2"/><path d="M7 19v2M17 19v2"/>'),
    bag: svg('<path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>'),
    wallet: svg('<path d="M19 8V6a2 2 0 0 0-2-2H6a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h13a2 2 0 0 0 2-2v-2"/><path d="M21 10h-5a2 2 0 0 0 0 4h5z"/>'),
    sliders: svg('<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
    chev: svg('<path d="M9 6l6 6-6 6"/>'),
    chevL: svg('<path d="M15 6l-6 6 6 6"/>'),
    up: svg('<path d="M6 15l6-6 6 6"/>'),
    down: svg('<path d="M6 9l6 6 6-6"/>'),
    check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    lock: svg('<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
    shield: svg('<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/>'),
    download: svg('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
    upload: svg('<path d="M12 16V5M7 10l5-5 5 5M5 20h14"/>'),
    trash: svg('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
    key: svg('<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/>'),
    tag: svg('<path d="M3 12V4h8l10 10-8 8L3 12z"/><circle cx="7.5" cy="7.5" r="1.5"/>'),
    palette: svg('<circle cx="12" cy="12" r="9"/><circle cx="8" cy="10" r="1.2"/><circle cx="12" cy="7.5" r="1.2"/><circle cx="16" cy="10" r="1.2"/>'),
    user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
    calendar: svg('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
    clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    cash: svg('<rect x="2" y="6" width="20" height="12" rx="3"/><circle cx="12" cy="12" r="2.5"/>'),
    moon: svg('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>'),
  };

  // ================= Dados padrão =================
  const COLORS = ['#5e5ce6', '#0a84ff', '#30b0c7', '#00a389', '#34c759', '#ffcc00', '#ff9500', '#ff3b30', '#ff2d55', '#bf5af2', '#a2845e', '#8e8e93'];
  const ACCENTS = ['#5e5ce6', '#0a84ff', '#00a389', '#1a9b52', '#ff9500', '#ff375f', '#bf5af2', '#3a3a3c'];
  const EMOJIS = ['📦', '🎁', '🚚', '📣', '💻', '📸', '🧾', '✨', '🏷️', '🧵', '👕', '👟', '💄', '🖨️', '📱', '🛒', '🏠', '🚗', '🎉', '💊', '📚', '💼', '💡', '💰', '🍔', '☕', '✈️', '🐶', '⚡', '💧', '🔧', '🎨'];
  const cat = (id, name, emoji, color) => ({ id, name, emoji, color });

  function defaultState(name, funding) {
    return {
      v: 1,
      profile: { name: name || '' },
      settings: { theme: 'auto', accent: ACCENTS[0], lockMinutes: 1, currency: 'EUR' },
      loja: {
        funding: funding || 0,
        cats: [
          cat('l1', 'Estoque / Produtos', '📦', '#5e5ce6'),
          cat('l2', 'Embalagem', '🎁', '#ff9500'),
          cat('l3', 'Frete', '🚚', '#30b0c7'),
          cat('l4', 'Anúncios / Tráfego', '📣', '#ff2d55'),
          cat('l5', 'Site / Plataforma', '💻', '#0a84ff'),
          cat('l6', 'Fotos / Conteúdo', '📸', '#bf5af2'),
          cat('l7', 'Taxas', '🧾', '#a2845e'),
          cat('l8', 'Outros', '✨', '#8e8e93'),
        ],
        expenses: [],
        sales: [],
        loan: null,
      },
      pessoal: {
        catsOut: [
          cat('o1', 'Moradia', '🏠', '#5e5ce6'),
          cat('o2', 'Mercado', '🛒', '#34c759'),
          cat('o3', 'Transporte', '🚗', '#0a84ff'),
          cat('o4', 'Contas', '⚡', '#ffcc00'),
          cat('o5', 'Lazer', '🎉', '#ff2d55'),
          cat('o6', 'Saúde', '💊', '#ff3b30'),
          cat('o7', 'Assinaturas', '📱', '#bf5af2'),
          cat('o8', 'Outros', '✨', '#8e8e93'),
        ],
        catsIn: [
          cat('i1', 'Salário', '💼', '#1a9b52'),
          cat('i2', 'Freela / Extra', '💡', '#00a389'),
          cat('i3', 'Outros', '💰', '#30b0c7'),
        ],
        txs: [],
        bills: [],
        boxes: [],
      },
    };
  }

  // Garante que dados antigos ou importados tenham todos os campos.
  function migrate(st) {
    const base = defaultState();
    st.profile = Object.assign({}, base.profile, st.profile);
    st.settings = Object.assign({}, base.settings, st.settings);
    st.loja = Object.assign({}, base.loja, st.loja);
    st.pessoal = Object.assign({}, base.pessoal, st.pessoal);
    for (const k of ['expenses', 'sales']) if (!Array.isArray(st.loja[k])) st.loja[k] = [];
    for (const k of ['txs', 'bills', 'boxes']) if (!Array.isArray(st.pessoal[k])) st.pessoal[k] = [];
    if (!st.loja.cats?.length) st.loja.cats = base.loja.cats;
    if (!st.pessoal.catsOut?.length) st.pessoal.catsOut = base.pessoal.catsOut;
    if (!st.pessoal.catsIn?.length) st.pessoal.catsIn = base.pessoal.catsIn;
    return st;
  }

  // ================= Estado =================
  let S = null; // dados descriptografados (só na memória enquanto desbloqueado)
  const ui = { tab: 'loja', lojaSeg: 'gastos', pesSeg: 'mes', catFilter: 'all', search: '', month: monthOf(today()) };

  let saveTimer = null;
  let saveChain = Promise.resolve();
  function commit() {
    render();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flushSave, 250);
  }
  function flushSave() {
    clearTimeout(saveTimer);
    saveTimer = null;
    if (!S) return saveChain;
    const snap = S;
    saveChain = saveChain.then(() => DB.save(snap)).catch((err) => { console.error(err); toast('Não foi possível salvar'); });
    return saveChain;
  }

  // Categorias: 'loja' | 'out' | 'in'
  const catList = (list) => (list === 'loja' ? S.loja.cats : list === 'in' ? S.pessoal.catsIn : S.pessoal.catsOut);
  const UNKNOWN = { name: 'Sem categoria', emoji: '❔', color: '#8e8e93' };
  const findCat = (list, id) => catList(list).find((c) => c.id === id) || UNKNOWN;
  function catUsage(list, id) {
    if (list === 'loja') return S.loja.expenses.filter((e) => e.catId === id).length;
    const t = S.pessoal.txs.filter((x) => x.catId === id && x.type === list).length;
    return list === 'out' ? t + S.pessoal.bills.filter((b) => b.catId === id).length : t;
  }
  function reassignCat(list, from, to) {
    if (list === 'loja') S.loja.expenses.forEach((e) => { if (e.catId === from) e.catId = to; });
    else {
      S.pessoal.txs.forEach((x) => { if (x.type === list && x.catId === from) x.catId = to; });
      if (list === 'out') S.pessoal.bills.forEach((b) => { if (b.catId === from) b.catId = to; });
    }
  }

  // ================= Aparência =================
  function onColor(hex) {
    const n = parseInt(hex.slice(1), 16);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? '#111111' : '#ffffff';
  }
  function applyLook(look) {
    const root = document.documentElement;
    if (look.theme === 'light' || look.theme === 'dark') root.dataset.theme = look.theme;
    else delete root.dataset.theme;
    const accent = safeColor(look.accent || ACCENTS[0]);
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--on-accent', onColor(accent));
    try { localStorage.setItem('cofre.look', JSON.stringify({ theme: look.theme, accent })); } catch {}
  }
  try { applyLook(JSON.parse(localStorage.getItem('cofre.look')) || {}); } catch { applyLook({}); }

  // ================= Toast =================
  let toastTimer;
  function toast(msg, undo) {
    const el = $('#toast');
    el.innerHTML = `<span>${esc(msg)}</span>${undo ? '<button type="button">Desfazer</button>' : ''}`;
    if (undo) el.querySelector('button').onclick = () => { el.classList.remove('show'); undo(); };
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), undo ? 4500 : 2400);
  }

  // ================= Bottom sheets =================
  const sheets = [];
  function openSheet(title, html, mount) {
    const root = $('#sheet-root');
    const bd = document.createElement('div');
    bd.className = 'backdrop';
    const sh = document.createElement('div');
    sh.className = 'sheet';
    sh.setAttribute('role', 'dialog');
    sh.setAttribute('aria-modal', 'true');
    sh.innerHTML = `<div class="sheet-grip"></div><div class="sheet-head"><h2>${esc(title)}</h2><button class="icon-btn" data-a="sheet-close" aria-label="Fechar">${I.close}</button></div><div class="sheet-body">${html}</div>`;
    root.append(bd, sh);
    const entry = { bd, sh, onClose: null, cleanups: [] };
    sheets.push(entry);
    bd.addEventListener('click', () => closeSheet(entry));
    enableSwipeDown(entry);
    requestAnimationFrame(() => requestAnimationFrame(() => { bd.classList.add('open'); sh.classList.add('open'); }));
    if (mount) mount(sh, entry);
    return entry;
  }
  function closeSheet(entry) {
    const i = entry ? sheets.indexOf(entry) : sheets.length - 1;
    if (i < 0) return;
    const [e] = sheets.splice(i, 1);
    e.bd.classList.remove('open');
    e.sh.classList.remove('open');
    e.sh.style.transform = '';
    e.cleanups.forEach((f) => f());
    setTimeout(() => { e.bd.remove(); e.sh.remove(); }, 380);
    if (e.onClose) e.onClose();
  }
  const closeAllSheets = () => { while (sheets.length) closeSheet(); };
  const isTop = (sh) => sheets.length && sheets[sheets.length - 1].sh === sh;
  const setBody = (entry, html) => { entry.sh.querySelector('.sheet-body').innerHTML = html; };

  function enableSwipeDown(entry) {
    const { sh } = entry;
    let y0 = null, dy = 0;
    const start = (e) => { y0 = e.touches[0].clientY; dy = 0; sh.style.transition = 'none'; };
    const move = (e) => { if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); sh.style.transform = `translateY(${dy}px)`; };
    const end = () => {
      if (y0 == null) return;
      sh.style.transition = '';
      sh.style.transform = '';
      if (dy > 110) closeSheet(entry);
      y0 = null;
    };
    for (const el of [sh.querySelector('.sheet-grip'), sh.querySelector('.sheet-head')]) {
      el.addEventListener('touchstart', start, { passive: true });
      el.addEventListener('touchmove', move, { passive: true });
      el.addEventListener('touchend', end);
    }
  }

  function confirmSheet({ title, msg, ok = 'Confirmar', danger = false, extra = '' }) {
    return new Promise((resolve) => {
      let answered = false;
      openSheet(title, `<p class="sheet-msg">${msg}</p>${extra}<div class="btn-row"><button class="btn" data-k="no">Cancelar</button><button class="btn ${danger ? 'danger' : 'primary'}" data-k="yes">${esc(ok)}</button></div>`, (sh, entry) => {
        entry.onClose = () => { if (!answered) resolve(null); };
        sh.addEventListener('click', (e) => {
          const k = e.target.closest('[data-k]')?.dataset.k;
          if (k === 'yes') { answered = true; resolve(sh); closeSheet(entry); }
          if (k === 'no') closeSheet(entry);
        });
      });
    });
  }

  // ================= Calculadora (campo de valor) =================
  const CALC_KEYS = ['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '-', ',', '0', '⌫', '+'];
  const CALC_LABEL = { '÷': 'dividir', '×': 'multiplicar', '-': 'menos', '+': 'mais', '⌫': 'apagar', ',': 'vírgula' };
  function amountHTML() {
    return `<div class="amount" data-r="amount"><div class="expr"></div><div class="val num"></div></div>
      <div class="calc">${CALC_KEYS.map((k) => `<button type="button" data-c="${k}" class="${'÷×-+'.includes(k) ? 'op' : k === '⌫' ? 'fn' : ''}"${CALC_LABEL[k] ? ` aria-label="${CALC_LABEL[k]}"` : ''}>${k === '-' ? '−' : k}</button>`).join('')}</div>`;
  }
  function mountAmount(root, initial, { isActive, entry, onEnter } = {}) {
    let expr = initial ? centsToInput(initial) : '';
    const box = root.querySelector('[data-r=amount]');
    const exprEl = box.querySelector('.expr');
    const valEl = box.querySelector('.val');
    const OPS = '+-×÷';
    function draw() {
      const v = expr ? Calc.evaluate(expr) : 0;
      const hasOp = Calc.hasOperator(expr);
      exprEl.textContent = hasOp ? expr.replace(/([+×÷-])/g, ' $1 ').replace(/-/g, '−') : '';
      valEl.textContent = v == null ? '—' : (hasOp ? '= ' : '') + money(v);
      valEl.classList.toggle('zero', !v);
      box.classList.remove('err');
    }
    function press(k) {
      const last = expr.slice(-1);
      const cur = expr.split(/[+×÷-]/).pop();
      if (k === '⌫') expr = expr.slice(0, -1);
      else if (k === 'C') expr = '';
      else if (OPS.includes(k)) {
        if (!expr) return;
        expr = OPS.includes(last) || last === ',' ? expr.slice(0, -1) + k : expr + k;
      } else if (k === ',') {
        if (cur.includes(',')) return;
        expr += cur === '' ? '0,' : ',';
      } else {
        const dec = cur.split(',')[1];
        if ((dec !== undefined && dec.length >= 2) || expr.length >= 40) return;
        if (cur === '0') expr = expr.slice(0, -1);
        expr += k;
      }
      draw();
    }
    const calc = root.querySelector('.calc');
    calc.addEventListener('click', (e) => { const b = e.target.closest('[data-c]'); if (b) press(b.dataset.c); });
    // segurar o ⌫ limpa tudo
    let holdTimer;
    const back = calc.querySelector('[data-c="⌫"]');
    back.addEventListener('pointerdown', () => { holdTimer = setTimeout(() => { expr = ''; draw(); }, 550); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => back.addEventListener(ev, () => clearTimeout(holdTimer)));
    // teclado físico (computador)
    const onKey = (e) => {
      if (isActive && !isActive()) return;
      if (e.target.matches('input, textarea, select')) return;
      const map = { '*': '×', x: '×', '/': '÷', '.': ',', Backspace: '⌫', Delete: 'C', Escape: null };
      let k = e.key in map ? map[e.key] : e.key;
      if (e.key === 'Enter') { e.preventDefault(); onEnter && onEnter(); return; }
      if (k && (/^[0-9]$/.test(k) || OPS.includes(k) || k === ',' || k === '⌫' || k === 'C')) { e.preventDefault(); press(k); }
    };
    document.addEventListener('keydown', onKey);
    if (entry) entry.cleanups.push(() => document.removeEventListener('keydown', onKey));
    draw();
    return {
      get() {
        const v = expr ? Calc.evaluate(expr) : null;
        if (!v || v <= 0) { box.classList.add('err'); return null; }
        return v;
      },
      destroy: () => document.removeEventListener('keydown', onKey),
    };
  }

  // ================= Teclado de PIN =================
  function pinHTML(title, sub, left = '') {
    return `<div class="lock fade-in">
      <div class="logo">${I.logo}</div>
      <h1 data-r="t">${esc(title)}</h1>
      <p class="sub" data-r="s">${esc(sub)}</p>
      <div class="pin-dots" data-r="dots" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
      <div class="keypad">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button type="button" data-p="${n}">${n}</button>`).join('')}
        <button type="button" class="plain" data-p="left">${esc(left)}</button>
        <button type="button" data-p="0">0</button>
        <button type="button" class="plain" data-p="del" aria-label="Apagar">⌫</button>
      </div>
      <div class="lock-msg" data-r="msg"></div>
    </div>`;
  }
  function mountPin(root, { onComplete, onLeft, isActive, entry }) {
    let pin = '';
    let busy = false;
    const dots = root.querySelector('[data-r=dots]');
    const msg = root.querySelector('[data-r=msg]');
    const draw = () => $$('span', dots).forEach((s, i) => s.classList.toggle('on', i < pin.length));
    const api = {
      setTitle: (t) => { root.querySelector('[data-r=t]').textContent = t; },
      setSub: (t) => { root.querySelector('[data-r=s]').textContent = t; },
      msg: (t) => { msg.textContent = t || ''; },
      reset: () => { pin = ''; draw(); },
      busy: (b) => {
        busy = b;
        msg.innerHTML = b ? '<div class="spinner" style="margin:0 auto"></div>' : '';
      },
      disable: (b) => { $$('.keypad button:not(.plain)', root).forEach((x) => (x.disabled = b)); busy = b; },
      error: (t) => {
        dots.classList.remove('shake');
        void dots.offsetWidth;
        dots.classList.add('shake');
        msg.textContent = t || '';
        setTimeout(() => { dots.classList.remove('shake'); pin = ''; draw(); }, 450);
      },
    };
    function press(p) {
      if (p === 'left') { onLeft && onLeft(); return; }
      if (busy) return;
      if (p === 'del') pin = pin.slice(0, -1);
      else if (pin.length < 4) pin += p;
      draw();
      if (pin.length === 4) { const done = pin; setTimeout(() => onComplete(done, api), 120); }
    }
    root.querySelector('.keypad').addEventListener('click', (e) => { const b = e.target.closest('[data-p]'); if (b && !b.disabled) press(b.dataset.p); });
    const onKey = (e) => {
      if (isActive && !isActive()) return;
      if (e.target.matches('input, textarea, select')) return;
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('del');
    };
    document.addEventListener('keydown', onKey);
    if (entry) entry.cleanups.push(() => document.removeEventListener('keydown', onKey));
    else screenCleanups.push(() => document.removeEventListener('keydown', onKey));
    return api;
  }

  // Limpeza de listeners das telas cheias (bloqueio/boas-vindas)
  let screenCleanups = [];
  function clearScreen() {
    screenCleanups.forEach((f) => f());
    screenCleanups = [];
  }

  // ================= Bloqueio =================
  const FAILS_KEY = 'cofre.fails';
  const getFails = () => { try { return JSON.parse(localStorage.getItem(FAILS_KEY)) || { n: 0, until: 0 }; } catch { return { n: 0, until: 0 }; } };
  const setFails = (f) => { try { localStorage.setItem(FAILS_KEY, JSON.stringify(f)); } catch {} };

  function renderLock() {
    clearScreen();
    closeAllSheets();
    S = null;
    app.innerHTML = pinHTML('Cofre', 'Digite seu PIN para entrar', 'Esqueci');
    const api = mountPin(app, {
      isActive: () => !sheets.length,
      onLeft: forgotPin,
      onComplete: async (pin) => {
        api.busy(true);
        try {
          const st = await DB.unlock(pin);
          setFails({ n: 0, until: 0 });
          S = migrate(st);
          afterUnlock();
        } catch {
          const f = getFails();
          f.n += 1;
          if (f.n >= 5) f.until = Date.now() + Math.min(30000 * 2 ** (f.n - 5), 15 * 60000);
          setFails(f);
          api.busy(false);
          api.error(f.n >= 5 ? '' : `PIN incorreto${f.n >= 3 ? ` · ${5 - f.n} tentativa(s) antes de esperar` : ''}`);
          checkLockout(api);
        }
      },
    });
    checkLockout(api);
  }
  function checkLockout(api) {
    const tick = () => {
      const left = getFails().until - Date.now();
      if (left <= 0) return false;
      const s = Math.ceil(left / 1000);
      api.disable(true);
      api.msg(`Muitas tentativas. Tente de novo em ${Math.floor(s / 60)}:${pad(s % 60)}`);
      return true;
    };
    if (tick()) {
      const t = setInterval(() => {
        if (tick()) return;
        clearInterval(t);
        api.disable(false);
        api.msg('');
      }, 1000);
      screenCleanups.push(() => clearInterval(t));
    }
  }
  async function forgotPin() {
    const ok = await confirmSheet({
      title: 'Esqueceu o PIN?',
      msg: 'Por segurança, <b>não existe forma de recuperar o PIN</b>. Seus dados ficam criptografados só neste aparelho e ninguém tem acesso a eles.<br><br>Você pode apagar tudo e começar de novo. Depois, se tiver um backup, é só restaurar.',
      ok: 'Apagar e recomeçar',
      danger: true,
    });
    if (!ok) return;
    const sure = await confirmSheet({ title: 'Tem certeza?', msg: 'Todos os dados deste aparelho serão apagados. Isso não pode ser desfeito.', ok: 'Apagar tudo', danger: true });
    if (sure) await wipeAll();
  }
  async function wipeAll() {
    await DB.wipe();
    try { ['cofre.fails', 'cofre.look'].forEach((k) => localStorage.removeItem(k)); } catch {}
    location.reload();
  }

  async function lock() {
    if (!S) return;
    await flushSave();
    DB.lock();
    renderLock();
  }

  // Bloqueio automático: ao sair do app e por inatividade
  let hiddenAt = 0;
  let idleTimer = null;
  document.addEventListener('visibilitychange', async () => {
    if (!S) return;
    if (document.hidden) {
      hiddenAt = Date.now();
      await flushSave();
      if (S && S.settings.lockMinutes === 0) lock();
    } else if (hiddenAt && Date.now() - hiddenAt >= S.settings.lockMinutes * 60000) lock();
  });
  function resetIdle() {
    clearTimeout(idleTimer);
    if (!S) return;
    idleTimer = setTimeout(lock, Math.max(S.settings.lockMinutes, 3) * 60000);
  }
  ['pointerdown', 'keydown'].forEach((ev) => document.addEventListener(ev, resetIdle, { passive: true }));
  window.addEventListener('pagehide', () => { if (S) flushSave(); });

  function afterUnlock() {
    clearScreen();
    applyLook(S.settings);
    setCurrency(S.settings.currency);
    ui.month = monthOf(today());
    resetIdle();
    render();
  }

  // ================= Boas-vindas =================
  function renderOnboarding(step = 0, data = {}) {
    clearScreen();
    const back = step > 0 ? `<button class="icon-btn" data-o="back" aria-label="Voltar">${I.chevL}</button>` : '';
    const steps = (n) => `<div class="steps">${[1, 2, 3].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</div>`;

    if (step === 0) {
      app.innerHTML = `<div class="onb fade-in"><div class="onb-body">
        <div class="logo">${I.logo}</div>
        <h1>Seu dinheiro,<br>organizado.</h1>
        <p>Controle o financiamento da loja e suas finanças pessoais em um só lugar.</p>
        <div class="bullets">
          <div class="bullet"><span class="ico">🏪</span><div><b>Loja e pessoal separados</b><span>Saiba exatamente quanto do financiamento já foi usado.</span></div></div>
          <div class="bullet"><span class="ico">🔒</span><div><b>Protegido por PIN</b><span>Tudo criptografado e guardado só neste aparelho.</span></div></div>
          <div class="bullet"><span class="ico">✈️</span><div><b>Funciona sem internet</b><span>Nenhum dado sai do seu iPhone. Nunca.</span></div></div>
        </div>
      </div>
      <button class="btn primary block" data-o="next">Começar</button>
      <button class="btn link block" data-o="restore">Já tenho um backup</button></div>`;
    } else if (step === 1) {
      app.innerHTML = `<div class="onb fade-in">${back}<div class="onb-body">
        ${steps(1)}
        <h1>Como podemos<br>te chamar?</h1>
        <input class="big-input" data-r="name" maxlength="30" placeholder="Seu nome" autocomplete="given-name" value="${esc(data.name || '')}">
      </div><button class="btn primary block" data-o="next">Continuar</button></div>`;
      const inp = $('[data-r=name]');
      setTimeout(() => inp.focus(), 300);
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') $('[data-o=next]').click(); });
    } else if (step === 2 || step === 3) {
      const confirm = step === 3;
      app.innerHTML = `<div class="back-float">${back}</div>` + pinHTML(confirm ? 'Confirme seu PIN' : 'Crie seu PIN', confirm ? 'Digite os mesmos 4 dígitos' : '4 dígitos para proteger seus dados');
      const api = mountPin(app, {
        isActive: () => !sheets.length,
        onComplete: (pin) => {
          if (!confirm) return renderOnboarding(3, { ...data, pin });
          if (pin !== data.pin) {
            api.error('Os PINs não conferem. Vamos de novo.');
            setTimeout(() => renderOnboarding(2, { ...data, pin: null }), 1200);
            return;
          }
          renderOnboarding(4, data);
        },
      });
    } else if (step === 4) {
      app.innerHTML = `<div class="onb fade-in">${back}<div class="onb-body" style="justify-content:flex-start;padding-top:12px">
        ${steps(3)}
        <h1>Qual o valor total<br>do financiamento?</h1>
        <p>É dele que o app vai descontando os gastos da loja. Dá pra mudar depois.</p>
        <div style="margin-top:8px">${amountHTML()}</div>
      </div>
      <button class="btn primary block" data-o="finish">Concluir</button>
      <button class="btn link block" data-o="skip">Pular por enquanto</button></div>`;
      const amt = mountAmount(app, data.funding, { onEnter: () => $('[data-o=finish]').click() });
      screenCleanups.push(amt.destroy);
      data.getFunding = () => amt.get();
    }

    $$('[data-o]', app).forEach((b) => b.addEventListener('click', async () => {
      const o = b.dataset.o;
      if (o === 'back') return renderOnboarding(step === 3 ? 2 : step - 1, data);
      if (o === 'restore') return restoreAtStart();
      if (o === 'next' && step === 0) return renderOnboarding(1, data);
      if (o === 'next' && step === 1) {
        const name = $('[data-r=name]').value.trim();
        return renderOnboarding(2, { ...data, name });
      }
      if (o === 'finish' || o === 'skip') {
        const funding = o === 'skip' ? 0 : data.getFunding();
        if (o === 'finish' && funding == null) return;
        b.disabled = true;
        b.innerHTML = '<div class="spinner" style="border-top-color:currentColor"></div>';
        const st = defaultState(data.name, funding);
        await DB.create(data.pin, st);
        S = st;
        afterUnlock();
        toast(data.name ? `Tudo pronto, ${data.name}! 🎉` : 'Tudo pronto! 🎉');
      }
    }));
  }

  function pickFile() {
    return new Promise((resolve) => {
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = '.json,application/json';
      inp.className = 'hidden';
      document.body.append(inp);
      inp.addEventListener('change', async () => {
        const f = inp.files[0];
        inp.remove();
        if (!f) return resolve(null);
        try { resolve(JSON.parse(await f.text())); } catch { toast('Arquivo inválido'); resolve(null); }
      });
      inp.click();
    });
  }

  // Pede o PIN de um backup numa folha. Resolve com { pin, state } ou null.
  function askBackupPin(file, title = 'PIN do backup') {
    return new Promise((resolve) => {
      let done = false;
      openSheet(title, pinHTML('Digite o PIN', 'Use o PIN que estava ativo quando o backup foi feito'), (sh, entry) => {
        entry.onClose = () => { if (!done) resolve(null); };
        const api = mountPin(sh, {
          entry,
          isActive: () => isTop(sh),
          onComplete: async (pin) => {
            api.busy(true);
            try {
              const state = await DB.readBackup(file, pin);
              done = true;
              resolve({ pin, state: migrate(state) });
              closeSheet(entry);
            } catch (e) {
              api.busy(false);
              api.error(e.message === 'arquivo' ? 'Este arquivo não é um backup do Cofre' : 'PIN incorreto');
            }
          },
        });
      });
    });
  }

  async function restoreAtStart() {
    const file = await pickFile();
    if (!file) return;
    const res = await askBackupPin(file);
    if (!res) return;
    await DB.create(res.pin, res.state);
    S = res.state;
    afterUnlock();
    toast('Backup restaurado ✅');
  }

  // ================= Render principal =================
  function render() {
    if (!S) return;
    const old = $('.view');
    const keepScroll = old && old.dataset.tab === ui.tab ? old.scrollTop : 0;
    const chipScroll = {};
    $$('[data-keep]').forEach((el) => (chipScroll[el.dataset.keep] = el.scrollLeft));
    const body = ui.tab === 'loja' ? lojaView() : ui.tab === 'pessoal' ? pessoalView() : settingsView();
    app.innerHTML = `<main class="view" data-tab="${ui.tab}">${body}</main>${fabHTML()}${tabbarHTML()}`;
    $('.view').scrollTop = keepScroll;
    $$('[data-keep]').forEach((el) => { if (chipScroll[el.dataset.keep]) el.scrollLeft = chipScroll[el.dataset.keep]; });
  }

  function tabbarHTML() {
    const t = (id, icon, label) => `<button class="tab ${ui.tab === id ? 'active' : ''}" data-a="tab" data-v="${id}" aria-label="${label}">${icon}<span>${label}</span></button>`;
    return `<nav class="tabbar">${t('loja', I.bag, 'Loja')}${t('pessoal', I.wallet, 'Pessoal')}${t('ajustes', I.sliders, 'Ajustes')}</nav>`;
  }

  function fabHTML() {
    let label = null;
    if (ui.tab === 'loja') label = { gastos: 'Gasto', vendas: 'Venda', analise: 'Gasto' }[ui.lojaSeg];
    if (ui.tab === 'pessoal') label = { mes: 'Lançar', contas: 'Conta fixa', caixinhas: 'Caixinha' }[ui.pesSeg];
    return label ? `<button class="fab" data-a="fab">${I.plus}<span>${label}</span></button>` : '';
  }

  const pageHead = (title, hello = '') => `<header class="page-head"><div>${hello ? `<div class="hello">${esc(hello)}</div>` : ''}<h1>${esc(title)}</h1></div><button class="icon-btn" data-a="lock" aria-label="Bloquear agora">${I.lock}</button></header>`;
  const seg = (action, current, items) => `<div class="seg" role="tablist">${items.map(([v, l]) => `<button role="tab" class="${current === v ? 'active' : ''}" data-a="${action}" data-v="${v}">${l}</button>`).join('')}</div>`;
  const emptyHTML = (em, title, text, btn = '') => `<div class="empty fade-in"><div class="em">${em}</div><b>${title}</b>${text}${btn}</div>`;
  function rowHTML({ a, id, emoji, color, title, sub, amt, amtClass = '' }) {
    return `<button class="row" data-a="${a}" data-id="${esc(id)}">
      <span class="row-icon" style="--c:${safeColor(color)}">${esc(emoji)}</span>
      <span class="row-main"><span class="row-title">${esc(title)}</span><span class="row-sub">${esc(sub)}</span></span>
      <span class="row-amt num ${amtClass}">${amt}</span></button>`;
  }
  const greeting = () => {
    const h = new Date().getHours();
    const g = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
    return S.profile.name ? `${g}, ${S.profile.name}` : g;
  };

  // ---------- Loja ----------
  function lojaView() {
    const L = S.loja;
    const spent = sum(L.expenses);
    const monthSpent = sum(L.expenses.filter((e) => monthOf(e.date) === monthOf(today())));
    const left = L.funding - spent;
    const pct = L.funding ? Math.min(100, (spent / L.funding) * 100) : 0;
    const hero = L.funding
      ? `<div class="hero" data-a="edit-funding" role="button" aria-label="Editar valor do financiamento">
          <div class="hero-label">Saldo do financiamento</div>
          <div class="hero-value num ${left < 0 ? 'neg' : ''}">${money(left)}</div>
          <div class="hero-of">de ${money(L.funding)} · ${pct.toFixed(pct < 10 && pct > 0 ? 1 : 0).replace('.', ',')}% usado</div>
          <div class="progress"><i style="width:${pct}%"></i></div>
          <div class="hero-stats"><div>Total gasto<b class="num">${money(spent)}</b></div><div>Gasto este mês<b class="num">${money(monthSpent)}</b></div></div>
        </div>`
      : `<div class="hero"><div class="hero-label">Financiamento</div><div class="hero-value" style="font-size:26px">Quanto você pegou?</div>
          <div class="hero-of">Informe o valor total e o app vai descontando cada gasto da loja.</div>
          <button class="hero-cta" data-a="edit-funding">Definir valor</button></div>`;

    let content = '';
    if (ui.lojaSeg === 'gastos') {
      content = `<div class="chips" data-keep="cats">
          <button class="chip ${ui.catFilter === 'all' ? 'active' : ''}" data-a="cat-filter" data-v="all">Todos</button>
          ${L.cats.map((c) => `<button class="chip ${ui.catFilter === c.id ? 'active' : ''}" data-a="cat-filter" data-v="${esc(c.id)}">${esc(c.emoji)} ${esc(c.name)}</button>`).join('')}
        </div>
        ${L.expenses.length ? `<label class="search">${I.search}<input type="search" data-in="search" placeholder="Buscar gastos" value="${esc(ui.search)}" aria-label="Buscar gastos"></label>` : ''}
        <div id="exp-list">${expensesListHTML()}</div>`;
    } else if (ui.lojaSeg === 'vendas') content = salesHTML();
    else if (ui.lojaSeg === 'parcelas') content = loanHTML();
    else content = analysisHTML();

    return `${pageHead('Loja', greeting())}${hero}
      ${seg('seg-loja', ui.lojaSeg, [['gastos', 'Gastos'], ['vendas', 'Vendas'], ['parcelas', 'Parcelas'], ['analise', 'Análise']])}
      ${content}`;
  }

  function expensesListHTML() {
    const L = S.loja;
    if (!L.expenses.length) return emptyHTML('🧾', 'Nenhum gasto ainda', 'Toque em <b>+ Gasto</b> para lançar o primeiro.');
    const q = norm(ui.search);
    const items = L.expenses
      .filter((e) => (ui.catFilter === 'all' || e.catId === ui.catFilter) && (!q || norm(`${e.desc} ${findCat('loja', e.catId).name}`).includes(q)))
      .sort(byDateDesc);
    if (!items.length) return emptyHTML('🔍', 'Nada encontrado', 'Tente outro filtro ou outra busca.');
    let html = '';
    for (const [m, list] of groupBy(items, (e) => monthOf(e.date))) {
      html += `<div class="group-head"><span>${monthLabel(m)}</span><span class="num">${money(sum(list))}</span></div><div class="list">`;
      html += list.map((e) => {
        const c = findCat('loja', e.catId);
        return rowHTML({ a: 'edit-expense', id: e.id, emoji: c.emoji, color: c.color, title: e.desc || c.name, sub: `${e.desc ? c.name + ' · ' : ''}${fmtDay(e.date)}`, amt: money(e.amount) });
      }).join('');
      html += '</div>';
    }
    return html;
  }

  function salesHTML() {
    const L = S.loja;
    const sales = sum(L.sales);
    const spent = sum(L.expenses);
    const result = sales - spent;
    const monthSales = sum(L.sales.filter((s) => monthOf(s.date) === monthOf(today())));
    let html = `<div class="stat-grid">
      <div class="stat"><span>Vendas</span><b class="num pos">${money(sales)}</b></div>
      <div class="stat"><span>Gastos</span><b class="num">${money(spent)}</b></div>
      <div class="stat wide"><span>Resultado (vendas − gastos)</span><b class="num ${result >= 0 ? 'pos' : ''}" style="${result < 0 ? 'color:var(--red)' : ''}">${result >= 0 ? '' : '−'}${money(Math.abs(result))}</b>
      <span>Vendas este mês: <b class="num" style="display:inline;font-size:13px">${money(monthSales)}</b></span></div>
    </div>`;
    if (!L.sales.length) return html + emptyHTML('🛍️', 'Nenhuma venda registrada', 'Registre suas vendas para ver se o dinheiro está voltando.');
    for (const [m, list] of groupBy([...L.sales].sort(byDateDesc), (s) => monthOf(s.date))) {
      html += `<div class="group-head"><span>${monthLabel(m)}</span><span class="num">${money(sum(list))}</span></div><div class="list">`;
      html += list.map((s) => rowHTML({ a: 'edit-sale', id: s.id, emoji: '💸', color: '#1a9b52', title: s.desc || 'Venda', sub: fmtDay(s.date), amt: '+' + money(s.amount), amtClass: 'pos' })).join('');
      html += '</div>';
    }
    return html;
  }

  function loanInstallments(loan) {
    return Array.from({ length: loan.count }, (_, i) => ({ i, due: addMonths(loan.firstDue, i), paid: !!loan.paid[i] }));
  }
  function duePill(due, paid) {
    if (paid) return '<span class="pill ok">Paga</span>';
    const n = daysUntil(due);
    if (n < 0) return '<span class="pill late">Atrasada</span>';
    if (n === 0) return '<span class="pill due">Vence hoje</span>';
    if (n <= 7) return `<span class="pill due">Em ${plural(n, 'dia', 'dias')}</span>`;
    return '';
  }

  function loanHTML() {
    const loan = S.loja.loan;
    if (!loan) return emptyHTML('🏦', 'Parcelas do financiamento', 'Cadastre as parcelas para acompanhar quantas já pagou e quanto falta.', '<button class="btn primary" data-a="loan-setup">Configurar parcelas</button>');
    const inst = loanInstallments(loan);
    const paid = inst.filter((x) => x.paid).length;
    const next = inst.find((x) => !x.paid);
    const pct = (paid / loan.count) * 100;
    let html = `<div class="card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
        <div><div style="font-size:13px;color:var(--muted);font-weight:600">Parcelas pagas</div>
        <div style="font-size:30px;font-weight:800;letter-spacing:-0.03em" class="num">${paid} <span style="color:var(--faint);font-weight:700">de ${loan.count}</span></div></div>
        <button class="btn sm" data-a="loan-setup">Editar</button>
      </div>
      <div class="mini-progress" style="height:8px;margin:12px 0 14px;--c:var(--green)"><i style="width:${pct}%"></i></div>
      <div class="stat-grid" style="margin:0">
        <div><span style="font-size:13px;color:var(--muted)">Já pago</span><b class="num" style="display:block;font-size:17px">${money(paid * loan.amount)}</b></div>
        <div><span style="font-size:13px;color:var(--muted)">Falta pagar</span><b class="num" style="display:block;font-size:17px">${money((loan.count - paid) * loan.amount)}</b></div>
      </div>
      ${next ? `<div class="hint" style="margin:12px 0 0">Próxima: <b>${fmtDate(next.due)}</b> · ${money(loan.amount)} ${duePill(next.due, false)}</div>` : '<div class="hint" style="margin:12px 0 0">🎉 Financiamento quitado!</div>'}
    </div>
    <div class="group-head"><span>Todas as parcelas</span><span>Toque para marcar</span></div><div class="list">`;
    html += inst.map((x) => `<button class="row" data-a="toggle-inst" data-i="${x.i}" aria-pressed="${x.paid}">
        <span class="check ${x.paid ? 'on' : ''}">${I.check}</span>
        <span class="row-main"><span class="row-title">Parcela ${x.i + 1} de ${loan.count}</span><span class="row-sub">Vence ${fmtDate(x.due)}</span></span>
        <span class="row-amt num" style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">${money(loan.amount)}${duePill(x.due, x.paid)}</span>
      </button>`).join('');
    return html + '</div>';
  }

  function donutHTML(parts, total, centerLabel) {
    const r = 54, C = 2 * Math.PI * r;
    let off = 0;
    const segs = parts.map((p) => {
      const len = (p.value / total) * C;
      const s = `<circle r="${r}" cx="70" cy="70" fill="none" stroke="${safeColor(p.color)}" stroke-width="20" stroke-dasharray="${Math.max(len - 1.5, 0.01)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 70 70)"/>`;
      off += len;
      return s;
    }).join('');
    return `<svg class="donut" viewBox="0 0 140 140" role="img" aria-label="Gráfico de gastos por categoria">
      <circle r="${r}" cx="70" cy="70" fill="none" stroke="var(--fill)" stroke-width="20"/>${segs}
      <text x="70" y="66" text-anchor="middle" font-size="11" fill="currentColor" opacity=".6">${esc(centerLabel)}</text>
      <text x="70" y="84" text-anchor="middle" font-size="17" font-weight="800">${esc(moneyShort(total))}</text></svg>`;
  }

  function catBarsHTML(parts, total) {
    return `<div class="cat-bars">${parts.map((p) => `<div>
      <div class="cat-bar-top"><span>${esc(p.emoji)} ${esc(p.name)}</span><span class="num">${money(p.value)} · ${Math.round((p.value / total) * 100)}%</span></div>
      <div class="mini-progress" style="--c:${safeColor(p.color)}"><i style="width:${(p.value / parts[0].value) * 100}%"></i></div></div>`).join('')}</div>`;
  }

  function byCategory(items, list) {
    const totals = new Map();
    items.forEach((x) => totals.set(x.catId, (totals.get(x.catId) || 0) + x.amount));
    return [...totals].map(([id, value]) => ({ ...findCat(list, id), value })).sort((a, b) => b.value - a.value);
  }

  function analysisHTML() {
    const ex = S.loja.expenses;
    if (!ex.length) return emptyHTML('📊', 'Ainda sem dados', 'Lance alguns gastos para ver para onde o dinheiro está indo.');
    const total = sum(ex);
    const parts = byCategory(ex, 'loja');
    const cur = monthOf(today());
    const months = Array.from({ length: 6 }, (_, i) => shiftMonth(cur, i - 5));
    const vals = months.map((m) => sum(ex.filter((e) => monthOf(e.date) === m)));
    const max = Math.max(...vals, 1);
    return `<div class="card"><div class="card-title" style="margin:0 0 14px">Gastos por categoria</div>
        <div class="donut-wrap">${donutHTML(parts, total, 'Total')}
        <div class="legend">${parts.slice(0, 6).map((p) => `<div><i style="--c:${safeColor(p.color)}"></i><span>${esc(p.name)}</span><b>${Math.round((p.value / total) * 100)}%</b></div>`).join('')}</div></div>
        ${catBarsHTML(parts, total)}
      </div>
      <div class="card"><div class="card-title" style="margin:0">Últimos 6 meses</div>
        <div class="bars">${months.map((m, i) => `<div class="bar ${m === cur ? 'cur' : ''}"><small class="num">${vals[i] ? moneyShort(vals[i]) : ''}</small><i style="height:${(vals[i] / max) * 100}%"></i><span>${monthShort(m)}</span></div>`).join('')}</div>
      </div>`;
  }

  // ---------- Pessoal ----------
  function pessoalView() {
    const P = S.pessoal;
    const m = ui.month;
    const txs = P.txs.filter((t) => monthOf(t.date) === m);
    const inc = sum(txs.filter((t) => t.type === 'in'));
    const out = sum(txs.filter((t) => t.type === 'out'));
    const saved = sum(P.boxes, (b) => b.balance);
    const left = inc - out;
    const monthName = MONTHS[Number(m.slice(5)) - 1];

    let content = '';
    if (ui.pesSeg === 'mes') content = monthTxHTML(txs, out);
    else if (ui.pesSeg === 'contas') content = billsHTML();
    else content = boxesHTML();

    return `${pageHead('Pessoal', greeting())}
      ${ui.pesSeg !== 'caixinhas' ? `<div class="month-nav"><button class="icon-btn" data-a="month" data-v="-1" aria-label="Mês anterior">${I.chevL}</button><b>${monthLabel(m)}</b><button class="icon-btn" data-a="month" data-v="1" aria-label="Próximo mês">${I.chev}</button></div>` : ''}
      <div class="hero">
        <div class="hero-label">Sobrou em ${monthName}</div>
        <div class="hero-value num ${left < 0 ? 'neg' : ''}">${left < 0 ? '−' : ''}${money(Math.abs(left))}</div>
        <div class="trio"><div>Entrou<b class="num">${money(inc)}</b></div><div>Saiu<b class="num">${money(out)}</b></div><div>Guardado<b class="num">${money(saved)}</b></div></div>
      </div>
      ${seg('seg-pes', ui.pesSeg, [['mes', 'Mês'], ['contas', 'Contas fixas'], ['caixinhas', 'Caixinhas']])}
      ${content}`;
  }

  function monthTxHTML(txs, out) {
    if (!txs.length) return emptyHTML('🗓️', 'Nada neste mês ainda', 'Toque em <b>+ Lançar</b> para registrar uma entrada ou um gasto.');
    let html = '';
    for (const [d, list] of groupBy([...txs].sort(byDateDesc), (t) => t.date)) {
      html += `<div class="group-head"><span>${relDay(d)}</span></div><div class="list">`;
      html += list.map((t) => {
        const c = findCat(t.type, t.catId);
        const isIn = t.type === 'in';
        return rowHTML({ a: 'edit-tx', id: t.id, emoji: c.emoji, color: c.color, title: t.desc || c.name, sub: t.billId ? `Conta fixa · ${c.name}` : c.name, amt: (isIn ? '+' : '') + money(t.amount), amtClass: isIn ? 'pos' : '' });
      }).join('');
      html += '</div>';
    }
    const outs = txs.filter((t) => t.type === 'out');
    if (outs.length) html += `<div class="card" style="margin-top:18px"><div class="card-title" style="margin:0">Para onde foi o dinheiro</div>${catBarsHTML(byCategory(outs, 'out'), out)}</div>`;
    return html;
  }

  const billsForMonth = (m) => S.pessoal.bills.filter((b) => !b.startMonth || b.startMonth <= m).sort((a, b) => a.dueDay - b.dueDay);
  const billPayment = (b, m) => S.pessoal.txs.find((t) => t.billId === b.id && t.billMonth === m);

  function billsHTML() {
    const m = ui.month;
    const bills = billsForMonth(m);
    if (!S.pessoal.bills.length) return emptyHTML('📌', 'Nenhuma conta fixa', 'Cadastre aluguel, internet, academia… Elas aparecem sozinhas todo mês para você marcar como pagas.', '<button class="btn primary" data-a="new-bill">Adicionar conta</button>');
    const paidList = bills.filter((b) => billPayment(b, m));
    const pending = sum(bills.filter((b) => !billPayment(b, m)));
    let html = `<div class="stat-grid">
      <div class="stat"><span>A pagar</span><b class="num ${pending ? 'warn' : ''}">${money(pending)}</b></div>
      <div class="stat"><span>Pagas</span><b class="num pos">${paidList.length} de ${bills.length}</b></div></div>`;
    if (!bills.length) return html + emptyHTML('📌', 'Nenhuma conta neste mês', 'As contas aparecem a partir do mês em que foram criadas.');
    html += '<div class="list">';
    html += bills.map((b) => {
      const pay = billPayment(b, m);
      const due = dayInMonth(m, b.dueDay);
      const c = findCat('out', b.catId);
      return `<div class="row">
        <button class="check ${pay ? 'on' : ''}" data-a="toggle-bill" data-id="${esc(b.id)}" aria-label="${pay ? 'Desmarcar pagamento' : 'Marcar como paga'}" aria-pressed="${!!pay}">${I.check}</button>
        <button class="row-hit" data-a="edit-bill" data-id="${esc(b.id)}">
          <span class="row-icon" style="--c:${safeColor(c.color)}">${esc(c.emoji)}</span>
          <span class="row-main"><span class="row-title">${esc(b.name)}</span><span class="row-sub">Vence dia ${b.dueDay}</span></span>
          <span class="row-amt num" style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">${money(b.amount)}${duePill(due, !!pay)}</span>
        </button></div>`;
    }).join('');
    return html + '</div><p class="hint" style="text-align:center;margin-top:12px">Toque no círculo para marcar como paga. O valor entra nos gastos do mês.</p>';
  }

  function boxesHTML() {
    const boxes = S.pessoal.boxes;
    if (!boxes.length) return emptyHTML('🐷', 'Nenhuma caixinha', 'Crie caixinhas como Reserva de emergência ou Viagem, com metas opcionais.', '<button class="btn primary" data-a="new-box">Criar caixinha</button>');
    return `<div class="list">${boxes.map((b) => {
      const pct = b.target ? Math.min(100, (b.balance / b.target) * 100) : 0;
      return `<button class="row" data-a="open-box" data-id="${esc(b.id)}">
        <span class="row-icon" style="--c:${safeColor(b.color)}">${esc(b.emoji)}</span>
        <span class="row-main"><span class="row-title">${esc(b.name)}</span>
          <span class="row-sub">${b.target ? `${Math.round(pct)}% de ${money(b.target)}${b.deadline ? ' · até ' + fmtDate(b.deadline) : ''}` : 'Sem meta'}</span>
          ${b.target ? `<span class="mini-progress" style="--c:${safeColor(b.color)}"><i style="width:${pct}%"></i></span>` : ''}
        </span>
        <span class="row-amt num">${money(b.balance)}</span></button>`;
    }).join('')}</div>`;
  }

  // ---------- Ajustes ----------
  function settingsView() {
    const st = S.settings;
    const r = (a, icon, color, label, val = '', cls = '') => `<button class="set-row ${cls}" data-a="${a}"><span class="ico" style="--c:${color}">${icon}</span><span class="lbl">${label}</span><span class="val">${val}</span>${cls ? '' : `<span class="chev" style="width:16px;color:var(--faint)">${I.chev}</span>`}</button>`;
    const lockLabel = st.lockMinutes === 0 ? 'Imediato' : `${st.lockMinutes} min`;
    const loan = S.loja.loan;
    return `<header class="page-head"><div><h1>Ajustes</h1></div></header>
      <div class="set-label">Perfil</div>
      <div class="set-group">${r('set-name', I.user, '#8e8e93', 'Nome', esc(S.profile.name || 'Adicionar'))}</div>

      <div class="set-label">Loja</div>
      <div class="set-group">
        ${r('edit-funding', I.cash, '#1a9b52', 'Valor do financiamento', S.loja.funding ? money(S.loja.funding) : 'Definir')}
        ${r('cats', I.tag, '#ff9500', 'Categorias da loja', String(S.loja.cats.length)).replace('data-a="cats"', 'data-a="cats" data-list="loja"')}
        ${r('loan-setup', I.calendar, '#0a84ff', 'Parcelas', loan ? `${loan.count}× ${money(loan.amount)}` : 'Configurar')}
      </div>

      <div class="set-label">Pessoal</div>
      <div class="set-group">
        ${r('cats', I.tag, '#ff375f', 'Categorias de gastos', String(S.pessoal.catsOut.length)).replace('data-a="cats"', 'data-a="cats" data-list="out"')}
        ${r('cats', I.tag, '#00a389', 'Categorias de entradas', String(S.pessoal.catsIn.length)).replace('data-a="cats"', 'data-a="cats" data-list="in"')}
      </div>

      <div class="set-label">Moeda e aparência</div>
      <div class="set-group">
        ${r('currency', I.cash, '#00a389', 'Moeda', esc(currencyLabel(st.currency)))}
        <div class="set-row"><span class="ico" style="--c:#5e5ce6">${I.moon}</span><span class="lbl">Tema</span>
          ${seg('theme', st.theme, [['auto', 'Auto'], ['light', 'Claro'], ['dark', 'Escuro']])}</div>
        <div class="set-block"><div style="display:flex;align-items:center;gap:12px;margin-bottom:12px"><span class="ico" style="--c:var(--accent);width:30px;height:30px;border-radius:8px;display:grid;place-items:center;color:var(--on-accent);background:var(--accent)">${I.palette}</span><span class="lbl" style="font-weight:500">Cor de destaque</span></div>
          <div class="swatches">${ACCENTS.map((c) => `<button class="swatch ${st.accent === c ? 'active' : ''}" style="--c:${c}" data-a="accent" data-v="${c}" aria-label="Cor ${c}"></button>`).join('')}
          <label class="swatch custom ${ACCENTS.includes(st.accent) ? '' : 'active'}" style="--c:${safeColor(st.accent)}" aria-label="Escolher outra cor"><input type="color" data-in="accent" value="${safeColor(st.accent)}"></label></div>
          <p class="hint" style="margin:10px 0 0">Use a cor da sua marca para o app ficar com a sua cara.</p>
        </div>
      </div>

      <div class="set-label">Segurança</div>
      <div class="set-group">
        ${r('change-pin', I.key, '#ff9500', 'Trocar PIN')}
        ${r('lock-time', I.clock, '#5e5ce6', 'Bloqueio automático', lockLabel)}
        ${r('lock', I.lock, '#3a3a3c', 'Bloquear agora')}
      </div>
      <p class="set-note">Seus dados ficam só neste aparelho, criptografados com o seu PIN. Se você esquecer o PIN, não há como recuperar. Por isso, faça backups de vez em quando.</p>

      <div class="set-label">Backup</div>
      <div class="set-group">
        ${r('export', I.upload, '#0a84ff', 'Exportar backup')}
        ${r('import', I.download, '#30b0c7', 'Restaurar backup')}
      </div>
      <p class="set-note">O backup é um arquivo criptografado. Salve no app Arquivos ou no iCloud Drive. Para restaurar, você vai precisar do PIN que estava ativo na hora da exportação.</p>

      <div class="set-group">${r('wipe', I.trash, '#ff3b30', 'Apagar todos os dados', '', 'danger')}</div>

      <div class="privacy">${I.shield}<span>100% offline · nenhum dado sai deste aparelho<br>Cofre v${VERSION}</span></div>`;
  }

  // ================= Folhas de lançamento =================
  function catChipsHTML(list, selected) {
    return catList(list).map((c) => `<button type="button" class="chip ${c.id === selected ? 'active' : ''}" style="--c:${safeColor(c.color)}" data-k="cat" data-id="${esc(c.id)}">${esc(c.emoji)} ${esc(c.name)}</button>`).join('') +
      '<button type="button" class="chip" data-k="newcat">＋ Nova</button>';
  }

  // Folha genérica: gasto da loja, venda, lançamento pessoal.
  function entrySheet({ title, item, list, withType, descPh, onSave, onDelete, deleteLabel = 'Apagar' }) {
    let type = item?.type || 'out';
    const curList = () => (withType ? type : list);
    let catId = item?.catId || (curList() ? catList(curList())[0]?.id : null);
    const html = `
      ${withType ? `<div class="type-toggle"><button type="button" data-k="type" data-v="out" class="out">Saída</button><button type="button" data-k="type" data-v="in" class="in">Entrada</button></div>` : ''}
      ${amountHTML()}
      ${curList() ? '<div class="field"><label>Categoria</label><div class="chips pick wrap" data-r="cats"></div></div>' : ''}
      <div class="field"><label>Descrição <span style="font-weight:400">(opcional)</span></label><input class="input" data-r="desc" maxlength="80" placeholder="${esc(descPh || '')}" value="${esc(item?.desc || '')}"></div>
      <div class="field"><label>Data</label><input class="input" type="date" data-r="date" value="${esc(item?.date || defaultDate())}"></div>
      <button class="btn primary block" data-k="save">${item ? 'Salvar alterações' : 'Adicionar'}</button>
      ${item && onDelete ? `<button class="btn link block red" data-k="del">${deleteLabel}</button>` : ''}`;
    openSheet(title, html, (sh, entry) => {
      const save = () => {
        const amount = amt.get();
        if (!amount) return toast('Digite um valor');
        const date = sh.querySelector('[data-r=date]').value || today();
        onSave({ amount, catId, type, desc: sh.querySelector('[data-r=desc]').value.trim(), date });
        closeSheet(entry);
      };
      const amt = mountAmount(sh, item?.amount, { entry, isActive: () => isTop(sh), onEnter: save });
      const drawCats = () => { const el = sh.querySelector('[data-r=cats]'); if (el) el.innerHTML = catChipsHTML(curList(), catId); };
      const drawType = () => $$('[data-k=type]', sh).forEach((b) => b.classList.toggle('active', b.dataset.v === type));
      drawCats();
      drawType();
      sh.addEventListener('click', (e) => {
        const b = e.target.closest('[data-k]');
        if (!b) return;
        const k = b.dataset.k;
        if (k === 'cat') { catId = b.dataset.id; drawCats(); }
        if (k === 'type') { type = b.dataset.v; catId = catList(type)[0]?.id; drawType(); drawCats(); }
        if (k === 'newcat') catEditSheet(curList(), null, (c) => { catId = c.id; drawCats(); });
        if (k === 'save') save();
        if (k === 'del') { closeSheet(entry); onDelete(); }
      });
    });
  }
  // Lançamentos no mês que está aberto na aba Pessoal ficam com data nesse mês
  const defaultDate = () => (ui.tab === 'pessoal' && ui.month !== monthOf(today()) ? `${ui.month}-01` : today());

  function removeWithUndo(arr, item, label) {
    const i = arr.indexOf(item);
    if (i < 0) return;
    arr.splice(i, 1);
    commit();
    toast(label, () => { arr.splice(Math.min(i, arr.length), 0, item); commit(); });
  }

  function expenseSheet(item) {
    entrySheet({
      title: item ? 'Editar gasto' : 'Novo gasto da loja',
      item, list: 'loja', descPh: 'Ex.: 100 caixas kraft',
      onSave: (v) => {
        if (item) Object.assign(item, { amount: v.amount, catId: v.catId, desc: v.desc, date: v.date });
        else S.loja.expenses.push({ id: uid(), at: Date.now(), amount: v.amount, catId: v.catId, desc: v.desc, date: v.date });
        commit();
        if (!item) {
          const left = S.loja.funding - sum(S.loja.expenses);
          toast(S.loja.funding ? `Gasto lançado · saldo ${money(left)}` : 'Gasto lançado');
        }
      },
      onDelete: () => removeWithUndo(S.loja.expenses, item, 'Gasto apagado'),
      deleteLabel: 'Apagar gasto',
    });
  }

  function saleSheet(item) {
    entrySheet({
      title: item ? 'Editar venda' : 'Nova venda',
      item, list: null, descPh: 'Ex.: Pedido #1024',
      onSave: (v) => {
        if (item) Object.assign(item, { amount: v.amount, desc: v.desc, date: v.date });
        else S.loja.sales.push({ id: uid(), at: Date.now(), amount: v.amount, desc: v.desc, date: v.date });
        commit();
        if (!item) toast('Venda registrada 💸');
      },
      onDelete: () => removeWithUndo(S.loja.sales, item, 'Venda apagada'),
      deleteLabel: 'Apagar venda',
    });
  }

  function txSheet(item) {
    entrySheet({
      title: item ? 'Editar lançamento' : 'Novo lançamento',
      item, withType: true, descPh: 'Ex.: Mercado do mês',
      onSave: (v) => {
        if (item) Object.assign(item, { amount: v.amount, catId: v.catId, type: v.type, desc: v.desc, date: v.date });
        else S.pessoal.txs.push({ id: uid(), at: Date.now(), ...v });
        if (!item && monthOf(v.date) !== ui.month) ui.month = monthOf(v.date);
        commit();
        if (!item) toast(v.type === 'in' ? 'Entrada registrada' : 'Gasto registrado');
      },
      onDelete: () => removeWithUndo(S.pessoal.txs, item, 'Lançamento apagado'),
      deleteLabel: 'Apagar lançamento',
    });
  }

  // Folha só com o valor (financiamento, guardar/retirar)
  function amountSheet({ title, initial, hint = '', confirm = 'Salvar', onSave }) {
    openSheet(title, `${amountHTML()}${hint ? `<p class="hint" style="margin:-4px 4px 14px">${hint}</p>` : ''}<button class="btn primary block" data-k="save">${esc(confirm)}</button>`, (sh, entry) => {
      const save = () => { const v = amt.get(); if (!v) return toast('Digite um valor'); closeSheet(entry); onSave(v); };
      const amt = mountAmount(sh, initial, { entry, isActive: () => isTop(sh), onEnter: save });
      sh.querySelector('[data-k=save]').addEventListener('click', save);
    });
  }

  function fundingSheet() {
    amountSheet({
      title: 'Valor do financiamento',
      initial: S.loja.funding,
      hint: 'Dica: dá pra somar direto, ex.: 30000 + 20000.',
      onSave: (v) => { S.loja.funding = v; commit(); toast('Valor atualizado'); },
    });
  }

  function loanSheet() {
    const loan = S.loja.loan;
    const html = `
      <div class="field"><label>Quantidade de parcelas</label><input class="input" data-r="count" type="number" inputmode="numeric" min="1" max="480" placeholder="Ex.: 24" value="${loan ? loan.count : ''}"></div>
      <div class="field"><label>Valor de cada parcela</label><input class="input" data-r="amount" inputmode="decimal" placeholder="Ex.: 850,00" value="${loan ? centsToInput(loan.amount) : ''}"></div>
      <div class="field"><label>Vencimento da 1ª parcela</label><input class="input" data-r="first" type="date" value="${esc(loan ? loan.firstDue : addMonths(today(), 1))}"></div>
      <p class="hint" style="margin:-4px 4px 16px">As próximas vencem no mesmo dia de cada mês.</p>
      <button class="btn primary block" data-k="save">Salvar</button>
      ${loan ? '<button class="btn link block red" data-k="del">Remover parcelas</button>' : ''}`;
    openSheet(loan ? 'Editar parcelas' : 'Parcelas do financiamento', html, (sh, entry) => {
      sh.addEventListener('click', async (e) => {
        const k = e.target.closest('[data-k]')?.dataset.k;
        if (k === 'save') {
          const count = parseInt(sh.querySelector('[data-r=count]').value, 10);
          const amount = parseMoney(sh.querySelector('[data-r=amount]').value);
          const first = sh.querySelector('[data-r=first]').value;
          if (!(count >= 1 && count <= 480)) return toast('Informe a quantidade de parcelas');
          if (!amount || amount <= 0) return toast('Informe o valor da parcela');
          if (!first) return toast('Informe a data da 1ª parcela');
          const paid = (loan?.paid || []).slice(0, count);
          S.loja.loan = { count, amount, firstDue: first, paid };
          ui.tab = 'loja'; ui.lojaSeg = 'parcelas';
          closeSheet(entry);
          commit();
        }
        if (k === 'del') {
          const old = S.loja.loan;
          closeSheet(entry);
          S.loja.loan = null;
          commit();
          toast('Parcelas removidas', () => { S.loja.loan = old; commit(); });
        }
      });
    });
  }

  function billSheet(bill) {
    const cats = S.pessoal.catsOut;
    const html = `
      <div class="field"><label>Nome</label><input class="input" data-r="name" maxlength="40" placeholder="Ex.: Aluguel" value="${esc(bill?.name || '')}"></div>
      <div class="field-row">
        <div class="field"><label>Valor</label><input class="input" data-r="amount" inputmode="decimal" placeholder="0,00" value="${bill ? centsToInput(bill.amount) : ''}"></div>
        <div class="field"><label>Dia do vencimento</label><input class="input" data-r="day" type="number" inputmode="numeric" min="1" max="31" placeholder="10" value="${bill?.dueDay || ''}"></div>
      </div>
      <div class="field"><label>Categoria</label><div class="chips pick wrap" data-r="cats"></div></div>
      <button class="btn primary block" data-k="save">${bill ? 'Salvar alterações' : 'Adicionar conta'}</button>
      ${bill ? '<button class="btn link block red" data-k="del">Apagar conta fixa</button>' : ''}`;
    let catId = bill?.catId || (cats.find((c) => c.name === 'Contas') || cats[0]).id;
    openSheet(bill ? 'Editar conta fixa' : 'Nova conta fixa', html, (sh, entry) => {
      const drawCats = () => { sh.querySelector('[data-r=cats]').innerHTML = catChipsHTML('out', catId); };
      drawCats();
      if (!bill) setTimeout(() => sh.querySelector('[data-r=name]').focus(), 350);
      sh.addEventListener('click', (e) => {
        const b = e.target.closest('[data-k]');
        if (!b) return;
        const k = b.dataset.k;
        if (k === 'cat') { catId = b.dataset.id; drawCats(); }
        if (k === 'newcat') catEditSheet('out', null, (c) => { catId = c.id; drawCats(); });
        if (k === 'save') {
          const name = sh.querySelector('[data-r=name]').value.trim();
          const amount = parseMoney(sh.querySelector('[data-r=amount]').value);
          const dueDay = parseInt(sh.querySelector('[data-r=day]').value, 10);
          if (!name) return toast('Dê um nome para a conta');
          if (!amount || amount <= 0) return toast('Informe o valor');
          if (!(dueDay >= 1 && dueDay <= 31)) return toast('Dia do vencimento entre 1 e 31');
          if (bill) Object.assign(bill, { name, amount, dueDay, catId });
          else S.pessoal.bills.push({ id: uid(), name, amount, dueDay, catId, startMonth: ui.month < monthOf(today()) ? ui.month : monthOf(today()) });
          closeSheet(entry);
          commit();
        }
        if (k === 'del') {
          closeSheet(entry);
          removeWithUndo(S.pessoal.bills, bill, 'Conta fixa apagada');
        }
      });
    });
  }

  function toggleBill(id) {
    const b = S.pessoal.bills.find((x) => x.id === id);
    if (!b) return;
    const m = ui.month;
    const pay = billPayment(b, m);
    if (pay) {
      S.pessoal.txs.splice(S.pessoal.txs.indexOf(pay), 1);
      commit();
      toast('Pagamento desmarcado');
    } else {
      const date = m === monthOf(today()) ? today() : dayInMonth(m, b.dueDay);
      S.pessoal.txs.push({ id: uid(), at: Date.now(), type: 'out', amount: b.amount, catId: b.catId, desc: b.name, date, billId: b.id, billMonth: m });
      commit();
      toast(`${b.name} paga ✅`);
    }
  }

  // ---------- Caixinhas ----------
  function boxSheet(box) {
    const body = () => {
      const pct = box.target ? Math.min(100, (box.balance / box.target) * 100) : 0;
      const moves = [...(box.moves || [])].sort(byDateDesc).slice(0, 12);
      return `<div class="card" style="text-align:center">
          <div style="font-size:40px">${esc(box.emoji)}</div>
          <div class="num" style="font-size:34px;font-weight:800;letter-spacing:-0.03em">${money(box.balance)}</div>
          ${box.target ? `<div class="hint" style="margin:2px 0 0">${Math.round(pct)}% da meta de ${money(box.target)}${box.deadline ? ' · até ' + fmtDate(box.deadline) : ''}</div>
          <div class="mini-progress" style="--c:${safeColor(box.color)};height:8px;margin-top:12px"><i style="width:${pct}%"></i></div>
          ${box.balance < box.target ? `<div class="hint" style="margin-top:8px">Faltam ${money(box.target - box.balance)}</div>` : '<div class="hint" style="margin-top:8px">🎉 Meta alcançada!</div>'}` : ''}
        </div>
        <div class="btn-row" style="margin-bottom:16px"><button class="btn primary" data-k="dep">${I.plus} Guardar</button><button class="btn" data-k="wd">Retirar</button></div>
        ${moves.length ? `<div class="group-head" style="margin-top:0"><span>Movimentações</span></div><div class="list">${moves.map((mv) => `<div class="row"><span class="row-main"><span class="row-title">${mv.amount > 0 ? 'Guardado' : 'Retirado'}</span><span class="row-sub">${fmtDate(mv.date)}</span></span><span class="row-amt num ${mv.amount > 0 ? 'pos' : ''}">${mv.amount > 0 ? '+' : '−'}${money(Math.abs(mv.amount))}</span></div>`).join('')}</div>` : ''}
        <button class="btn link block" data-k="edit" style="margin-top:8px">Editar caixinha</button>`;
    };
    openSheet(box.name, body(), (sh, entry) => {
      const refresh = () => { setBody(entry, body()); entry.sh.querySelector('.sheet-head h2').textContent = box.name; };
      sh.addEventListener('click', (e) => {
        const k = e.target.closest('[data-k]')?.dataset.k;
        if (k === 'dep' || k === 'wd') {
          amountSheet({
            title: k === 'dep' ? `Guardar em ${box.name}` : `Retirar de ${box.name}`,
            confirm: k === 'dep' ? 'Guardar' : 'Retirar',
            onSave: (v) => {
              if (k === 'wd' && v > box.balance) return toast('Valor maior que o saldo da caixinha');
              const amount = k === 'dep' ? v : -v;
              box.balance += amount;
              (box.moves = box.moves || []).push({ id: uid(), at: Date.now(), amount, date: today() });
              commit();
              refresh();
              toast(k === 'dep' ? 'Guardado! 💪' : 'Valor retirado');
            },
          });
        }
        if (k === 'edit') boxEditSheet(box, (deleted) => { if (deleted) closeSheet(entry); else refresh(); });
      });
    });
  }

  function boxEditSheet(box, done) {
    let emoji = box?.emoji || '🐷';
    let color = box?.color || COLORS[3];
    const html = `
      <div class="field"><label>Nome</label><input class="input" data-r="name" maxlength="30" placeholder="Ex.: Reserva de emergência" value="${esc(box?.name || '')}"></div>
      ${!box ? '<div class="field"><label>Já tem algum valor guardado? <span style="font-weight:400">(opcional)</span></label><input class="input" data-r="start" inputmode="decimal" placeholder="0,00"></div>' : ''}
      <div class="field-row">
        <div class="field"><label>Meta <span style="font-weight:400">(opcional)</span></label><input class="input" data-r="target" inputmode="decimal" placeholder="0,00" value="${box?.target ? centsToInput(box.target) : ''}"></div>
        <div class="field"><label>Até quando</label><input class="input" data-r="deadline" type="date" value="${esc(box?.deadline || '')}"></div>
      </div>
      <div class="field"><label>Ícone</label><div class="emoji-grid" data-r="emojis"></div></div>
      <div class="field"><label>Cor</label><div class="swatches" data-r="colors"></div></div>
      <button class="btn primary block" data-k="save">${box ? 'Salvar' : 'Criar caixinha'}</button>
      ${box ? '<button class="btn link block red" data-k="del">Apagar caixinha</button>' : ''}`;
    openSheet(box ? 'Editar caixinha' : 'Nova caixinha', html, (sh, entry) => {
      const draw = () => {
        sh.querySelector('[data-r=emojis]').innerHTML = ['🐷', '🛟', '✈️', '🏠', '🚗', '🎓', '💍', '🎁', '💻', '📈', '🏖️', '💰', '🩺', '👶', '🎮', '🎯'].map((x) => `<button type="button" class="${x === emoji ? 'active' : ''}" data-k="emoji" data-v="${x}">${x}</button>`).join('');
        sh.querySelector('[data-r=colors]').innerHTML = COLORS.map((c) => `<button type="button" class="swatch ${c === color ? 'active' : ''}" style="--c:${c}" data-k="color" data-v="${c}" aria-label="Cor ${c}"></button>`).join('');
      };
      draw();
      sh.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-k]');
        if (!b) return;
        const k = b.dataset.k;
        if (k === 'emoji') { emoji = b.dataset.v; draw(); }
        if (k === 'color') { color = b.dataset.v; draw(); }
        if (k === 'save') {
          const name = sh.querySelector('[data-r=name]').value.trim();
          if (!name) return toast('Dê um nome para a caixinha');
          const target = parseMoney(sh.querySelector('[data-r=target]').value) || 0;
          const deadline = sh.querySelector('[data-r=deadline]').value || '';
          if (box) Object.assign(box, { name, target, deadline, emoji, color });
          else {
            const start = parseMoney(sh.querySelector('[data-r=start]').value) || 0;
            S.pessoal.boxes.push({ id: uid(), name, target, deadline, emoji, color, balance: start, moves: start ? [{ id: uid(), at: Date.now(), amount: start, date: today() }] : [] });
          }
          closeSheet(entry);
          commit();
          done && done(false);
        }
        if (k === 'del') {
          const ok = await confirmSheet({ title: 'Apagar caixinha?', msg: `"${esc(box.name)}" e o histórico dela serão removidos.`, ok: 'Apagar', danger: true });
          if (!ok) return;
          closeSheet(entry);
          removeWithUndo(S.pessoal.boxes, box, 'Caixinha apagada');
          done && done(true);
        }
      });
    });
  }

  // ================= Categorias =================
  const LIST_TITLE = { loja: 'Categorias da loja', out: 'Categorias de gastos', in: 'Categorias de entradas' };

  function catManagerSheet(list) {
    const body = () => {
      const cats = catList(list);
      return `<p class="hint" style="margin:0 4px 12px">Toque para editar. Use as setas para mudar a ordem.</p>
        <div class="list">${cats.map((c, i) => `<div class="cat-row">
          <span class="row-icon" style="--c:${safeColor(c.color)}">${esc(c.emoji)}</span>
          <button class="name" data-k="edit" data-id="${esc(c.id)}">${esc(c.name)}</button>
          <button class="mv" data-k="up" data-i="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Subir">${I.up}</button>
          <button class="mv" data-k="down" data-i="${i}" ${i === cats.length - 1 ? 'disabled' : ''} aria-label="Descer">${I.down}</button>
        </div>`).join('')}</div>
        <button class="btn primary block" data-k="add" style="margin-top:16px">${I.plus} Nova categoria</button>`;
    };
    openSheet(LIST_TITLE[list], body(), (sh, entry) => {
      const refresh = () => setBody(entry, body());
      sh.addEventListener('click', (e) => {
        const b = e.target.closest('[data-k]');
        if (!b) return;
        const k = b.dataset.k;
        const cats = catList(list);
        if (k === 'up' || k === 'down') {
          const i = Number(b.dataset.i);
          const j = k === 'up' ? i - 1 : i + 1;
          [cats[i], cats[j]] = [cats[j], cats[i]];
          commit();
          refresh();
        }
        if (k === 'edit') catEditSheet(list, cats.find((c) => c.id === b.dataset.id), refresh);
        if (k === 'add') catEditSheet(list, null, refresh);
      });
    });
  }

  function catEditSheet(list, c, done) {
    let emoji = c?.emoji || '🏷️';
    let color = c?.color || COLORS[catList(list).length % COLORS.length];
    const html = `
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
        <span class="row-icon" data-r="prev" style="width:56px;height:56px;font-size:28px;border-radius:16px"></span>
        <input class="input" data-r="name" maxlength="30" placeholder="Nome da categoria" value="${esc(c?.name || '')}">
      </div>
      <div class="field"><label>Ícone <span style="font-weight:400">· ou digite qualquer emoji:</span> <input data-r="custom" maxlength="8" style="width:56px;border:0;border-radius:8px;padding:4px 6px;background:var(--card);text-align:center" aria-label="Emoji personalizado"></label><div class="emoji-grid" data-r="emojis"></div></div>
      <div class="field"><label>Cor</label><div class="swatches" data-r="colors"></div></div>
      <button class="btn primary block" data-k="save">${c ? 'Salvar' : 'Criar categoria'}</button>
      ${c ? '<button class="btn link block red" data-k="del">Apagar categoria</button>' : ''}`;
    openSheet(c ? 'Editar categoria' : 'Nova categoria', html, (sh, entry) => {
      const draw = () => {
        const prev = sh.querySelector('[data-r=prev]');
        prev.textContent = emoji;
        prev.style.setProperty('--c', safeColor(color));
        sh.querySelector('[data-r=emojis]').innerHTML = EMOJIS.map((x) => `<button type="button" class="${x === emoji ? 'active' : ''}" data-k="emoji" data-v="${x}">${x}</button>`).join('');
        sh.querySelector('[data-r=colors]').innerHTML = COLORS.map((x) => `<button type="button" class="swatch ${x === color ? 'active' : ''}" style="--c:${x}" data-k="color" data-v="${x}" aria-label="Cor ${x}"></button>`).join('');
      };
      draw();
      if (!c) setTimeout(() => sh.querySelector('[data-r=name]').focus(), 350);
      sh.querySelector('[data-r=custom]').addEventListener('input', (e) => { const g = firstGrapheme(e.target.value); if (g) { emoji = g; draw(); } });
      sh.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-k]');
        if (!b) return;
        const k = b.dataset.k;
        if (k === 'emoji') { emoji = b.dataset.v; draw(); }
        if (k === 'color') { color = b.dataset.v; draw(); }
        if (k === 'save') {
          const name = sh.querySelector('[data-r=name]').value.trim();
          if (!name) return toast('Dê um nome para a categoria');
          let saved = c;
          if (c) Object.assign(c, { name, emoji, color });
          else { saved = { id: uid(), name, emoji, color }; catList(list).push(saved); }
          closeSheet(entry);
          commit();
          done && done(saved);
        }
        if (k === 'del') {
          if (await deleteCat(list, c)) { closeSheet(entry); done && done(null); }
        }
      });
    });
  }

  async function deleteCat(list, c) {
    const cats = catList(list);
    if (cats.length <= 1) { toast('É preciso ter pelo menos uma categoria'); return false; }
    const used = catUsage(list, c.id);
    if (used) {
      const others = cats.filter((x) => x.id !== c.id);
      const sh = await confirmSheet({
        title: 'Apagar categoria?',
        msg: `"${esc(c.name)}" tem ${plural(used, 'lançamento', 'lançamentos')}. Para qual categoria ${used === 1 ? 'ele vai' : 'eles vão'}?`,
        extra: `<div class="field"><select class="input" data-r="target">${others.map((o) => `<option value="${esc(o.id)}">${esc(o.emoji + ' ' + o.name)}</option>`).join('')}</select></div>`,
        ok: 'Mover e apagar', danger: true,
      });
      if (!sh) return false;
      reassignCat(list, c.id, sh.querySelector('[data-r=target]').value);
    } else if (!(await confirmSheet({ title: 'Apagar categoria?', msg: `"${esc(c.name)}" será removida.`, ok: 'Apagar', danger: true }))) return false;
    cats.splice(cats.indexOf(c), 1);
    if (ui.catFilter === c.id) ui.catFilter = 'all';
    commit();
    toast('Categoria apagada');
    return true;
  }

  // ================= Ajustes: ações =================
  function nameSheet() {
    openSheet('Seu nome', `<div class="field"><input class="input" data-r="name" maxlength="30" placeholder="Seu nome" value="${esc(S.profile.name)}"></div><button class="btn primary block" data-k="save">Salvar</button>`, (sh, entry) => {
      const inp = sh.querySelector('[data-r=name]');
      const save = () => { S.profile.name = inp.value.trim(); closeSheet(entry); commit(); };
      setTimeout(() => inp.focus(), 350);
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') save(); });
      sh.querySelector('[data-k=save]').addEventListener('click', save);
    });
  }

  function currencyLabel(code) {
    const c = CURRENCIES.find(([k]) => k === code) || CURRENCIES[0];
    return `${c[1]} (${c[2]})`;
  }

  function currencySheet() {
    const html = `<div class="set-group" style="margin-bottom:12px">${CURRENCIES.map(([code, name, sym]) => `<button class="set-row" data-k="opt" data-v="${code}"><span class="lbl">${name} <span style="color:var(--muted)">· ${sym}</span></span>${S.settings.currency === code ? `<span style="width:20px;color:var(--accent)">${I.check}</span>` : ''}</button>`).join('')}</div>
      <p class="hint">Muda só o símbolo exibido. Os valores que você já lançou continuam os mesmos.</p>`;
    openSheet('Moeda', html, (sh, entry) => {
      sh.addEventListener('click', (e) => {
        const b = e.target.closest('[data-k=opt]');
        if (!b) return;
        S.settings.currency = b.dataset.v;
        setCurrency(S.settings.currency);
        closeSheet(entry);
        commit();
        toast(`Moeda: ${currencyLabel(S.settings.currency)}`);
      });
    });
  }

  function lockTimeSheet() {
    const opts = [[0, 'Imediatamente ao sair do app'], [1, 'Após 1 minuto'], [5, 'Após 5 minutos'], [15, 'Após 15 minutos']];
    const html = `<div class="set-group" style="margin-bottom:12px">${opts.map(([v, l]) => `<button class="set-row" data-k="opt" data-v="${v}"><span class="lbl">${l}</span>${S.settings.lockMinutes === v ? `<span style="width:20px;color:var(--accent)">${I.check}</span>` : ''}</button>`).join('')}</div>
      <p class="hint">Também bloqueia depois de alguns minutos sem uso com o app aberto.</p>`;
    openSheet('Bloqueio automático', html, (sh, entry) => {
      sh.addEventListener('click', (e) => {
        const b = e.target.closest('[data-k=opt]');
        if (!b) return;
        S.settings.lockMinutes = Number(b.dataset.v);
        closeSheet(entry);
        resetIdle();
        commit();
      });
    });
  }

  function changePinSheet() {
    let step = 'current';
    let newPin = '';
    openSheet('Trocar PIN', pinHTML('PIN atual', 'Digite o PIN que você usa hoje'), (sh, entry) => {
      const api = mountPin(sh, {
        entry,
        isActive: () => isTop(sh),
        onComplete: async (pin) => {
          if (step === 'current') {
            api.busy(true);
            const ok = await DB.verify(pin);
            api.busy(false);
            if (!ok) return api.error('PIN incorreto');
            step = 'new'; api.reset(); api.setTitle('Novo PIN'); api.setSub('Escolha 4 novos dígitos');
          } else if (step === 'new') {
            newPin = pin; step = 'confirm'; api.reset(); api.setTitle('Confirme o novo PIN'); api.setSub('Digite os mesmos 4 dígitos');
          } else {
            if (pin !== newPin) { step = 'new'; api.error('Os PINs não conferem'); api.setTitle('Novo PIN'); api.setSub('Escolha 4 novos dígitos'); return; }
            api.busy(true);
            await flushSave();
            await DB.changePin(newPin, S);
            closeSheet(entry);
            toast('PIN alterado 🔒');
          }
        },
      });
    });
  }

  async function exportBackup() {
    await flushSave();
    const data = await DB.exportBackup(S);
    const name = `cofre-backup-${today()}.json`;
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const file = new File([blob], name, { type: 'application/json' });
    const touch = matchMedia('(pointer: coarse)').matches;
    if (touch && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Backup do Cofre' });
        toast('Backup exportado ✅');
        return;
      } catch (e) {
        if (e.name === 'AbortError') return;
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast('Backup salvo ✅');
  }

  async function importBackup() {
    const file = await pickFile();
    if (!file) return;
    const res = await askBackupPin(file);
    if (!res) return;
    const st = res.state;
    const ok = await confirmSheet({
      title: 'Restaurar backup?',
      msg: `Os dados atuais serão substituídos pelos do backup (${plural(st.loja.expenses.length, 'gasto', 'gastos')} da loja, ${plural(st.pessoal.txs.length, 'lançamento', 'lançamentos')} pessoais). Seu PIN atual continua o mesmo.`,
      ok: 'Restaurar', danger: true,
    });
    if (!ok) return;
    S = st;
    applyLook(S.settings);
    setCurrency(S.settings.currency);
    commit();
    await flushSave();
    toast('Backup restaurado ✅');
  }

  async function wipeFlow() {
    const a = await confirmSheet({ title: 'Apagar todos os dados?', msg: 'Gastos, vendas, parcelas, finanças pessoais e categorias serão apagados <b>deste aparelho</b>. Faça um backup antes se quiser guardar.', ok: 'Continuar', danger: true });
    if (!a) return;
    const b = await confirmSheet({ title: 'Última confirmação', msg: 'Isso não pode ser desfeito. Apagar tudo mesmo?', ok: 'Apagar tudo', danger: true });
    if (b) await wipeAll();
  }

  // ================= Ações (cliques) =================
  const A = {
    'sheet-close': () => closeSheet(),
    tab: (el) => { ui.tab = el.dataset.v; render(); $('.view').scrollTop = 0; },
    'seg-loja': (el) => { ui.lojaSeg = el.dataset.v; render(); },
    'seg-pes': (el) => { ui.pesSeg = el.dataset.v; render(); },
    'cat-filter': (el) => { ui.catFilter = el.dataset.v; render(); },
    month: (el) => { ui.month = shiftMonth(ui.month, Number(el.dataset.v)); render(); },
    fab: () => {
      if (ui.tab === 'loja') return ui.lojaSeg === 'vendas' ? saleSheet() : expenseSheet();
      if (ui.pesSeg === 'contas') return billSheet();
      if (ui.pesSeg === 'caixinhas') return boxEditSheet();
      txSheet();
    },
    'edit-expense': (el) => expenseSheet(S.loja.expenses.find((x) => x.id === el.dataset.id)),
    'edit-sale': (el) => saleSheet(S.loja.sales.find((x) => x.id === el.dataset.id)),
    'edit-funding': () => fundingSheet(),
    'loan-setup': () => loanSheet(),
    'toggle-inst': (el) => {
      const i = Number(el.dataset.i);
      const loan = S.loja.loan;
      loan.paid[i] = !loan.paid[i];
      for (let j = 0; j < loan.count; j++) loan.paid[j] = !!loan.paid[j];
      commit();
    },
    'edit-tx': (el) => {
      const t = S.pessoal.txs.find((x) => x.id === el.dataset.id);
      if (t.billId && S.pessoal.bills.some((b) => b.id === t.billId)) {
        toast('Pagamento de conta fixa: desmarque na aba Contas fixas');
        ui.pesSeg = 'contas';
        render();
        return;
      }
      txSheet(t);
    },
    'new-bill': () => billSheet(),
    'edit-bill': (el) => billSheet(S.pessoal.bills.find((x) => x.id === el.dataset.id)),
    'toggle-bill': (el) => toggleBill(el.dataset.id),
    'new-box': () => boxEditSheet(),
    'open-box': (el) => boxSheet(S.pessoal.boxes.find((x) => x.id === el.dataset.id)),
    'set-name': () => nameSheet(),
    cats: (el) => catManagerSheet(el.dataset.list),
    theme: (el) => { S.settings.theme = el.dataset.v; applyLook(S.settings); commit(); },
    accent: (el) => { S.settings.accent = el.dataset.v; applyLook(S.settings); commit(); },
    'lock-time': () => lockTimeSheet(),
    currency: () => currencySheet(),
    'change-pin': () => changePinSheet(),
    lock: () => lock(),
    export: () => exportBackup(),
    import: () => importBackup(),
    wipe: () => wipeFlow(),
  };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-a]');
    if (!el || el.disabled) return;
    const fn = A[el.dataset.a];
    if (fn) { e.preventDefault(); fn(el, e); }
  });

  document.addEventListener('input', (e) => {
    const k = e.target.dataset?.in;
    if (k === 'search') {
      ui.search = e.target.value;
      $('#exp-list').innerHTML = expensesListHTML();
    }
    if (k === 'accent') {
      S.settings.accent = safeColor(e.target.value);
      applyLook(S.settings);
    }
  });
  document.addEventListener('change', (e) => {
    if (e.target.dataset?.in === 'accent') commit();
  });

  // ================= Início =================
  async function boot() {
    if (!window.crypto?.subtle || !window.indexedDB) {
      app.innerHTML = '<div class="lock"><h1>Navegador não suportado</h1><p class="sub">Abra no Safari atualizado.</p></div>';
      return;
    }
    if (await DB.exists()) renderLock();
    else renderOnboarding(0);
  }

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  boot();
})();
