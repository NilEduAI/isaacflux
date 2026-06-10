/* Sonda: fitxer petit amb tots els tipus de connector per provar
   com els renderitza cada visualitzador (Excel, Google Sheets...). */
'use strict';
require('../js/zip.js');
require('../js/routing.js');
require('../js/xlsx-export.js');

const fs = require('fs');
const d = {
  name: 'Proves connectors',
  nodes: [
    // A: ruta vh (bentConnector2 girat 90°): de sota d'A1 al costat dret d'A2
    { id: 'a1', type: 'proces', x: 300, y: 20, w: 160, h: 60, text: 'A1 (vh)', fontSize: 13 },
    { id: 'a2', type: 'proces', x: 40, y: 160, w: 160, h: 60, text: 'A2', fontSize: 13 },
    // B: ruta vhv (bentConnector3 girat 90°)
    { id: 'b1', type: 'proces', x: 300, y: 300, w: 160, h: 60, text: 'B1 (vhv)', fontSize: 13 },
    { id: 'b2', type: 'proces', x: 540, y: 440, w: 160, h: 60, text: 'B2', fontSize: 13 },
    // C: recta vertical
    { id: 'c1', type: 'proces', x: 40, y: 300, w: 160, h: 60, text: 'C1 (recta)', fontSize: 13 },
    { id: 'c2', type: 'proces', x: 40, y: 440, w: 160, h: 60, text: 'C2', fontSize: 13 },
    // D: ruta hvh (bentConnector3 sense girar)
    { id: 'd1', type: 'proces', x: 40, y: 580, w: 160, h: 60, text: 'D1 (hvh)', fontSize: 13 },
    { id: 'd2', type: 'proces', x: 340, y: 640, w: 160, h: 60, text: 'D2', fontSize: 13 },
    // E: vh cap a l'esquerra-amunt (gir + flips)
    { id: 'e1', type: 'proces', x: 540, y: 720, w: 160, h: 60, text: 'E1 (vh inv)', fontSize: 13 },
    { id: 'e2', type: 'proces', x: 40, y: 850, w: 160, h: 60, text: 'E2', fontSize: 13 }
  ],
  edges: [
    { id: 'ea', from: 'a1', to: 'a2', label: 'A' },
    { id: 'eb', from: 'b1', to: 'b2', label: 'B' },
    { id: 'ec', from: 'c1', to: 'c2', label: 'C' },
    { id: 'ed', from: 'd1', to: 'd2', label: 'D' },
    { id: 'ee', from: 'e1', to: 'e2', label: 'E' }
  ]
};
const out = process.argv[2] || '/tmp/probe.xlsx';
fs.writeFileSync(out, globalThis.IsaacFluxXlsx.build([d]));
console.log('Escrit', out);
