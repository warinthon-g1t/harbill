'use strict';
/* หารบิลคืนนี้ — ตรรกะทั้งหมดของแอป
   state (s) → calc() → render*()  ข้อมูลบันทึกใน localStorage ของเครื่อง */

const CATS = [['food', 'อาหาร'], ['karaoke', 'คาราโอเกะ'], ['drink', 'เหล้า/เบียร์'], ['other', 'อื่นๆ']];
const PH = { food: 'เช่น หมูกระทะ 5 ที่', karaoke: 'เช่น ห้อง VIP 3 ชม.', drink: 'เช่น เบียร์ทาวเวอร์', other: 'เช่น ค่าจอดรถ' };
const AVC = ['#bfe3ff', '#d6ccff', '#ffd8c2', '#c8f0de', '#ffe3a8', '#f5c9e6', '#cfd8ff', '#d2f1f5'];
const KEY = 'harbill-v1';
const TAB_KEY = 'harbill-tab';

let seq = Date.now();
const nid = () => 'x' + (seq++).toString(36);
const allJoin = () => ({ food: true, karaoke: true, drink: true, other: true });

function sample() {
  const first = ['p1', 'p2', 'p3', 'p4', 'p5'];
  const P = (id, name, j = {}) => ({ id, name, joins: { ...allJoin(), ...j } });
  return {
    ver: 2, sample: true, sc: true, scRate: 10, vat: true, vatRate: 7, round: false, payer: 'p1',
    people: [P('p1', 'บอส'), P('p2', 'มิ้นท์'), P('p3', 'ต้น'), P('p4', 'ฟ้า', { drink: false }), P('p5', 'เจ', { karaoke: false }),
      P('p6', 'แบงค์', { food: false }), P('p7', 'ปุ้ย', { food: false }), P('p8', 'โอ๊ต', { food: false, karaoke: false })],
    items: [
      { id: 'i1', name: 'ชาบูหมู 5 ที่', price: 1495, cat: 'food', shares: [...first] },
      { id: 'i2', name: 'เฟรนช์ฟรายส์', price: 159, cat: 'food', shares: [...first] },
      { id: 'i3', name: 'ห้องคาราโอเกะ 3 ชม.', price: 900, cat: 'karaoke', shares: ['p1', 'p2', 'p3', 'p4', 'p6', 'p7'], mode: 'weight', weights: { p1: 3, p2: 3, p3: 3, p4: 1.5, p6: 1, p7: 1 } },
      { id: 'i4', name: 'เบียร์ทาวเวอร์ รอบ 1 (ก๊วนแรก)', price: 1180, cat: 'drink', shares: ['p1', 'p2', 'p3', 'p5'] },
      { id: 'i5', name: 'เบียร์ทาวเวอร์ รอบ 2 (มาเพิ่ม 3 คน)', price: 1180, cat: 'drink', shares: ['p1', 'p2', 'p3', 'p5', 'p6', 'p7', 'p8'] },
      { id: 'i6', name: 'โซดา + น้ำแข็ง รอบ 2', price: 120, cat: 'drink', shares: ['p1', 'p2', 'p3', 'p5', 'p6', 'p7', 'p8'] }
    ]
  };
}
function blank() { return { ver: 2, sample: false, sc: true, scRate: 10, vat: true, vatRate: 7, round: false, payer: '', people: [], items: [] }; }

let s;
try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) { s = null; }
if (!s || !Array.isArray(s.people) || (s.sample && !s.ver)) s = sample();

const unit = it => it.cat === 'karaoke' ? 'ชม.' : 'ส่วน';
const wOf = (it, id) => it.mode === 'weight' ? Math.max(0, +(it.weights?.[id] ?? 1) || 0) : 1;

