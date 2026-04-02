/* =============================================
   TRADING JOURNAL — APP.JS v2
   ============================================= */

'use strict';

/* ══════════════════════════════════════════════
   STORAGE
══════════════════════════════════════════════ */
const STORAGE_KEY = 'tj_trades';

function getTrades() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function saveTrades(trades) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
}

function addTrade(trade) {
  const trades = getTrades();
  trades.push({ ...trade, id: Date.now() });
  saveTrades(trades);
}

function deleteTrade(id) {
  saveTrades(getTrades().filter(t => t.id !== id));
}

function getTradesForDate(dateStr) {
  return getTrades().filter(t => t.data === dateStr);
}

/* ══════════════════════════════════════════════
   NAVIGATION
══════════════════════════════════════════════ */
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    const page = item.dataset.page;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');
    if (page === 'calendar') renderCalendar();
  });
});

/* ══════════════════════════════════════════════
   CALENDAR
══════════════════════════════════════════════ */
const MONTHS_PT = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

let calYear, calMonth;

function initCalendar() {
  const now = new Date();
  calYear  = now.getFullYear();
  calMonth = now.getMonth();
  renderCalendar();
}

function renderCalendar() {
  renderStats();
  renderGrid();
}

function renderStats() {
  const trades = getTrades().filter(t => {
    if (!t.data) return false;
    const [y, m] = t.data.split('-').map(Number);
    return y === calYear && m - 1 === calMonth;
  });

  const total   = trades.length;
  const wins    = trades.filter(t => t.resultado === 'Win').length;
  const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0';

  let profit = 0, loss = 0;
  trades.forEach(t => {
    const val = parseFloat(t.resultadoValor) || 0;
    if (t.sinal === '+') profit += val;
    else                  loss   += val;
  });

  const net = profit - loss;

  const fmt = v => {
    const abs = Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `US$ ${abs}`;
  };

  const netEl = document.getElementById('statTotal');
  netEl.textContent = (net >= 0 ? '' : '-') + fmt(net);
  netEl.className = 'stat-value ' + (net > 0 ? 'positive' : net < 0 ? 'negative' : '');

  document.getElementById('statWinRate').textContent = winRate + '%';
  document.getElementById('statOps').textContent     = total;
  document.getElementById('statProfit').textContent  = fmt(profit);
  document.getElementById('statLoss').textContent    = '-' + fmt(loss);
}

function renderGrid() {
  document.getElementById('calMonthLabel').textContent =
    `${MONTHS_PT[calMonth]} de ${calYear}`;

  const trades  = getTrades();
  const grid    = document.getElementById('calGrid');
  grid.innerHTML = '';

  const firstDay = new Date(calYear, calMonth, 1).getDay();  // 0=Sun
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today = new Date();
  const todayStr = toDateStr(today);

  // Build map: dateStr → trades[]
  const tradeMap = {};
  trades.forEach(t => {
    if (!t.data) return;
    const [y, m] = t.data.split('-').map(Number);
    if (y !== calYear || m - 1 !== calMonth) return;
    if (!tradeMap[t.data]) tradeMap[t.data] = [];
    tradeMap[t.data].push(t);
  });

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    const el = document.createElement('div');
    el.className = 'cal-day empty';
    grid.appendChild(el);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = toDateStr(new Date(calYear, calMonth, d));
    const dayTrades = tradeMap[dateStr] || [];
    const el = buildDayCell(d, dateStr, dayTrades, dateStr === todayStr);
    grid.appendChild(el);
  }
}

