/* Prova: genera el fitxer .xlsx amb els diagrames d'exemple, fora del navegador.
   Ús: node test/genera-xlsx.cjs [sortida.xlsx] */
'use strict';

require('../js/zip.js');
require('../js/routing.js');
require('../js/xlsx-export.js');
require('../js/exemple-alexia.js');
require('../js/exemple-laboratori.js');

const fs = require('fs');
const out = process.argv[2] || '/tmp/isaacflux-test.xlsx';
const diagrams = [globalThis.IsaacFluxExemple(), globalThis.IsaacFluxLaboratori()];
const bytes = globalThis.IsaacFluxXlsx.build(diagrams);
fs.writeFileSync(out, bytes);
console.log(`Escrit ${out} (${bytes.length} bytes) · ${diagrams.length} fulls`);