function save() { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* storage full or blocked */ } }
function touched() { if (s.sample) { s.sample = false; $('#sampleBanner').hidden = true; } save(); }
const $ = q => document.querySelector(q);
const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const baht = n => '฿' + n.toLocaleString('th-TH', { minimumFractionDigits: s.round ? 0 : 2, maximumFractionDigits: 2 });
const fmt2 = n => '฿' + n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const whole = n => '฿' + Math.round(n).toLocaleString('th-TH');
const pname = p => p.name.trim() || 'ไม่มีชื่อ';
const initial = p => { const n = pname(p).replace(/^[เแโใไ]/, ''); return esc((n[0] || '?').toUpperCase()); };
const avColor = p => AVC[Math.max(0, s.people.indexOf(p)) % AVC.length];
const avatar = p => `<span class="av" style="background:${avColor(p)}">${initial(p)}</span>`;

/* ---------- tabs (phone) ---------- */
function setTab(t, scroll) {
  $('#app').dataset.tab = t;
  document.querySelectorAll('.tabbar [data-tab]').forEach(b => b.setAttribute('aria-current', String(b.dataset.tab === t)));
  try { sessionStorage.setItem(TAB_KEY, t); } catch (e) { }
  if (scroll) window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}
document.querySelector('.tabbar').addEventListener('click', e => {
  const b = e.target.closest('[data-tab]'); if (b) setTab(b.dataset.tab, true);
});

/* ---------- render ---------- */
function renderPeople() {
  const el = $('#people');
  if (!s.people.length) { el.innerHTML = '<div class="empty">ยังไม่มีใคร เพิ่มชื่อเพื่อนด้านล่าง</div>'; return; }
  el.innerHTML = s.people.map(p => `
    <div class="prow" data-pid="${p.id}">
      ${avatar(p)}
      <input type="text" id="pn-${p.id}" value="${esc(p.name)}" data-pname aria-label="ชื่อ" enterkeyhint="done">
      <div class="joins">${CATS.slice(0, 3).map(([k, l]) => `<button type="button" class="chip c-${k} ${p.joins[k] ? 'on' : ''}" data-pjoin="${k}" aria-pressed="${p.joins[k]}">${l}</button>`).join('')}</div>
      <button type="button" class="x" data-pdel aria-label="ลบ ${esc(pname(p))}">×</button>
    </div>`).join('');
}

function renderItems() {
  const el = $('#items');
  if (!s.items.length) { el.innerHTML = '<div class="empty">ยังไม่มีรายการ กดปุ่มหมวดด้านล่างเพื่อเพิ่ม</div>'; return; }
  el.innerHTML = s.items.map(it => `
    <div class="item c-${it.cat}" data-iid="${it.id}">
      <div class="item-top">
        <span class="cdot" aria-hidden="true"></span>
        <input type="text" class="iname" id="in-${it.id}" value="${esc(it.name)}" placeholder="${PH[it.cat]}" data-f="name" aria-label="ชื่อรายการ" enterkeyhint="next">
        <div class="row2">
          <input type="number" id="ip-${it.id}" value="${it.price === '' ? '' : it.price}" min="0" step="any" inputmode="decimal" placeholder="ราคา ฿" data-f="price" aria-label="ราคา (บาท)">
          <select id="ic-${it.id}" data-f="cat" aria-label="หมวด">${CATS.map(([k, l]) => `<option value="${k}" ${k === it.cat ? 'selected' : ''}>${l}</option>`).join('')}</select>
        </div>
        <button type="button" class="x" data-idel aria-label="ลบรายการ">×</button>
      </div>
      <div class="shares">
        <span class="lbl">หาร</span>
        ${s.people.map(p => {
          const on = it.shares.includes(p.id);
          return `<span class="sh"><button type="button" class="person ${on ? 'on' : ''}" data-share="${p.id}" aria-pressed="${on}">${esc(pname(p))}</button>${on && it.mode === 'weight' ? `<input type="number" class="w" id="w-${it.id}-${p.id}" data-w="${p.id}" value="${it.weights?.[p.id] ?? 1}" min="0" step="0.5" inputmode="decimal" aria-label="${unit(it)} ของ ${esc(pname(p))}"><span class="unit">${unit(it)}</span>` : ''}</span>`;
        }).join('')}
        <button type="button" class="ghost-chip" data-all>ทุกคน</button>
      </div>
      <div class="item-foot">
        <div class="seg" role="group" aria-label="วิธีหาร">
          <button type="button" data-mode="equal" class="${it.mode !== 'weight' ? 'on' : ''}" aria-pressed="${it.mode !== 'weight'}">หารเท่ากัน</button>
          <button type="button" data-mode="weight" class="${it.mode === 'weight' ? 'on' : ''}" aria-pressed="${it.mode === 'weight'}">${it.cat === 'karaoke' ? 'ตามชั่วโมงที่อยู่' : 'ตามสัดส่วน'}</button>
        </div>
        <button type="button" class="small-btn" data-idup>+ ทำซ้ำเป็นรอบใหม่</button>
        <span class="each" data-each></span>
      </div>
    </div>`).join('');
  updateEach();
}

