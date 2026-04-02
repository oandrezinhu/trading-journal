/* =============================================
   TRADING JOURNAL — APP.JS
   ============================================= */

'use strict';

// ── Image preview ──────────────────────────────
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

// ── Collect form data ──────────────────────────
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
    resultado:      (form.querySelector('[name="resultado"]:checked') || {}).value || '—',
    valorArriscado: form.querySelector('[name="valorArriscado"]').value,
    resultadoFin:   sinal + ' $' + (resultadoValor || '0.00'),
    emocional:      (form.querySelector('[name="emocional"]:checked') || {}).value || '—',
    seguiuPlano:    form.querySelector('[name="seguiuPlano"]').value || '—',
    entrouCedo:     form.querySelector('[name="entrouCedo"]').value || '—',
    hesitou:        form.querySelector('[name="hesitou"]').value || '—',
    observacoes:    form.querySelector('[name="observacoes"]').value || '—',
    printSrc:       (previewImg.style.display !== 'none' && previewImg.src) ? previewImg.src : null,
  };
}

// ── Validate ───────────────────────────────────
function validate() {
  const form = document.getElementById('tradeForm');
  if (!form.reportValidity()) return false;
  if (!form.querySelector('[name="resultado"]:checked')) {
    alert('Selecione o resultado do trade (Win / Loss / BE).');
    return false;
  }
  if (!form.querySelector('[name="emocional"]:checked')) {
    alert('Selecione o estado emocional.');
    return false;
  }
  return true;
}

// ── Format date ────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

// ── Build PDF filename ─────────────────────────
function getFileName(d) {
  const date = d.data || new Date().toISOString().slice(0, 10);
  const [y, m, day] = date.split('-');
  const time = (d.horario || '0000').replace(':', '');
  return {
    folder:   `trades/${y}/${m}/${day}`,
    filename: `${day}-${m}-${y}_${time}_${d.ativo || 'trade'}`,
  };
}