function buildDayCell(d, dateStr, dayTrades, isToday) {
  const el = document.createElement('div');
  el.className = 'cal-day';
  if (isToday) el.classList.add('today');

  // Compute net P&L
  let net = 0;
  dayTrades.forEach(t => {
    const val = parseFloat(t.resultadoValor) || 0;
    net += t.sinal === '+' ? val : -val;
  });

  // Dominant result
  const hasWin  = dayTrades.some(t => t.resultado === 'Win');
  const hasLoss = dayTrades.some(t => t.resultado === 'Loss');
  const hasBE   = dayTrades.some(t => t.resultado === 'BE');

  if (dayTrades.length > 0) {
    if (net > 0)       el.classList.add('has-win');
    else if (net < 0)  el.classList.add('has-loss');
    else               el.classList.add('has-be');
  }

  // Day number
  const num = document.createElement('div');
  num.className = 'cal-day-num';
  num.textContent = d;
  el.appendChild(num);

  // P&L display
  if (dayTrades.length > 0) {
    const pnl = document.createElement('div');
    pnl.className = 'cal-day-pnl ' + (net > 0 ? 'positive' : net < 0 ? 'negative' : 'neutral');
    const abs = Math.abs(net).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    pnl.textContent = (net >= 0 ? '+' : '-') + 'US$ ' + abs;
    el.appendChild(pnl);

    const meta = document.createElement('div');
    meta.className = 'cal-day-meta';
    meta.textContent = dayTrades.length + (dayTrades.length === 1 ? ' trade' : ' trades');
    el.appendChild(meta);
  }

  // Quick add button
  const addBtn = document.createElement('div');
  addBtn.className = 'cal-day-add';
  addBtn.textContent = '+';
  addBtn.title = 'Adicionar operação';
  addBtn.addEventListener('click', e => {
    e.stopPropagation();
    openTradeForm(dateStr);
  });
  el.appendChild(addBtn);

  // Click: open day list if trades exist, else open form
  el.addEventListener('click', () => {
    if (dayTrades.length > 0) openDayModal(dateStr, dayTrades);
    else openTradeForm(dateStr);
  });

  return el;
}

// Navigate calendar
document.getElementById('calPrev').addEventListener('click', () => {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
});

document.getElementById('calNext').addEventListener('click', () => {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar();
});

/* ══════════════════════════════════════════════
   DAY MODAL — list of trades per day
══════════════════════════════════════════════ */
const dayModal = document.getElementById('dayModal');
let currentDayStr = null;

function openDayModal(dateStr, dayTrades) {
  currentDayStr = dateStr;
  document.getElementById('dayModalDate').textContent = formatDate(dateStr);
  renderDayList(dayTrades);
  dayModal.classList.add('open');
}

function renderDayList(dayTrades) {
  const body = document.getElementById('dayModalBody');
  if (dayTrades.length === 0) {
    body.innerHTML = '<p class="empty-day-msg">Nenhuma operação registrada neste dia.</p>';
    return;
  }

  body.innerHTML = '';
  dayTrades.forEach(t => {
    const net = (parseFloat(t.resultadoValor) || 0) * (t.sinal === '+' ? 1 : -1);
    const abs = Math.abs(net).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const pnlClass = net > 0 ? 'positive' : net < 0 ? 'negative' : 'neutral';
    const badgeClass = (t.resultado || '').toLowerCase();

    const item = document.createElement('div');
    item.className = 'trade-list-item';
    item.innerHTML = `
      <div class="trade-list-badge ${badgeClass}"></div>
      <div class="trade-list-info">
        <div class="trade-list-ativo">${t.ativo || '—'}</div>
        <div class="trade-list-meta">${t.horario || ''} · ${t.resultado || '—'} · ${t.emocional || '—'}</div>
        <div class="trade-list-actions">
          <button class="btn-icon" data-id="${t.id}" data-action="pdf">📄 PDF</button>
          <button class="btn-icon delete" data-id="${t.id}" data-action="delete">🗑 Excluir</button>
        </div>
      </div>
      <div class="trade-list-pnl ${pnlClass}">${net >= 0 ? '+' : '-'}US$ ${abs}</div>
    `;
    body.appendChild(item);
  });

  // Action buttons
  body.querySelectorAll('.btn-icon').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = Number(btn.dataset.id);
      if (btn.dataset.action === 'delete') {
        if (confirm('Excluir esta operação?')) {
          deleteTrade(id);
          const updated = getTradesForDate(currentDayStr);
          if (updated.length === 0) { closeDayModal(); renderCalendar(); }
          else { renderDayList(updated); renderCalendar(); }
        }
      } else if (btn.dataset.action === 'pdf') {
        const trade = getTrades().find(t => t.id === id);
        if (trade) { populateForm(trade); openPrint(collectData()); }
      }
    });
  });
}