function updateEach() {
  document.querySelectorAll('.item').forEach(el => {
    const it = s.items.find(i => i.id === el.dataset.iid); if (!it) return;
    const sh = it.shares.filter(id => s.people.some(p => p.id === id)), n = sh.length, pr = +it.price || 0;
    const W = sh.reduce((a, id) => a + wOf(it, id), 0);
    const e = el.querySelector('[data-each]');
    if (!n || !W) { e.textContent = 'ยังไม่มีคนหาร'; e.classList.add('bad'); return; }
    e.classList.remove('bad');
    e.textContent = it.mode === 'weight'
      ? `${n} คน · รวม ${+W.toFixed(2)} ${unit(it)} · ${unit(it)}ละ ${fmt2(pr / W)}`
      : `${n} คน · คนละ ${fmt2(pr / n)}`;
  });
}

function calc() {
  const mult = (1 + (s.sc ? (+s.scRate || 0) : 0) / 100) * (1 + (s.vat ? (+s.vatRate || 0) : 0) / 100);
  const per = {}; s.people.forEach(p => per[p.id] = { food: 0, karaoke: 0, drink: 0, other: 0, sub: 0 });
  const catTot = { food: 0, karaoke: 0, drink: 0, other: 0 };
  let sub = 0, orphan = 0;
  s.items.forEach(it => {
    const pr = +it.price || 0; sub += pr; catTot[it.cat] += pr;
    const sh = it.shares.filter(id => per[id]);
    const W = sh.reduce((a, id) => a + wOf(it, id), 0);
    if (!W) { orphan += pr; return; }
    sh.forEach(id => { const v = pr * wOf(it, id) / W; per[id][it.cat] += v; per[id].sub += v; });
  });
  const rows = s.people.map(p => { let tot = per[p.id].sub * mult; if (s.round) tot = Math.ceil(tot - 1e-9); return { p, r: per[p.id], tot }; });
  return { mult, sub, total: sub * mult, orphan, rows, catTot, collected: rows.reduce((a, r) => a + r.tot, 0) };
}

function renderHero(c) {
  $('#avatars').innerHTML = s.people.slice(0, 5).map(avatar).join('') + (s.people.length > 5 ? `<span class="av more">+${s.people.length - 5}</span>` : '');
  $('#gangText').textContent = s.people.length ? `${s.people.length} คน` : 'ยังไม่มีใคร';
  $('#heroTotal').textContent = whole(c.total);
  $('#heroAvg').textContent = s.people.length ? whole(c.total / s.people.length) : '฿0';
  $('#heroSub').textContent = `ยอดรวม ${s.items.length} รายการ${(s.sc || s.vat) ? ' · รวมค่าบริการ' : ''}`;
  $('#heroDots').innerHTML = CATS.filter(([k]) => c.catTot[k] > 0).map(([k, l]) => `<i style="--c:var(--${k})" title="${l}"></i>`).join('');
  $('#tabGang').textContent = s.people.length || '';
  $('#tabItems').textContent = s.items.length || '';
  $('#tabTotal').textContent = c.total ? whole(c.total) : '';
}

