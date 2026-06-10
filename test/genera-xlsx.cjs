/* Prova: genera el fitxer .xlsx amb el diagrama d'exemple, fora del navegador.
   Ús: node test/genera-xlsx.cjs [sortida.xlsx] */
'use strict';

require('../js/zip.js');
require('../js/routing.js');
require('../js/xlsx-export.js');
require('../js/exemple-alexia.js');

const fs = require('fs');
const out = process.argv[2] || '/tmp/isaacflux-test.xlsx';
const bytes = globalThis.IsaacFluxXlsx.build([globalThis.IsaacFluxExemple()]);
fs.writeFileSync(out, bytes);
console.log(`Escrit ${out} (${bytes.length} bytes)`);