function closeDayModal() {
  dayModal.classList.remove('open');
  currentDayStr = null;
}

document.getElementById('dayModalClose').addEventListener('click', closeDayModal);
document.getElementById('dayModalOverlay').addEventListener('click', closeDayModal);
document.getElementById('btnAddTrade').addEventListener('click', () => {
  closeDayModal();
  openTradeForm(currentDayStr || todayStr());
});

/* ══════════════════════════════════════════════
   TRADE FORM MODAL
══════════════════════════════════════════════ */
const tradeModal = document.getElementById('tradeModal');

function openTradeForm(dateStr) {
  resetForm();
  document.getElementById('data').value = dateStr || todayStr();
  document.getElementById('horario').value = nowTime();
  document.getElementById('tradeModalDate').textContent = formatDate(dateStr || todayStr());
  tradeModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeTradeForm() {
  tradeModal.classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('tradeModalClose').addEventListener('click', closeTradeForm);
document.getElementById('tradeModalOverlay').addEventListener('click', closeTradeForm);

// "Nova Operação" button (top bar)
document.getElementById('btnNewTrade').addEventListener('click', () => {
  openTradeForm(todayStr());
});

// ESC key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeTradeForm();
    closeDayModal();
    closePdfModal();
  }
});

/* ══════════════════════════════════════════════
   FORM — collect & populate
══════════════════════════════════════════════ */
function collectData() {
  const form = document.getElementById('tradeForm');
  const setupAll = [...form.querySelectorAll('[name="setup"]')]
    .map(el => ({ label: el.value, checked: el.checked }));
  const sinal = form.querySelector('[name="sinal"]').value;
  const resultadoValor = form.querySelector('[name="resultadoValor"]').value;

  return {
    data:           form.querySelector('[name="data"]').value,
    horario:        form.querySelector('[name="horario"]').value,
    ativo:          form.querySelector('[name="ativo"]').value,
    setup:          setupAll,
    preco:          form.querySelector('[name="preco"]').value,
    lote:           form.querySelector('[name="lote"]').value,
    stop:           form.querySelector('[name="stop"]').value,
    tp:             form.querySelector('[name="tp"]').value,
    resultado:      (form.querySelector('[name="resultado"]:checked') || {}).value || '',
    valorArriscado: form.querySelector('[name="valorArriscado"]').value,
    sinal,
    resultadoValor,
    resultadoFin:   sinal + ' $' + (resultadoValor || '0.00'),
    emocional:      (form.querySelector('[name="emocional"]:checked') || {}).value || '',
    seguiuPlano:    form.querySelector('[name="seguiuPlano"]').value || '—',
    entrouCedo:     form.querySelector('[name="entrouCedo"]').value || '—',
    hesitou:        form.querySelector('[name="hesitou"]').value || '—',
    observacoes:    form.querySelector('[name="observacoes"]').value || '—',
    printSrc:       (previewImg.style.display !== 'none' && previewImg.src) ? previewImg.src : null,
  };
}