function renderSummary() {
  const c = calc(), sc = s.sc ? (+s.scRate || 0) : 0, vat = s.vat ? (+s.vatRate || 0) : 0;
  renderHero(c);
  const scAmt = c.sub * sc / 100, vatAmt = (c.sub + scAmt) * vat / 100;
  const payer = s.people.find(p => p.id === s.payer);
  let h = `<div class="panel-head" style="margin-bottom:6px"><h2>สรุปยอด</h2><span class="hint">${s.people.length} คน · ${s.items.length} รายการ</span></div>
  <div class="bill-total"><span class="hint">ยอดรวมทั้งบิล</span><span class="num">${fmt2(c.total)}</span></div>
  <div class="breakdown"><span>ค่าอาหารและเครื่องดื่ม</span><span>${fmt2(c.sub)}</span>
   ${sc ? `<span>Service charge ${sc}%</span><span>${fmt2(scAmt)}</span>` : ''}
   ${vat ? `<span>VAT ${vat}%</span><span>${fmt2(vatAmt)}</span>` : ''}</div>`;
  if (!s.people.length) h += `<p class="hint" style="padding-top:12px">เพิ่มคนในแท็บ “แก๊ง” ก่อน แล้วยอดของแต่ละคนจะขึ้นที่นี่</p>`;
  h += c.rows.map(({ p, r, tot }) => {
    const segs = CATS.filter(([k]) => r[k] > 0);
    return `<div class="srow"><div class="srow-top"><span class="who">${avatar(p)}<span class="sname">${esc(pname(p))}${p.id === s.payer ? '<span class="payer-tag">จ่ายบิล</span>' : ''}</span></span><span class="samt num">${baht(tot)}</span></div>
     <div class="bar">${segs.map(([k]) => `<i style="width:${r[k] / r.sub * 100}%;background:var(--${k})"></i>`).join('')}</div>
     <div class="sdetail">${segs.length ? segs.map(([k, l]) => `<span style="--c:var(--${k})">${l} ${fmt2(r[k] * c.mult)}</span>`).join('') : '<span style="--c:var(--line)">ยังไม่ได้หารรายการไหน</span>'}</div></div>`;
  }).join('');
  if (c.orphan > 0) h += `<p class="note">มี ${fmt2(c.orphan * c.mult)} ที่ยังไม่มีใครหาร ยอดคนรวมจะไม่ครบบิล</p>`;
  if (s.round && c.collected - c.total > 0.004 && !c.orphan) h += `<p class="hint" style="margin-top:10px">ปัดเศษแล้วเก็บเกินบิล ${fmt2(c.collected - c.total)}</p>`;
  h += `<div class="payer-row"><label for="payer">ใครจ่ายบิลไปก่อน</label><select id="payer"><option value="">— ยังไม่เลือก —</option>${s.people.map(p => `<option value="${p.id}" ${p.id === s.payer ? 'selected' : ''}>${esc(pname(p))}</option>`).join('')}</select></div>`;
  const canShare = typeof navigator.share === 'function';
  h += `<div class="share-actions">${canShare ? '<button type="button" id="shareBtn" class="btn-share">แชร์ไปไลน์</button>' : ''}<button type="button" id="copyBtn" class="${canShare ? 'btn-copy' : 'btn-share'}">คัดลอกข้อความ</button></div>
  <p class="toast" id="toast"></p><pre id="shareText">${esc(shareText(c, payer))}</pre>`;
  $('#summary').innerHTML = h;
}

function shareText(c, payer) {
  const d = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  const extras = [s.sc && `SC ${+s.scRate || 0}%`, s.vat && `VAT ${+s.vatRate || 0}%`].filter(Boolean).join(' + ');
  let t = `🧾 หารบิล ${d}\nรวม ${fmt2(c.total)}${extras ? ` (รวม ${extras})` : ''}\n\n`;
  t += c.rows.map(({ p, tot }) => `${pname(p)}  ${baht(tot)}${payer && p.id === payer.id ? '  (จ่ายบิลแล้ว)' : ''}`).join('\n');
  if (payer) t += `\n\nโอนให้ ${pname(payer)} นะ 🙏`;
  return t;
}

