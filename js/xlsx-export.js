/* Exportació dels diagrames a un llibre d'Excel (.xlsx) amb formes natives
   de dibuix (DrawingML), el mateix format que fa servir l'Excel quan
   s'insereixen formes manualment: així el fitxer resultant es pot continuar
   editant des de l'Excel (moure figures, canviar textos, colors...). */
(function (global) {
  'use strict';

  const PX_EMU = 9525;   // EMUs per píxel
  const COLW = 64;       // amplada per defecte d'una columna, en px
  const ROWH = 20;       // alçada per defecte d'una fila, en px

  const PRESET = {
    inici: 'ellipse', fi: 'ellipse', proces: 'rect', decisio: 'diamond',
    document: 'flowChartDocument', connector: 'flowChartConnector', nota: 'rect'
  };
  const DEF_ACCENT = {
    inici: 'accent6', fi: 'accent2', proces: 'accent1', decisio: 'accent1',
    document: 'accent3', connector: 'accent1'
  };
  // Índexs dels punts de connexió de les formes preestablertes (a dalt, esquerra, a baix, dreta)
  const CXN_IDX = { top: 0, left: 1, bottom: 2, right: 3 };

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const emu = px => Math.round(px * PX_EMU);

  // Àncora de dues cel·les amb la caixa VISUAL de la forma (la mateixa
  // convenció que escriu l'Excel; per a formes girades, el rectangle de
  // pre-rotació va dins de l'a:xfrm).
  function anchorXml(x, y, w, h) {
    const corner = (px, py, tag) => {
      const col = Math.max(0, Math.floor(px / COLW));
      const row = Math.max(0, Math.floor(py / ROWH));
      return `<xdr:${tag}><xdr:col>${col}</xdr:col><xdr:colOff>${emu(px - col * COLW)}</xdr:colOff>` +
        `<xdr:row>${row}</xdr:row><xdr:rowOff>${emu(py - row * ROWH)}</xdr:rowOff></xdr:${tag}>`;
    };
    return corner(x, y, 'from') + corner(x + w, y + h, 'to');
  }

  function txBody(text, sz, opts) {
    const o = opts || {};
    const anchor = o.anchor || 'ctr';
    const algn = o.algn || 'ctr';
    const colorXml = o.dark ? '<a:solidFill><a:schemeClr val="dk1"/></a:solidFill>' : '';
    const lines = String(text || '').split('\n');
    const paras = lines.map(line => line
      ? `<a:p><a:pPr algn="${algn}"/><a:r><a:rPr lang="ca-ES" sz="${sz}"${o.bold ? ' b="1"' : ''}>${colorXml}</a:rPr><a:t>${esc(line)}</a:t></a:r></a:p>`
      : `<a:p><a:pPr algn="${algn}"/><a:endParaRPr lang="ca-ES" sz="${sz}"/></a:p>`).join('');
    return `<xdr:txBody><a:bodyPr vertOverflow="clip" horzOverflow="clip" wrap="${o.wrap || 'square'}" rtlCol="0" anchor="${anchor}"/><a:lstStyle/>${paras}</xdr:txBody>`;
  }

  function shapeStyle(accent) {
    return `<xdr:style>` +
      `<a:lnRef idx="2"><a:schemeClr val="${accent}"><a:shade val="50000"/></a:schemeClr></a:lnRef>` +
      `<a:fillRef idx="1"><a:schemeClr val="${accent}"/></a:fillRef>` +
      `<a:effectRef idx="0"><a:schemeClr val="${accent}"/></a:effectRef>` +
      `<a:fontRef idx="minor"><a:schemeClr val="lt1"/></a:fontRef></xdr:style>`;
  }

  const plainStyle =
    `<xdr:style>` +
    `<a:lnRef idx="0"><a:scrgbClr r="0" g="0" b="0"/></a:lnRef>` +
    `<a:fillRef idx="0"><a:scrgbClr r="0" g="0" b="0"/></a:fillRef>` +
    `<a:effectRef idx="0"><a:scrgbClr r="0" g="0" b="0"/></a:effectRef>` +
    `<a:fontRef idx="minor"><a:schemeClr val="dk1"/></a:fontRef></xdr:style>`;

  function nodeSp(id, node) {
    const sz = Math.round((node.fontSize || 13) / 1.15 * 100); // px → aprox. punts*100
    const xfrm = `<a:xfrm><a:off x="${emu(node.x)}" y="${emu(node.y)}"/><a:ext cx="${emu(node.w)}" cy="${emu(node.h)}"/></a:xfrm>`;

    if (node.type === 'nota') {
      return `<xdr:twoCellAnchor>${anchorXml(node.x, node.y, node.w, node.h)}` +
        `<xdr:sp macro="" textlink=""><xdr:nvSpPr><xdr:cNvPr id="${id}" name="Nota ${id}"/><xdr:cNvSpPr txBox="1"/></xdr:nvSpPr>` +
        `<xdr:spPr>${xfrm}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>` +
        `<a:solidFill><a:schemeClr val="lt1"/></a:solidFill>` +
        `<a:ln w="9525" cmpd="sng"><a:solidFill><a:schemeClr val="tx1"><a:alpha val="40000"/></a:schemeClr></a:solidFill></a:ln></xdr:spPr>` +
        plainStyle + txBody(node.text, sz, { anchor: 't', algn: 'l', dark: true }) +
        `</xdr:sp><xdr:clientData/></xdr:twoCellAnchor>`;
    }

    const preset = PRESET[node.type] || 'rect';
    const accent = node.accent || DEF_ACCENT[node.type] || 'accent1';
    const bold = node.type === 'inici' || node.type === 'fi';
    return `<xdr:twoCellAnchor>${anchorXml(node.x, node.y, node.w, node.h)}` +
      `<xdr:sp macro="" textlink=""><xdr:nvSpPr><xdr:cNvPr id="${id}" name="${esc(node.type)} ${id}"/><xdr:cNvSpPr/></xdr:nvSpPr>` +
      `<xdr:spPr>${xfrm}<a:prstGeom prst="${preset}"><a:avLst/></a:prstGeom></xdr:spPr>` +
      shapeStyle(accent) + txBody(node.text, sz, { bold }) +
      `</xdr:sp><xdr:clientData/></xdr:twoCellAnchor>`;
  }

  /* Conversió de la ruta de la fletxa a connectors DrawingML.
     Les fletxes acodades s'exporten com a segments rectes consecutius
     (straightConnector1) en lloc de bentConnector girat 90°: els connectors
     amb rotació es mostren malament al Google Sheets (Drive), mentre que
     els segments rectes amb flips es veuen bé a tot arreu (Excel, Google
     Sheets i LibreOffice). La punta de fletxa va a l'últim segment. */
  function edgeCxns(startId, route, srcId, srcPreset, dstId, dstPreset) {
    const pts = route.pts;
    const segs = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[i + 1];
      if (Math.abs(x2 - x1) < 0.5 && Math.abs(y2 - y1) < 0.5) continue;
      segs.push([x1, y1, x2, y2]);
    }
    if (!segs.length) return { xml: '', count: 0 };

    let xml = '';
    segs.forEach((seg, i) => {
      const [x1, y1, x2, y2] = seg;
      const last = i === segs.length - 1;
      const minx = Math.min(x1, x2), miny = Math.min(y1, y2);
      const adx = Math.abs(x2 - x1), ady = Math.abs(y2 - y1);
      const flipH = x2 < x1, flipV = y2 < y1;
      const attrs = (flipH ? ' flipH="1"' : '') + (flipV ? ' flipV="1"' : '');
      const st = i === 0 && srcId && srcPreset !== 'ellipse' ? `<a:stCxn id="${srcId}" idx="${CXN_IDX[route.s]}"/>` : '';
      const en = last && dstId && dstPreset !== 'ellipse' ? `<a:endCxn id="${dstId}" idx="${CXN_IDX[route.t]}"/>` : '';
      const arrow = last ? '<a:tailEnd type="triangle" w="lg" len="lg"/>' : '';
      xml += `<xdr:twoCellAnchor>${anchorXml(minx, miny, adx, ady)}` +
        `<xdr:cxnSp macro=""><xdr:nvCxnSpPr><xdr:cNvPr id="${startId + i}" name="Connector ${startId + i}"/><xdr:cNvCxnSpPr>${st}${en}</xdr:cNvCxnSpPr></xdr:nvCxnSpPr>` +
        `<xdr:spPr><a:xfrm${attrs}><a:off x="${emu(minx)}" y="${emu(miny)}"/><a:ext cx="${emu(adx)}" cy="${emu(ady)}"/></a:xfrm>` +
        `<a:prstGeom prst="straightConnector1"><a:avLst/></a:prstGeom>` +
        `<a:ln w="19050">${arrow}</a:ln></xdr:spPr>` +
        `<xdr:style><a:lnRef idx="2"><a:schemeClr val="accent1"/></a:lnRef><a:fillRef idx="0"><a:schemeClr val="accent1"/></a:fillRef>` +
        `<a:effectRef idx="1"><a:schemeClr val="accent1"/></a:effectRef><a:fontRef idx="minor"><a:schemeClr val="tx1"/></a:fontRef></xdr:style>` +
        `</xdr:cxnSp><xdr:clientData/></xdr:twoCellAnchor>`;
    });
    return { xml, count: segs.length };
  }

  function labelSp(id, text, pos) {
    const w = text.length * 12 + 24, h = 24;
    const x = pos[0] - 4, y = pos[1] - 14;
    return `<xdr:twoCellAnchor>${anchorXml(x, y, w, h)}` +
      `<xdr:sp macro="" textlink=""><xdr:nvSpPr><xdr:cNvPr id="${id}" name="Etiqueta ${id}"/><xdr:cNvSpPr txBox="1"/></xdr:nvSpPr>` +
      `<xdr:spPr><a:xfrm><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(w)}" cy="${emu(h)}"/></a:xfrm>` +
      `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>` +
      `<a:solidFill><a:schemeClr val="lt1"/></a:solidFill><a:ln w="9525" cmpd="sng"><a:noFill/></a:ln></xdr:spPr>` +
      plainStyle + txBody(text, 1000, { anchor: 't', algn: 'l', dark: true, bold: true, wrap: 'none' }) +
      `</xdr:sp><xdr:clientData/></xdr:twoCellAnchor>`;
  }

  function drawingXml(d) {
    let id = 2;
    const map = {};
    let xml = '';
    for (const node of d.nodes) { map[node.id] = id; xml += nodeSp(id++, node); }
    for (const e of d.edges) {
      const s = d.nodes.find(n => n.id === e.from);
      const t = d.nodes.find(n => n.id === e.to);
      if (!s || !t) continue;
      const route = global.IsaacFluxRouting.routeEdge(s, t);
      const cxns = edgeCxns(id, route, map[s.id], PRESET[s.type], map[t.id], PRESET[t.type]);
      xml += cxns.xml;
      id += cxns.count;
      if (e.label) xml += labelSp(id++, e.label, global.IsaacFluxRouting.labelPos(route.pts));
    }
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
      `<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" ` +
      `xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">${xml}</xdr:wsDr>`;
  }

  /* ---------- Parts fixes del llibre ---------- */

  const SHEET_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="15"/><sheetData/><drawing r:id="rId1"/></worksheet>`;

  const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

  const THEME_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office"><a:themeElements><a:clrScheme name="Office"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="44546A"/></a:dk2><a:lt2><a:srgbClr val="E7E6E6"/></a:lt2><a:accent1><a:srgbClr val="4472C4"/></a:accent1><a:accent2><a:srgbClr val="ED7D31"/></a:accent2><a:accent3><a:srgbClr val="A5A5A5"/></a:accent3><a:accent4><a:srgbClr val="FFC000"/></a:accent4><a:accent5><a:srgbClr val="5B9BD5"/></a:accent5><a:accent6><a:srgbClr val="70AD47"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme><a:fontScheme name="Office"><a:majorFont><a:latin typeface="Calibri Light"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:tint val="65000"/></a:schemeClr></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:shade val="80000"/></a:schemeClr></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln><a:ln w="12700" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln><a:ln w="19050" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>`;

  function contentTypes(n) {
    let overrides = '';
    for (let i = 1; i <= n; i++) {
      overrides += `<Override PartName="/xl/worksheets/sheet${i}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
        `<Override PartName="/xl/drawings/drawing${i}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>`;
    }
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${overrides}<Override PartName="/xl/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`;
  }

  const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`;

  function coreXml() {
    const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:creator>IsaacFlux</dc:creator><cp:lastModifiedBy>IsaacFlux</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`;
  }

  const APP_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>IsaacFlux</Application></Properties>`;

  function workbookXml(names) {
    const sheets = names.map((nm, i) =>
      `<sheet name="${esc(nm)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('');
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets>${sheets}</sheets></workbook>`;
  }

  function workbookRels(n) {
    let rels = '';
    for (let i = 1; i <= n; i++) {
      rels += `<Relationship Id="rId${i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i}.xml"/>`;
    }
    rels += `<Relationship Id="rId${n + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`;
    rels += `<Relationship Id="rId${n + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>`;
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels}</Relationships>`;
  }

  function sheetRels(i) {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing${i}.xml"/></Relationships>`;
  }

  function uniqueSheetNames(rawNames) {
    const used = new Set();
    return rawNames.map((raw, i) => {
      let nm = String(raw || `Diagrama ${i + 1}`).replace(/[\\\/\?\*\[\]:]/g, ' ').trim().slice(0, 28) || `Diagrama ${i + 1}`;
      let candidate = nm, k = 2;
      while (used.has(candidate.toLowerCase())) candidate = `${nm.slice(0, 24)} (${k++})`;
      used.add(candidate.toLowerCase());
      return candidate;
    });
  }

  /** diagrams: [{name, nodes, edges}] → Uint8Array (contingut del .xlsx) */
  function build(diagrams) {
    const list = diagrams && diagrams.length ? diagrams : [{ name: 'Diagrama 1', nodes: [], edges: [] }];
    const names = uniqueSheetNames(list.map(d => d.name));
    const files = [
      { name: '[Content_Types].xml', data: contentTypes(list.length) },
      { name: '_rels/.rels', data: ROOT_RELS },
      { name: 'docProps/core.xml', data: coreXml() },
      { name: 'docProps/app.xml', data: APP_XML },
      { name: 'xl/workbook.xml', data: workbookXml(names) },
      { name: 'xl/_rels/workbook.xml.rels', data: workbookRels(list.length) },
      { name: 'xl/styles.xml', data: STYLES_XML },
      { name: 'xl/theme/theme1.xml', data: THEME_XML }
    ];
    list.forEach((d, i) => {
      const idx = i + 1;
      files.push({ name: `xl/worksheets/sheet${idx}.xml`, data: SHEET_XML });
      files.push({ name: `xl/worksheets/_rels/sheet${idx}.xml.rels`, data: sheetRels(idx) });
      files.push({ name: `xl/drawings/drawing${idx}.xml`, data: drawingXml(d) });
    });
    return global.IsaacFluxZip.build(files);
  }

  global.IsaacFluxXlsx = { build };
})(typeof globalThis !== 'undefined' ? globalThis : window);