function populateForm(t) {
  const form = document.getElementById('tradeForm');
  form.querySelector('[name="data"]').value    = t.data    || '';
  form.querySelector('[name="horario"]').value = t.horario || '';
  form.querySelector('[name="ativo"]').value   = t.ativo   || '';
  form.querySelector('[name="preco"]').value   = t.preco   || '';
  form.querySelector('[name="lote"]').value    = t.lote    || '';
  form.querySelector('[name="stop"]').value    = t.stop    || '';
  form.querySelector('[name="tp"]').value      = t.tp      || '';
  form.querySelector('[name="valorArriscado"]').value = t.valorArriscado || '25';
  form.querySelector('[name="sinal"]').value   = t.sinal   || '+';
  form.querySelector('[name="resultadoValor"]').value = t.resultadoValor || '';
  form.querySelector('[name="seguiuPlano"]').value = t.seguiuPlano === '—' ? '' : (t.seguiuPlano || '');
  form.querySelector('[name="entrouCedo"]').value  = t.entrouCedo  === '—' ? '' : (t.entrouCedo  || '');
  form.querySelector('[name="hesitou"]').value     = t.hesitou     === '—' ? '' : (t.hesitou     || '');
  form.querySelector('[name="observacoes"]').value = t.observacoes === '—' ? '' : (t.observacoes || '');

  // checkboxes
  form.querySelectorAll('[name="setup"]').forEach(cb => {
    if (t.setup) {
      const match = t.setup.find(s => s.label === cb.value);
      cb.checked = match ? match.checked : false;
    }
  });

  // radios
  if (t.resultado) {
    const r = form.querySelector(`[name="resultado"][value="${t.resultado}"]`);
    if (r) r.checked = true;
  }
  if (t.emocional) {
    const r = form.querySelector(`[name="emocional"][value="${t.emocional}"]`);
    if (r) r.checked = true;
  }
}

function resetForm() {
  document.getElementById('tradeForm').reset();
  previewImg.src = '';
  previewImg.style.display = 'none';
  uploadPlaceholder.style.display = 'flex';
  document.querySelector('[name="valorArriscado"]').value = '25';
}

function validateForm() {
  const form = document.getElementById('tradeForm');
  const data   = form.querySelector('[name="data"]').value;
  const ativo  = form.querySelector('[name="ativo"]').value;
  const preco  = form.querySelector('[name="preco"]').value;
  const lote   = form.querySelector('[name="lote"]').value;
  const result = form.querySelector('[name="resultado"]:checked');
  const emoc   = form.querySelector('[name="emocional"]:checked');

  if (!data)   { alert('Informe a data da operação.'); return false; }
  if (!ativo)  { alert('Selecione o ativo.'); return false; }
  if (!preco)  { alert('Informe o preço de entrada.'); return false; }
  if (!lote)   { alert('Informe o tamanho do lote.'); return false; }
  if (!result) { alert('Selecione o resultado (Win / Loss / BE).'); return false; }
  if (!emoc)   { alert('Selecione o estado emocional.'); return false; }
  return true;
}

/* ══════════════════════════════════════════════
   SAVE TRADE
══════════════════════════════════════════════ */
document.getElementById('btnSave').addEventListener('click', () => {
  if (!validateForm()) return;
  addTrade(collectData());
  closeTradeForm();
  renderCalendar();
  showToast('Operação salva com sucesso!');
});

/* ══════════════════════════════════════════════
   IMAGE PREVIEW
══════════════════════════════════════════════ */
const printInput        = document.getElementById('printTrade');
const previewImg        = document.getElementById('previewImg');
const uploadPlaceholder = document.getElementById('uploadPlaceholder');

printInput.addEventListener('change', () => {
  const file = printInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    previewImg.src = e.target.result;
    previewImg.style.display = 'block';
    uploadPlaceholder.style.display = 'none';
  };
  reader.readAsDataURL(file);
});

/* ══════════════════════════════════════════════
   NUMBER SPIN BUTTONS
══════════════════════════════════════════════ */
document.querySelectorAll('.number-wrap').forEach(wrap => {
  const input  = wrap.querySelector('input[type="number"]');
  const [up, down] = wrap.querySelectorAll('.spin-btns button');
  const step = parseFloat(input.step) || 1;

  up.addEventListener('click', () => {
    const val = parseFloat(input.value) || 0;
    input.value = parseFloat((val + step).toFixed(10));
    input.dispatchEvent(new Event('input'));
  });

  down.addEventListener('click', () => {
    const val  = parseFloat(input.value) || 0;
    const next = parseFloat((val - step).toFixed(10));
    input.value = next < 0 ? 0 : next;
    input.dispatchEvent(new Event('input'));
  });
});

