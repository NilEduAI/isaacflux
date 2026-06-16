/* IsaacFlux — editor de diagrames de flux per als processos de l'institut. */
(function () {
  'use strict';

  const LS_KEY = 'isaacflux-v1';
  const MIN_W = 1200, MIN_H = 1400, MARGIN = 120;
  const ACCENTS = {
    accent1: '#4472C4', accent2: '#ED7D31', accent3: '#A5A5A5',
    accent4: '#FFC000', accent5: '#5B9BD5', accent6: '#70AD47'
  };
  const ACCENT_NAMES = {
    accent1: 'Blau', accent2: 'Taronja', accent3: 'Gris',
    accent4: 'Groc', accent5: 'Blau clar', accent6: 'Verd'
  };
  const DEF_ACCENT = {
    inici: 'accent6', fi: 'accent2', proces: 'accent1', decisio: 'accent1',
    document: 'accent3', connector: 'accent1'
  };
  const NEW_NODE = {
    inici: { w: 240, h: 60, text: 'INICI' },
    fi: { w: 240, h: 60, text: 'FI' },
    proces: { w: 260, h: 90, text: 'Procés…' },
    decisio: { w: 280, h: 130, text: 'Decisió?' },
    document: { w: 240, h: 90, text: 'Document' },
    connector: { w: 60, h: 60, text: 'A' },
    nota: { w: 220, h: 80, text: 'Nota…' }
  };

  const $ = s => document.querySelector(s);
  const uid = () => 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const escapeHtml = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const escapeAttr = s => escapeHtml(s).replace(/"/g, '&quot;');

  let state = load();
  let zoom = 1;
  let sel = null;     // {kind:'node'|'edge', id}
  let drag = null;    // {mode:'move'|'resize'|'connect', ...}
  let editing = null; // {id, ta}

  function load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const st = JSON.parse(raw);
        if (st && Array.isArray(st.diagrams) && st.diagrams.length) return st;
      }
    } catch (e) { /* dades corruptes: es torna als exemples */ }
    return { diagrams: [globalThis.IsaacFluxExemple(), globalThis.IsaacFluxLaboratori()], active: 0 };
  }
  function save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { /* sense espai */ }
  }
  const diagram = () => state.diagrams[state.active];
  const nodeById = id => diagram().nodes.find(n => n.id === id);

  /* ---------- dibuix ---------- */

  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.round(((n >> 16) & 255) * f), g = Math.round(((n >> 8) & 255) * f), b = Math.round((n & 255) * f);
    return `rgb(${r},${g},${b})`;
  }
  const fillOf = n => n.type === 'nota' ? '#ffffff' : ACCENTS[n.accent || DEF_ACCENT[n.type] || 'accent1'];

  function shapeSvg(n) {
    const { x, y, w, h } = n;
    const fill = fillOf(n);
    const stroke = n.type === 'nota' ? '#9aa3ad' : shade(fill, 0.55);
    const common = `fill="${fill}" stroke="${stroke}" stroke-width="${n.type === 'nota' ? 1 : 1.6}"`;
    switch (n.type) {
      case 'inici': case 'fi':
        return `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}" ${common}/>`;
      case 'decisio':
        return `<polygon points="${x + w / 2},${y} ${x + w},${y + h / 2} ${x + w / 2},${y + h} ${x},${y + h / 2}" ${common}/>`;
      case 'document':
        return `<path d="M ${x} ${y} H ${x + w} V ${y + h * 0.82} Q ${x + w * 0.72} ${y + h * 1.12} ${x + w * 0.46} ${y + h * 0.82} Q ${x + w * 0.22} ${y + h * 0.6} ${x} ${y + h * 0.92} Z" ${common}/>`;
      case 'connector':
        return `<circle cx="${x + w / 2}" cy="${y + h / 2}" r="${Math.min(w, h) / 2}" ${common}/>`;
      default:
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" ${common}/>`;
    }
  }

  function textSvg(n) {
    const pad = n.type === 'decisio' ? Math.min(n.w, n.h) * 0.16 : 8;
    const color = n.type === 'nota' ? '#1f2937' : '#ffffff';
    const bold = n.type === 'inici' || n.type === 'fi' ? ';font-weight:600' : '';
    const align = n.type === 'nota' ? ';align-items:flex-start;text-align:left' : '';
    const th = n.type === 'document' ? n.h * 0.72 : n.h - 2 * pad;
    const html = escapeHtml(n.text || '').replace(/\n/g, '<br>');
    return `<foreignObject x="${n.x + pad}" y="${n.y + (n.type === 'document' ? 6 : pad)}" width="${Math.max(10, n.w - 2 * pad)}" height="${Math.max(10, th)}" style="pointer-events:none">` +
      `<div xmlns="http://www.w3.org/1999/xhtml" class="ntext" style="color:${color};font-size:${n.fontSize || 13}px${bold}${align}">${html}</div></foreignObject>`;
  }

  const portPts = n => [
    ['top', n.x + n.w / 2, n.y], ['right', n.x + n.w, n.y + n.h / 2],
    ['bottom', n.x + n.w / 2, n.y + n.h], ['left', n.x, n.y + n.h / 2]
  ];
  const edgePath = pts => 'M ' + pts.map(p => p.join(' ')).join(' L ');

  // El llenç creix amb el contingut: així els diagrames llargs (molts passos)
  // no queden tallats. Mai per sota d'una mida mínima còmoda.
  function canvasSize() {
    let w = MIN_W, h = MIN_H;
    for (const n of diagram().nodes) {
      w = Math.max(w, n.x + n.w + MARGIN);
      h = Math.max(h, n.y + n.h + MARGIN);
    }
    return { w, h };
  }

  function render() {
    if (editing) { editing = null; } // l'editor desapareix amb el redibuixat
    renderTabs();
    renderProps();
    const d = diagram();
    const { w: CANVAS_W, h: CANVAS_H } = canvasSize();
    const inner = $('#canvasInner');
    inner.style.width = (CANVAS_W * zoom) + 'px';
    inner.style.height = (CANVAS_H * zoom) + 'px';

    let edgesSvg = '', labelsSvg = '';
    for (const e of d.edges) {
      const s = nodeById(e.from), t = nodeById(e.to);
      if (!s || !t) continue;
      const r = IsaacFluxRouting.routeEdge(s, t);
      const cls = sel && sel.kind === 'edge' && sel.id === e.id ? ' sel' : '';
      edgesSvg += `<g class="edge${cls}" data-edge="${e.id}"><path class="hit" d="${edgePath(r.pts)}"/><path class="line" d="${edgePath(r.pts)}" marker-end="url(#arrow)"/></g>`;
      if (e.label) {
        const [lx, ly] = IsaacFluxRouting.labelPos(r.pts);
        labelsSvg += `<g class="elabel" data-edge="${e.id}"><rect x="${lx - 4}" y="${ly - 12}" width="${e.label.length * 8 + 12}" height="18" rx="3"/><text x="${lx + 2}" y="${ly + 2}">${escapeHtml(e.label)}</text></g>`;
      }
    }

    let nodesSvg = '';
    for (const n of d.nodes) {
      const isSel = sel && sel.kind === 'node' && sel.id === n.id;
      nodesSvg += `<g class="node${isSel ? ' sel' : ''}" data-node="${n.id}">${shapeSvg(n)}${textSvg(n)}`;
      if (isSel) {
        for (const [side, px, py] of portPts(n)) {
          nodesSvg += `<circle class="port" data-side="${side}" cx="${px}" cy="${py}" r="6"/>`;
        }
        nodesSvg += `<rect class="handle" x="${n.x + n.w - 7}" y="${n.y + n.h - 7}" width="14" height="14" rx="2"/>`;
      }
      nodesSvg += '</g>';
    }

    inner.innerHTML = `<svg id="svg" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}" width="${CANVAS_W * zoom}" height="${CANVAS_H * zoom}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#2f5597"/></marker>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="#eef1f5" stroke-width="1"/></pattern>
      </defs>
      <rect width="${CANVAS_W}" height="${CANVAS_H}" fill="url(#grid)"/>
      <g id="edges">${edgesSvg}${labelsSvg}</g>
      <g id="nodes">${nodesSvg}</g>
      <path id="tempEdge" d=""/>
    </svg>`;
  }

  function renderTabs() {
    const el = $('#tabs');
    el.innerHTML = state.diagrams.map((d, i) =>
      `<span class="tab${i === state.active ? ' on' : ''}" data-tab="${i}">${escapeHtml(d.name)}` +
      (i === state.active && state.diagrams.length > 1 ? ` <b class="tabdel" data-del="${i}" title="Elimina el diagrama">×</b>` : '') +
      `</span>`).join('') +
      `<button id="tabAdd" title="Nou diagrama">＋ Nou diagrama</button>`;
  }

  function renderProps() {
    const el = $('#props');
    if (!sel) {
      el.innerHTML = '<span class="muted">Selecciona una figura o una fletxa per editar-la.</span>';
      return;
    }
    if (sel.kind === 'node') {
      const n = nodeById(sel.id);
      if (!n) { el.innerHTML = ''; return; }
      let html = '';
      if (n.type !== 'nota') {
        const opts = Object.keys(ACCENTS).map(k =>
          `<option value="${k}"${(n.accent || DEF_ACCENT[n.type]) === k ? ' selected' : ''}>${ACCENT_NAMES[k]}</option>`).join('');
        html += `<label>Color <select id="pColor">${opts}</select></label> `;
      }
      html += `<label>Lletra <input id="pFont" type="number" min="8" max="28" value="${n.fontSize || 13}"></label> ` +
        `<button id="pDup">⧉ Duplica</button> <button id="pDel">🗑 Elimina</button>`;
      el.innerHTML = html;
      const pc = $('#pColor');
      if (pc) pc.onchange = e => { n.accent = e.target.value; save(); render(); };
      $('#pFont').onchange = e => { n.fontSize = Math.max(8, +e.target.value || 13); save(); render(); };
      $('#pDup').onclick = () => {
        const c = Object.assign({}, n, { id: uid(), x: n.x + 30, y: n.y + 30 });
        diagram().nodes.push(c);
        sel = { kind: 'node', id: c.id };
        save(); render();
      };
      $('#pDel').onclick = deleteSel;
    } else {
      const ed = diagram().edges.find(x => x.id === sel.id);
      if (!ed) { el.innerHTML = ''; return; }
      el.innerHTML = `<label>Etiqueta <input id="pLabel" value="${escapeAttr(ed.label || '')}" placeholder="Sí / No"></label> ` +
        `<button id="pDel">🗑 Elimina</button>`;
      $('#pLabel').onchange = e => { ed.label = e.target.value.trim(); save(); render(); };
      $('#pDel').onclick = deleteSel;
    }
  }

  function deleteSel() {
    if (!sel) return;
    const d = diagram();
    if (sel.kind === 'node') {
      d.nodes = d.nodes.filter(n => n.id !== sel.id);
      d.edges = d.edges.filter(e => e.from !== sel.id && e.to !== sel.id);
    } else {
      d.edges = d.edges.filter(e => e.id !== sel.id);
    }
    sel = null;
    save(); render();
  }

  /* ---------- edició de text ---------- */

  function openEditor(n) {
    commitEdit();
    const ta = document.createElement('textarea');
    ta.id = 'editor';
    ta.value = n.text || '';
    Object.assign(ta.style, {
      left: (n.x * zoom) + 'px', top: (n.y * zoom) + 'px',
      width: (n.w * zoom) + 'px', height: (n.h * zoom) + 'px',
      fontSize: ((n.fontSize || 13) * zoom) + 'px'
    });
    $('#canvasInner').appendChild(ta);
    editing = { id: n.id, ta };
    ta.focus();
    ta.select();
    ta.addEventListener('blur', commitEdit);
    ta.addEventListener('keydown', ev => {
      if (ev.key === 'Escape') { editing = null; ta.remove(); render(); }
      else if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) commitEdit();
    });
  }

  function commitEdit() {
    if (!editing) return;
    const { id, ta } = editing;
    editing = null;
    const n = nodeById(id);
    if (n) n.text = ta.value;
    ta.remove();
    save(); render();
  }

  /* ---------- interacció amb el llenç ---------- */

  function svgPoint(evt) {
    const svg = $('#svg');
    const p = new DOMPoint(evt.clientX, evt.clientY).matrixTransform(svg.getScreenCTM().inverse());
    return [p.x, p.y];
  }
  const snap = v => Math.round(v / 10) * 10;

  $('#canvasInner').addEventListener('mousedown', e => {
    if (editing) { commitEdit(); return; }
    const port = e.target.closest('.port');
    const handle = e.target.closest('.handle');
    const nodeG = e.target.closest('[data-node]');
    const edgeG = e.target.closest('[data-edge]');
    const [mx, my] = svgPoint(e);
    if (port && nodeG) {
      drag = { mode: 'connect', from: nodeG.dataset.node };
      e.preventDefault();
      return;
    }
    if (handle && nodeG) {
      const n = nodeById(nodeG.dataset.node);
      drag = { mode: 'resize', id: n.id, ox: n.w - (mx - n.x), oy: n.h - (my - n.y) };
      e.preventDefault();
      return;
    }
    if (nodeG) {
      const n = nodeById(nodeG.dataset.node);
      sel = { kind: 'node', id: n.id };
      drag = { mode: 'move', id: n.id, dx: mx - n.x, dy: my - n.y };
      render();
      e.preventDefault();
      return;
    }
    if (edgeG) {
      sel = { kind: 'edge', id: edgeG.dataset.edge };
      render();
      return;
    }
    sel = null;
    render();
  });

  window.addEventListener('mousemove', e => {
    if (!drag || !$('#svg')) return;
    const [mx, my] = svgPoint(e);
    if (drag.mode === 'move') {
      const n = nodeById(drag.id);
      if (!n) return;
      n.x = Math.max(0, snap(mx - drag.dx));
      n.y = Math.max(0, snap(my - drag.dy));
      render();
    } else if (drag.mode === 'resize') {
      const n = nodeById(drag.id);
      if (!n) return;
      n.w = Math.max(50, snap(mx - n.x + drag.ox));
      n.h = Math.max(36, snap(my - n.y + drag.oy));
      render();
    } else if (drag.mode === 'connect') {
      const n = nodeById(drag.from);
      const t = $('#tempEdge');
      if (n && t) t.setAttribute('d', `M ${n.x + n.w / 2} ${n.y + n.h / 2} L ${mx} ${my}`);
    }
  });

  window.addEventListener('mouseup', e => {
    if (!drag) return;
    if (drag.mode === 'connect') {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const g = el && el.closest && el.closest('[data-node]');
      if (g && g.dataset.node !== drag.from) {
        const edge = { id: uid(), from: drag.from, to: g.dataset.node, label: '' };
        diagram().edges.push(edge);
        sel = { kind: 'edge', id: edge.id };
      }
    }
    drag = null;
    save(); render();
  });

  $('#canvasInner').addEventListener('dblclick', e => {
    const nodeG = e.target.closest('[data-node]');
    if (nodeG) {
      const n = nodeById(nodeG.dataset.node);
      if (n) openEditor(n);
      return;
    }
    const edgeG = e.target.closest('[data-edge]');
    if (edgeG) {
      const ed = diagram().edges.find(x => x.id === edgeG.dataset.edge);
      if (!ed) return;
      const v = prompt('Etiqueta de la fletxa (p. ex. «Sí» o «No»):', ed.label || '');
      if (v !== null) { ed.label = v.trim(); save(); render(); }
    }
  });

  window.addEventListener('keydown', e => {
    if (editing) return;
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && sel) {
      deleteSel();
      e.preventDefault();
    }
  });

  /* ---------- barra d'eines ---------- */

  document.querySelectorAll('[data-add]').forEach(b => b.addEventListener('click', () => {
    const type = b.dataset.add;
    const def = NEW_NODE[type];
    const wrap = $('#canvasWrap');
    const n = {
      id: uid(), type,
      x: snap(wrap.scrollLeft / zoom + 80 + Math.random() * 40),
      y: snap(wrap.scrollTop / zoom + 80 + Math.random() * 40),
      w: def.w, h: def.h, text: def.text, fontSize: 13
    };
    diagram().nodes.push(n);
    sel = { kind: 'node', id: n.id };
    save(); render();
  }));

  $('#tabs').addEventListener('click', e => {
    if (e.target.id === 'tabAdd') {
      const name = prompt('Nom del nou diagrama:', 'Nou procés');
      if (!name) return;
      state.diagrams.push({ id: uid(), name: name.trim(), nodes: [], edges: [] });
      state.active = state.diagrams.length - 1;
      sel = null;
      save(); render();
      return;
    }
    const del = e.target.closest('.tabdel');
    if (del) {
      const i = +del.dataset.del;
      if (confirm(`Vols eliminar el diagrama «${state.diagrams[i].name}»?`)) {
        state.diagrams.splice(i, 1);
        state.active = Math.max(0, state.active - (i <= state.active ? 1 : 0));
        sel = null;
        save(); render();
      }
      return;
    }
    const t = e.target.closest('[data-tab]');
    if (t && +t.dataset.tab !== state.active) {
      state.active = +t.dataset.tab;
      sel = null;
      save(); render();
    }
  });

  $('#tabs').addEventListener('dblclick', e => {
    const t = e.target.closest('[data-tab]');
    if (!t) return;
    const d = state.diagrams[+t.dataset.tab];
    const name = prompt('Nom del diagrama:', d.name);
    if (name) { d.name = name.trim(); save(); render(); }
  });

  function downloadBlob(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  $('#btnXlsx').addEventListener('click', () => {
    commitEdit();
    const bytes = IsaacFluxXlsx.build(state.diagrams);
    downloadBlob(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      'diagrames-flux.xlsx');
  });

  $('#btnJsonExport').addEventListener('click', () => {
    downloadBlob(new Blob([JSON.stringify(state, null, 1)], { type: 'application/json' }), 'diagrames-flux.json');
  });

  $('#btnJsonImport').addEventListener('click', () => $('#fileJson').click());
  $('#fileJson').addEventListener('change', e => {
    const f = e.target.files[0];
    if (!f) return;
    f.text().then(t => {
      try {
        const st = JSON.parse(t);
        if (!st || !Array.isArray(st.diagrams)) throw new Error('format');
        state = st;
        state.active = Math.min(st.active || 0, st.diagrams.length - 1);
        sel = null;
        save(); render();
      } catch (err) {
        alert("No s'ha pogut llegir el fitxer JSON.");
      }
    });
    e.target.value = '';
  });

  function addExample(factory, label) {
    if (!confirm(`Vols afegir de nou el diagrama d'exemple «${label}»?`)) return;
    const ex = factory();
    ex.id = uid();
    state.diagrams.push(ex);
    state.active = state.diagrams.length - 1;
    sel = null;
    save(); render();
  }

  $('#btnExample').addEventListener('click', () => addExample(globalThis.IsaacFluxExemple, "Notes a l'Alexia"));
  $('#btnExampleLab').addEventListener('click', () => addExample(globalThis.IsaacFluxLaboratori, 'Laboratori químic'));

  $('#zoom').addEventListener('change', e => { zoom = (+e.target.value) / 100; render(); });

  render();
})();