// ── Build print HTML ───────────────────────────
function buildPrintHTML(d) {
  const { folder, filename } = getFileName(d);

  const resultColor = { Win: '#15803d', Loss: '#b91c1c', BE: '#854d0e' }[d.resultado] || '#374151';
  const resultBg    = { Win: '#dcfce7', Loss: '#fee2e2', BE: '#fef9c3' }[d.resultado] || '#f3f4f6';
  const emoColor    = { Calmo: '#15803d', Ansioso: '#854d0e', Impulsivo: '#b91c1c', Overtrade: '#7c3aed' }[d.emocional] || '#374151';
  const emoBg       = { Calmo: '#dcfce7', Ansioso: '#fef9c3', Impulsivo: '#fee2e2', Overtrade: '#ede9fe' }[d.emocional] || '#f3f4f6';

  const setupRows = d.setup.map(s => `
    <tr>
      <td style="padding:4px 8px;color:${s.checked ? '#059669' : '#9ca3af'};font-weight:${s.checked ? '600' : '400'}">
        ${s.checked ? '☑' : '☐'} ${s.label}
      </td>
    </tr>`).join('');

  const printBlock = d.printSrc ? `
    <div class="section">
      <div class="section-title">📸 Print do Trade</div>
      <div style="text-align:center">
        <img src="${d.printSrc}" style="max-width:100%;max-height:320px;border-radius:6px;border:1px solid #e5e7eb;object-fit:contain" />
      </div>
    </div>` : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${filename}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 13px;
      color: #111827;
      background: #fff;
      padding: 28px 32px;
      line-height: 1.6;
    }
    h1 { font-size: 20px; font-weight: 700; color: #111827; }
    .subtitle { color: #6b7280; font-size: 11px; margin-top: 2px; margin-bottom: 20px; }
    .section { margin-bottom: 16px; }
    .section-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #3b82f6;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 4px;
      margin-bottom: 8px;
    }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .item-label { font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600; }
    .item-value { font-size: 13px; font-weight: 600; color: #111827; }
    .badge {
      display: inline-block;
      padding: 3px 12px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 12px;
    }
    table { width: 100%; border-collapse: collapse; }
    .obs-text { font-size: 12px; color: #374151; white-space: pre-wrap; margin-top: 4px; }
    .footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
      font-size: 10px;
      color: #9ca3af;
      display: flex;
      justify-content: space-between;
    }
    .save-path {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 11px;
      color: #0369a1;
      margin-bottom: 16px;
    }
    @media print {
      .save-path { display: none; }
      body { padding: 16px 20px; }
    }
  </style>
</head>
<body>

  <div class="save-path">
    💾 Salve este PDF em: <strong>${folder}/${filename}.pdf</strong>
  </div>

  <h1>📓 Trading Journal</h1>
  <div class="subtitle">Gerado em ${new Date().toLocaleString('pt-BR')}</div>

  <div class="section">
    <div class="section-title">📅 Identificação</div>
    <div class="grid">
      <div><div class="item-label">Data</div><div class="item-value">${formatDate(d.data)}</div></div>
      <div><div class="item-label">Horário</div><div class="item-value">${d.horario || '—'}</div></div>
      <div><div class="item-label">Ativo</div><div class="item-value">${d.ativo || '—'}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">🎯 Setup</div>
    <table>${setupRows}</table>
  </div>

  <div class="section">
    <div class="section-title">📥 Entrada</div>
    <div class="grid">
      <div><div class="item-label">Preço</div><div class="item-value">${d.preco || '—'}</div></div>
      <div><div class="item-label">Lote</div><div class="item-value">${d.lote || '—'}</div></div>
      <div><div class="item-label">Stop (pips/pts)</div><div class="item-value">${d.stop || '—'}</div></div>
      <div><div class="item-label">Take Profit</div><div class="item-value">${d.tp || '—'}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">💰 Resultado &amp; Risco</div>
    <div class="grid">
      <div>
        <div class="item-label">Resultado</div>
        <span class="badge" style="background:${resultBg};color:${resultColor}">${d.resultado}</span>
      </div>
      <div><div class="item-label">Valor arriscado</div><div class="item-value">$${d.valorArriscado}</div></div>
      <div><div class="item-label">Resultado em $</div><div class="item-value">${d.resultadoFin}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">🧠 Emocional</div>
    <span class="badge" style="background:${emoBg};color:${emoColor}">${d.emocional}</span>
  </div>

  <div class="section">
    <div class="section-title">📌 Observações</div>
    <div class="grid-3" style="margin-bottom:8px">
      <div><div class="item-label">Seguiu o plano?</div><div class="item-value">${d.seguiuPlano}</div></div>
      <div><div class="item-label">Entrou cedo?</div><div class="item-value">${d.entrouCedo}</div></div>
      <div><div class="item-label">Hesitou?</div><div class="item-value">${d.hesitou}</div></div>
    </div>
    <div class="item-label">Anotações</div>
    <div class="obs-text">${d.observacoes}</div>
  </div>

  ${printBlock}

  <div class="footer">
    <span>Trading Journal</span>
    <span>${formatDate(d.data)} • ${d.ativo || ''}</span>
  </div>

</body>
</html>`;
}

// ── Open print window ──────────────────────────
function openPrint(d) {
  const html = buildPrintHTML(d);
  const win  = window.open('', '_blank', 'width=900,height=700');
  if (!win) {
    alert('Popup bloqueado! Permita popups para este site e tente novamente.');
    return;
  }
  win.document.write(html);
  win.document.close();

  // Trigger print after images load
  win.onload = () => {
    setTimeout(() => win.print(), 300);
  };
}

// ── Build preview HTML (modal) ─────────────────
function buildPreviewHTML(d) {
  // Reutiliza o mesmo HTML do print mas sem abrir janela
  const resultColor = { Win: '#15803d', Loss: '#b91c1c', BE: '#854d0e' }[d.resultado] || '#374151';
  const resultBg    = { Win: '#dcfce7', Loss: '#fee2e2', BE: '#fef9c3' }[d.resultado] || '#f3f4f6';
  const emoColor    = { Calmo: '#15803d', Ansioso: '#854d0e', Impulsivo: '#b91c1c', Overtrade: '#7c3aed' }[d.emocional] || '#374151';
  const emoBg       = { Calmo: '#dcfce7', Ansioso: '#fef9c3', Impulsivo: '#fee2e2', Overtrade: '#ede9fe' }[d.emocional] || '#f3f4f6';

  const setupRows = d.setup.map(s =>
    `<div class="pdf-check ${s.checked ? 'checked' : 'unchecked'}">${s.checked ? '☑' : '☐'} ${s.label}</div>`
  ).join('');

  const printBlock = d.printSrc
    ? `<div class="pdf-section"><h3>📸 Print do Trade</h3>
       <div class="pdf-print-img"><img src="${d.printSrc}" alt="Print do trade" /></div></div>`
    : '';

  const { folder, filename } = getFileName(d);

  return `
    <div class="pdf-card">
      <div class="pdf-save-hint">💾 Salvar em: <strong>${folder}/${filename}.pdf</strong></div>
      <h1>📓 Trading Journal</h1>
      <div class="pdf-subtitle">Registro gerado em ${new Date().toLocaleString('pt-BR')}</div>
      <div class="pdf-section"><h3>📅 Identificação</h3>
        <div class="pdf-grid">
          <div class="pdf-item"><span class="pdf-label">Data</span><span class="pdf-value">${formatDate(d.data)}</span></div>
          <div class="pdf-item"><span class="pdf-label">Horário</span><span class="pdf-value">${d.horario || '—'}</span></div>
          <div class="pdf-item"><span class="pdf-label">Ativo</span><span class="pdf-value">${d.ativo || '—'}</span></div>
        </div>
      </div>
      <div class="pdf-section"><h3>🎯 Setup</h3><div class="pdf-checks">${setupRows}</div></div>
      <div class="pdf-section"><h3>📥 Entrada</h3>
        <div class="pdf-grid">
          <div class="pdf-item"><span class="pdf-label">Preço</span><span class="pdf-value">${d.preco || '—'}</span></div>
          <div class="pdf-item"><span class="pdf-label">Lote</span><span class="pdf-value">${d.lote || '—'}</span></div>
          <div class="pdf-item"><span class="pdf-label">Stop</span><span class="pdf-value">${d.stop || '—'}</span></div>
          <div class="pdf-item"><span class="pdf-label">Take Profit</span><span class="pdf-value">${d.tp || '—'}</span></div>
        </div>
      </div>
      <div class="pdf-section"><h3>💰 Resultado &amp; Risco</h3>
        <div class="pdf-grid">
          <div class="pdf-item"><span class="pdf-label">Resultado</span>
            <span class="pdf-resultado ${(d.resultado||'').toLowerCase()}">${d.resultado}</span></div>
          <div class="pdf-item"><span class="pdf-label">Valor arriscado</span><span class="pdf-value">$${d.valorArriscado}</span></div>
          <div class="pdf-item"><span class="pdf-label">Resultado em $</span><span class="pdf-value">${d.resultadoFin}</span></div>
        </div>
      </div>
      <div class="pdf-section"><h3>🧠 Emocional</h3>
        <span class="pdf-emocional ${(d.emocional||'').toLowerCase()}">${d.emocional}</span>
      </div>
      <div class="pdf-section"><h3>📌 Observações</h3>
        <div class="pdf-obs-grid">
          <div class="pdf-item"><span class="pdf-label">Seguiu o plano?</span><span class="pdf-value">${d.seguiuPlano}</span></div>
          <div class="pdf-item"><span class="pdf-label">Entrou cedo?</span><span class="pdf-value">${d.entrouCedo}</span></div>
          <div class="pdf-item"><span class="pdf-label">Hesitou?</span><span class="pdf-value">${d.hesitou}</span></div>
        </div>
        <div class="pdf-item" style="margin-top:0.5rem">
          <span class="pdf-label">Anotações</span>
          <span class="pdf-value" style="font-weight:400;white-space:pre-wrap;">${d.observacoes}</span>
        </div>
      </div>
      ${printBlock}
      <div class="pdf-footer">Trading Journal • ${formatDate(d.data)} • ${d.ativo || ''}</div>
    </div>`;
}

// ── PREVIEW button ─────────────────────────────
document.getElementById('btnPreview').addEventListener('click', () => {
  if (!validate()) return;
  const d = collectData();
  document.getElementById('pdfPreview').innerHTML = buildPreviewHTML(d);
  document.getElementById('previewModal').style.display = 'flex';
});

// ── GENERATE PDF button ────────────────────────
document.getElementById('btnGenerate').addEventListener('click', () => {
  if (!validate()) return;
  openPrint(collectData());
});

// ── DOWNLOAD from modal ────────────────────────
document.getElementById('btnDownload').addEventListener('click', () => {
  openPrint(collectData());
});

// ── Close modal ────────────────────────────────
function closeModal() {
  document.getElementById('previewModal').style.display = 'none';
}
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('btnModalClose').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', closeModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ── Custom number spin buttons ─────────────────
document.querySelectorAll('.number-wrap').forEach(wrap => {
  const input = wrap.querySelector('input[type="number"]');
  const [btnUp, btnDown] = wrap.querySelectorAll('.spin-btns button');
  const step = parseFloat(input.step) || 1;

  btnUp.addEventListener('click', () => {
    const val = parseFloat(input.value) || 0;
    input.value = parseFloat((val + step).toFixed(10));
    input.dispatchEvent(new Event('input'));
  });

  btnDown.addEventListener('click', () => {
    const val = parseFloat(input.value) || 0;
    const next = parseFloat((val - step).toFixed(10));
    input.value = next < 0 ? 0 : next;
    input.dispatchEvent(new Event('input'));
  });
});

// ── Auto-fill today's date & time ──────────────
(function setDefaults() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time  = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const dataInput    = document.getElementById('data');
  const horarioInput = document.getElementById('horario');
  if (!dataInput.value)    dataInput.value    = today;
  if (!horarioInput.value) horarioInput.value = time;
})();