/* ══════════════════════════════════════════════
   PDF PREVIEW MODAL
══════════════════════════════════════════════ */
document.getElementById('btnPreview').addEventListener('click', () => {
  if (!validateForm()) return;
  const d = collectData();
  document.getElementById('pdfPreview').innerHTML = buildPreviewHTML(d);
  document.getElementById('previewModal').style.display = 'flex';
});

document.getElementById('btnGenerate').addEventListener('click', () => {
  if (!validateForm()) return;
  openPrint(collectData());
});

document.getElementById('btnDownload').addEventListener('click', () => {
  openPrint(collectData());
});

function closePdfModal() {
  document.getElementById('previewModal').style.display = 'none';
}

document.getElementById('modalClose').addEventListener('click', closePdfModal);
document.getElementById('btnModalClose').addEventListener('click', closePdfModal);
document.getElementById('modalOverlay').addEventListener('click', closePdfModal);

/* ══════════════════════════════════════════════
   PDF GENERATION (window.print)
══════════════════════════════════════════════ */
function getFileName(d) {
  const date = d.data || todayStr();
  const [y, m, day] = date.split('-');
  const time = (d.horario || '0000').replace(':', '');
  return { folder: `trades/${y}/${m}/${day}`, filename: `${day}-${m}-${y}_${time}_${d.ativo || 'trade'}` };
}

function openPrint(d) {
  const html = buildPrintHTML(d);
  const win  = window.open('', '_blank', 'width=900,height=700');
  if (!win) { alert('Popup bloqueado! Permita popups para este site.'); return; }
  win.document.write(html);
  win.document.close();
  win.onload = () => setTimeout(() => win.print(), 300);
}