function renderSettings() {
  $('#sc').checked = s.sc; $('#scRate').value = s.scRate; $('#vat').checked = s.vat; $('#vatRate').value = s.vatRate; $('#round').checked = s.round;
  $('#sampleBanner').hidden = !s.sample;
}
function renderAll() { renderSettings(); renderPeople(); renderItems(); renderSummary(); }

/* ---------- events ---------- */
$('#addPerson').addEventListener('submit', e => {
  e.preventDefault();
  const v = $('#newPerson').value.trim(); if (!v) return;
  const p = { id: nid(), name: v, joins: allJoin() }; s.people.push(p);
  if (!s.payer) s.payer = p.id;
  $('#newPerson').value = ''; touched(); renderPeople(); renderItems(); renderSummary(); $('#newPerson').focus();
});

$('#people').addEventListener('input', e => {
  if (!e.target.matches('[data-pname]')) return;
  const row = e.target.closest('.prow'); const p = s.people.find(x => x.id === row.dataset.pid); p.name = e.target.value;
  row.querySelector('.av').innerHTML = initial(p);
  touched(); renderItems(); renderSummary();
});
$('#people').addEventListener('click', e => {
  const row = e.target.closest('.prow'); if (!row) return; const p = s.people.find(x => x.id === row.dataset.pid);
  const j = e.target.closest('[data-pjoin]');
  if (j) {
    const k = j.dataset.pjoin; p.joins[k] = !p.joins[k];
    s.items.filter(it => it.cat === k).forEach(it => { it.shares = it.shares.filter(id => id !== p.id); if (p.joins[k]) it.shares.push(p.id); });
    touched(); renderPeople(); renderItems(); renderSummary(); return;
  }
  if (e.target.closest('[data-pdel]')) {
    s.people = s.people.filter(x => x !== p); s.items.forEach(it => it.shares = it.shares.filter(id => id !== p.id));
    if (s.payer === p.id) s.payer = s.people[0]?.id || '';
    touched(); renderPeople(); renderItems(); renderSummary();
  }
});

document.querySelector('.add-items').addEventListener('click', e => {
  const b = e.target.closest('[data-add]'); if (!b) return; const cat = b.dataset.add;
  const it = { id: nid(), name: '', price: '', cat, shares: s.people.filter(p => cat === 'other' || p.joins[cat]).map(p => p.id) };
  s.items.push(it); touched(); renderItems(); renderSummary();
  const inp = document.getElementById('in-' + it.id); inp.scrollIntoView({ block: 'center' }); inp.focus();
});

