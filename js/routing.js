/* Encaminament automàtic de les fletxes entre figures.
   El mateix algorisme s'usa al llenç (SVG) i a l'exportació a Excel,
   perquè el resultat sigui idèntic als dos llocs. */
(function (global) {
  'use strict';

  function sideMid(r, side) {
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    switch (side) {
      case 'top': return [cx, r.y];
      case 'bottom': return [cx, r.y + r.h];
      case 'left': return [r.x, cy];
      default: return [r.x + r.w, cy];
    }
  }

  /**
   * Calcula la ruta d'una fletxa entre dos rectangles {x,y,w,h}.
   * Retorna {kind, pts, s, t}:
   *  - kind: 'straight' | 'vh' | 'vhv' | 'hvh' (v=vertical, h=horitzontal)
   *  - pts:  polilínia [[x,y],...] del recorregut
   *  - s/t:  costat de sortida i d'arribada ('top'|'bottom'|'left'|'right')
   */
  function routeEdge(s, t) {
    const scx = s.x + s.w / 2;
    const tcx = t.x + t.w / 2;

    if (t.y >= s.y + s.h - 2) { // el destí és a sota
      const p1 = sideMid(s, 'bottom');
      if (Math.abs(tcx - scx) < 6) {
        return { kind: 'straight', pts: [p1, sideMid(t, 'top')], s: 'bottom', t: 'top' };
      }
      if (scx > t.x + 12 && scx < t.x + t.w - 12) {
        const my = (s.y + s.h + t.y) / 2;
        return { kind: 'vhv', pts: [p1, [scx, my], [tcx, my], sideMid(t, 'top')], s: 'bottom', t: 'top' };
      }
      const side = scx < tcx ? 'left' : 'right';
      const p2 = sideMid(t, side);
      return { kind: 'vh', pts: [p1, [p1[0], p2[1]], p2], s: 'bottom', t: side };
    }

    if (t.y + t.h <= s.y + 2) { // el destí és a sobre
      const p1 = sideMid(s, 'top');
      if (Math.abs(tcx - scx) < 6) {
        return { kind: 'straight', pts: [p1, sideMid(t, 'bottom')], s: 'top', t: 'bottom' };
      }
      if (scx > t.x + 12 && scx < t.x + t.w - 12) {
        const my = (s.y + t.y + t.h) / 2;
        return { kind: 'vhv', pts: [p1, [scx, my], [tcx, my], sideMid(t, 'bottom')], s: 'top', t: 'bottom' };
      }
      const side = scx < tcx ? 'left' : 'right';
      const p2 = sideMid(t, side);
      return { kind: 'vh', pts: [p1, [p1[0], p2[1]], p2], s: 'top', t: side };
    }

    // mateix nivell: sortida lateral
    const sSide = tcx >= scx ? 'right' : 'left';
    const tSide = tcx >= scx ? 'left' : 'right';
    const p1 = sideMid(s, sSide);
    const p2 = sideMid(t, tSide);
    if (Math.abs(p2[1] - p1[1]) < 6) {
      return { kind: 'straight', pts: [p1, [p2[0], p1[1]]], s: sSide, t: tSide };
    }
    const mx = (p1[0] + p2[0]) / 2;
    return { kind: 'hvh', pts: [p1, [mx, p1[1]], [mx, p2[1]], p2], s: sSide, t: tSide };
  }

  /** Posició de l'etiqueta («Sí»/«No») vora el primer tram de la fletxa. */
  function labelPos(pts) {
    const a = pts[0], b = pts[1];
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    if (Math.abs(a[0] - b[0]) < 1) return [mx + 8, my - 9]; // tram vertical: a la dreta
    return [mx - 14, my - 22];                              // tram horitzontal: a sobre
  }

  global.IsaacFluxRouting = { routeEdge, labelPos, sideMid };
})(typeof globalThis !== 'undefined' ? globalThis : window);