function buildPrintHTML(d) {
  const { folder, filename } = getFileName(d);
  const resultColor = { Win:'#16a34a', Loss:'#dc2626', BE:'#b45309' }[d.resultado]  || '#374151';
  const resultBg    = { Win:'#dcfce7', Loss:'#fee2e2', BE:'#fef9c3' }[d.resultado]  || '#f3f4f6';
  const emoColor    = { Calmo:'#16a34a', Ansioso:'#b45309', Impulsivo:'#dc2626', Overtrade:'#7c3aed' }[d.emocional] || '#374151';
  const emoBg       = { Calmo:'#dcfce7', Ansioso:'#fef9c3', Impulsivo:'#fee2e2', Overtrade:'#ede9fe' }[d.emocional] || '#f3f4f6';

  const setupRows = (d.setup || []).map(s => `
    <tr><td style="padding:4px 0;color:${s.checked?'#16a34a':'#9ca3af'};font-weight:${s.checked?'600':'400'}">
      ${s.checked?'☑':'☐'} ${s.label}
    </td></tr>`).join('');

  const printBlock = d.printSrc ? `
    <div class="section">
      <div class="section-title">📸 Print do Trade</div>
      <div style="text-align:center"><img src="${d.printSrc}" style="max-width:100%;max-height:280px;border-radius:6px;border:1px solid #e5e7eb;object-fit:contain" /></div>
    </div>` : '';

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/>
<title>${filename}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',Arial,sans-serif;font-size:13px;color:#111;background:#fff;padding:28px 32px;line-height:1.6}
  h1{font-size:20px;font-weight:900;color:#111;letter-spacing:-0.3px}
  .subtitle{color:#999;font-size:11px;margin-top:2px;margin-bottom:20px;text-transform:uppercase;letter-spacing:.08em}
  .section{margin-bottom:16px}
  .section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#e8192c;border-bottom:1px solid #f5e8e9;padding-bottom:4px;margin-bottom:8px;display:flex;align-items:center;gap:6px}
  .section-title::before{content:'';display:inline-block;width:3px;height:10px;background:#e8192c;border-radius:2px}
  .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
  .grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
  .item-label{font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:.06em;font-weight:600}
  .item-value{font-size:13px;font-weight:700;color:#111}
  .badge{display:inline-block;padding:3px 12px;border-radius:20px;font-weight:700;font-size:12px}
  table{width:100%;border-collapse:collapse}
  .save-path{background:#fff5f5;border:1px solid #fecaca;border-radius:5px;padding:7px 12px;font-size:11px;color:#e8192c;margin-bottom:16px}
  .footer{margin-top:20px;padding-top:8px;border-top:1px solid #f5e8e9;font-size:10px;color:#aaa;display:flex;justify-content:space-between}
  @media print{.save-path{display:none}body{padding:16px 20px}}
</style></head><body>
<div class="save-path">💾 Salvar em: <strong>${folder}/${filename}.pdf</strong></div>
<h1>Trading Journal</h1>
<div class="subtitle">Gerado em ${new Date().toLocaleString('pt-BR')}</div>
<div class="section"><div class="section-title">Identificação</div>
<div class="grid">
  <div><div class="item-label">Data</div><div class="item-value">${formatDate(d.data)}</div></div>
  <div><div class="item-label">Horário</div><div class="item-value">${d.horario||'—'}</div></div>
  <div><div class="item-label">Ativo</div><div class="item-value">${d.ativo||'—'}</div></div>
</div></div>
<div class="section"><div class="section-title">Setup</div><table>${setupRows}</table></div>
<div class="section"><div class="section-title">Entrada</div>
<div class="grid">
  <div><div class="item-label">Preço</div><div class="item-value">${d.preco||'—'}</div></div>
  <div><div class="item-label">Lote</div><div class="item-value">${d.lote||'—'}</div></div>
  <div><div class="item-label">Stop</div><div class="item-value">${d.stop||'—'}</div></div>
  <div><div class="item-label">Take Profit</div><div class="item-value">${d.tp||'—'}</div></div>
</div></div>
<div class="section"><div class="section-title">Resultado & Risco</div>
<div class="grid">
  <div><div class="item-label">Resultado</div><span class="badge" style="background:${resultBg};color:${resultColor}">${d.resultado||'—'}</span></div>
  <div><div class="item-label">Arriscado</div><div class="item-value">$${d.valorArriscado}</div></div>
  <div><div class="item-label">Resultado $</div><div class="item-value">${d.resultadoFin}</div></div>
</div></div>
<div class="section"><div class="section-title">Emocional</div>
<span class="badge" style="background:${emoBg};color:${emoColor}">${d.emocional||'—'}</span></div>
<div class="section"><div class="section-title">Observações</div>
<div class="grid-3" style="margin-bottom:8px">
  <div><div class="item-label">Seguiu plano?</div><div class="item-value">${d.seguiuPlano}</div></div>
  <div><div class="item-label">Entrou cedo?</div><div class="item-value">${d.entrouCedo}</div></div>
  <div><div class="item-label">Hesitou?</div><div class="item-value">${d.hesitou}</div></div>
</div>
<div class="item-label">Anotações</div>
<div style="font-size:12px;color:#374151;white-space:pre-wrap;margin-top:2px">${d.observacoes}</div></div>
${printBlock}
<div class="footer"><span>Trading Journal</span><span>${formatDate(d.data)} · ${d.ativo||''}</span></div>
</body></html>`;
}

function buildPreviewHTML(d) {
  const { folder, filename } = getFileName(d);
  const setupRows = (d.setup || []).map(s =>
    `<div class="pdf-check ${s.checked?'checked':'unchecked'}">${s.checked?'☑':'☐'} ${s.label}</div>`
  ).join('');
  const printBlock = d.printSrc
    ? `<div class="pdf-section"><h3>📸 Print do Trade</h3><div class="pdf-print-img"><img src="${d.printSrc}" /></div></div>`
    : '';

  return `<div class="pdf-card">
    <div class="pdf-save-hint">💾 Salvar em: <strong>${folder}/${filename}.pdf</strong></div>
    <h1>Trading Journal</h1>
    <div class="pdf-subtitle">Gerado em ${new Date().toLocaleString('pt-BR')}</div>
    <div class="pdf-section"><h3>📅 Identificação</h3>
      <div class="pdf-grid">
        <div class="pdf-item"><span class="pdf-label">Data</span><span class="pdf-value">${formatDate(d.data)}</span></div>
        <div class="pdf-item"><span class="pdf-label">Horário</span><span class="pdf-value">${d.horario||'—'}</span></div>
        <div class="pdf-item"><span class="pdf-label">Ativo</span><span class="pdf-value">${d.ativo||'—'}</span></div>
      </div></div>
    <div class="pdf-section"><h3>🎯 Setup</h3><div class="pdf-checks">${setupRows}</div></div>
    <div class="pdf-section"><h3>📥 Entrada</h3>
      <div class="pdf-grid">
        <div class="pdf-item"><span class="pdf-label">Preço</span><span class="pdf-value">${d.preco||'—'}</span></div>
        <div class="pdf-item"><span class="pdf-label">Lote</span><span class="pdf-value">${d.lote||'—'}</span></div>
        <div class="pdf-item"><span class="pdf-label">Stop</span><span class="pdf-value">${d.stop||'—'}</span></div>
        <div class="pdf-item"><span class="pdf-label">TP</span><span class="pdf-value">${d.tp||'—'}</span></div>
      </div></div>
    <div class="pdf-section"><h3>💰 Resultado & Risco</h3>
      <div class="pdf-grid">
        <div class="pdf-item"><span class="pdf-label">Resultado</span><span class="pdf-resultado ${(d.resultado||'').toLowerCase()}">${d.resultado||'—'}</span></div>
        <div class="pdf-item"><span class="pdf-label">Arriscado</span><span class="pdf-value">$${d.valorArriscado}</span></div>
        <div class="pdf-item"><span class="pdf-label">Resultado $</span><span class="pdf-value">${d.resultadoFin}</span></div>
      </div></div>
    <div class="pdf-section"><h3>🧠 Emocional</h3><span class="pdf-emocional ${(d.emocional||'').toLowerCase()}">${d.emocional||'—'}</span></div>
    <div class="pdf-section"><h3>📌 Observações</h3>
      <div class="pdf-obs-grid">
        <div class="pdf-item"><span class="pdf-label">Seguiu plano?</span><span class="pdf-value">${d.seguiuPlano}</span></div>
        <div class="pdf-item"><span class="pdf-label">Entrou cedo?</span><span class="pdf-value">${d.entrouCedo}</span></div>
        <div class="pdf-item"><span class="pdf-label">Hesitou?</span><span class="pdf-value">${d.hesitou}</span></div>
      </div>
      <div class="pdf-item" style="margin-top:.5rem"><span class="pdf-label">Anotações</span>
        <span class="pdf-value" style="font-weight:400;white-space:pre-wrap">${d.observacoes}</span></div></div>
    ${printBlock}
    <div class="pdf-footer"><span>Trading Journal</span><span>${formatDate(d.data)} · ${d.ativo||''}</span></div>
  </div>`;
}

/* ══════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════ */
function showToast(msg, type = 'success') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
      position:fixed;bottom:2rem;right:2rem;z-index:9999;
      padding:.85rem 1.25rem;border-radius:8px;
      font-size:.875rem;font-weight:600;font-family:Inter,sans-serif;
      box-shadow:0 8px 24px rgba(0,0,0,.5);
      white-space:pre-line;max-width:320px;line-height:1.5;
      transition:opacity .3s;
    `;
    document.body.appendChild(toast);
  }
  toast.style.background = type === 'success' ? '#3ddc84' : '#e8192c';
  toast.style.color = type === 'success' ? '#0a1f12' : '#fff';
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.style.opacity = '0'; }, 3500);
}

/* ══════════════════════════════════════════════
   UTILS
══════════════════════════════════════════════ */
function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function todayStr() { return toDateStr(new Date()); }

function nowTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

/* ══════════════════════════════════════════════
   INIT
══════════════════════════════════════════════ */
initCalendar();