$('#items').addEventListener('input', e => {
  const card = e.target.closest('.item'); if (!card) return;
  const it = s.items.find(i => i.id === card.dataset.iid);
  if (e.target.dataset.w) {
    it.weights = it.weights || {}; it.weights[e.target.dataset.w] = e.target.value === '' ? '' : Math.max(0, +e.target.value);
    touched(); updateEach(); renderSummary(); return;
  }
  const f = e.target.dataset.f; if (f !== 'name' && f !== 'price') return;
  it[f] = f === 'price' ? (e.target.value === '' ? '' : Math.max(0, +e.target.value)) : e.target.value;
  touched(); updateEach(); renderSummary();
});
$('#items').addEventListener('change', e => {
  if (e.target.dataset.f !== 'cat') return;
  const it = s.items.find(i => i.id === e.target.closest('.item').dataset.iid); it.cat = e.target.value;
  it.shares = s.people.filter(p => it.cat === 'other' || p.joins[it.cat]).map(p => p.id);
  touched(); renderItems(); renderSummary();
});
$('#items').addEventListener('click', e => {
  const el = e.target.closest('.item'); if (!el) return; const it = s.items.find(i => i.id === el.dataset.iid);
  const sh = e.target.closest('[data-share]');
  if (sh) { const id = sh.dataset.share; it.shares = it.shares.includes(id) ? it.shares.filter(x => x !== id) : [...it.shares, id]; }
  else if (e.target.closest('[data-all]')) it.shares = s.people.map(p => p.id);
  else if (e.target.closest('[data-idel]')) s.items = s.items.filter(i => i !== it);
  else if (e.target.closest('[data-mode]')) {
    it.mode = e.target.closest('[data-mode]').dataset.mode;
    if (it.mode === 'weight') {
      it.weights = it.weights || {};
      const hrs = (it.name.match(/(\d+(?:\.\d+)?)\s*ชม/) || [])[1];
      s.people.forEach(p => { if (it.weights[p.id] == null) it.weights[p.id] = it.cat === 'karaoke' && hrs ? +hrs : 1; });
    }
  }
  else if (e.target.closest('[data-idup]')) {
    const c = JSON.parse(JSON.stringify(it)); c.id = nid();
    c.name = /รอบ\s*\d+/.test(it.name) ? it.name.replace(/รอบ\s*(\d+)/, (m, n) => 'รอบ ' + (+n + 1)) : (it.name ? it.name + ' รอบ 2' : '');
    s.items.splice(s.items.indexOf(it) + 1, 0, c); touched(); renderItems(); renderSummary();
    const inp = document.getElementById('in-' + c.id); inp.scrollIntoView({ block: 'center' }); inp.focus(); return;
  }
  else return;
  touched(); renderItems(); renderSummary();
});

['sc', 'vat', 'round'].forEach(k => $('#' + k).addEventListener('change', e => { s[k] = e.target.checked; touched(); renderSummary(); }));
['scRate', 'vatRate'].forEach(k => $('#' + k).addEventListener('input', e => { s[k] = e.target.value === '' ? 0 : +e.target.value; touched(); renderSummary(); }));

$('#summary').addEventListener('change', e => { if (e.target.id === 'payer') { s.payer = e.target.value; touched(); renderSummary(); } });
$('#summary').addEventListener('click', e => {
  const txt = $('#shareText')?.textContent || '', t = $('#toast');
  if (e.target.id === 'shareBtn') {
    navigator.share({ text: txt }).catch(() => { /* ผู้ใช้กดยกเลิก */ });
    return;
  }
  if (e.target.id !== 'copyBtn') return;
  const sel = () => { const r = document.createRange(); r.selectNodeContents($('#shareText')); const g = getSelection(); g.removeAllRanges(); g.addRange(r); t.textContent = 'เลือกข้อความแล้ว กดคัดลอกเองได้เลย'; };
  try { navigator.clipboard.writeText(txt).then(() => { t.textContent = 'คัดลอกแล้ว วางในแชตได้เลย'; }, sel); } catch (err) { sel(); }
});

let resetArmed = null;
$('#resetBtn').addEventListener('click', e => {
  const b = e.currentTarget;
  if (!resetArmed) {
    b.textContent = 'กดอีกครั้งเพื่อล้าง'; b.classList.add('armed');
    resetArmed = setTimeout(() => { b.textContent = 'เริ่มบิลใหม่'; b.classList.remove('armed'); resetArmed = null; }, 3000);
    return;
  }
  clearTimeout(resetArmed); resetArmed = null; b.textContent = 'เริ่มบิลใหม่'; b.classList.remove('armed');
  s = blank(); save(); renderAll(); setTab('gang', true); $('#newPerson').focus();
});
$('#loadSample').addEventListener('click', () => { s = sample(); save(); renderAll(); });

/* ---------- start ---------- */
renderAll();
let startTab = null;
try { startTab = sessionStorage.getItem(TAB_KEY); } catch (e) { }
setTab(startTab || (s.people.length ? 'items' : 'gang'));

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));
}
