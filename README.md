# IsaacFlux 📊

Editor de **diagrames de flux** per als processos de l'institut, amb
**exportació a Excel (.xlsx)** fent servir formes natives de dibuix: el fitxer
exportat es pot continuar editant des de l'Excel exactament igual que els
diagrames que ja fa servir la coordinació pedagògica (rectangles de procés,
rombes de decisió, el·lipses d'inici/fi, connectors amb fletxa, etiquetes
«Sí»/«No»...).

Inclou dos diagrames d'exemple, ja creats dins de l'app (un full per cadascun):

- **«Notes a l'Alexia»** — com registrar les qualificacions a l'Alexia
  (curs 2025-2026, versió maig 2026).
- **«Laboratori químic»** — instrucció de treball «Com hem de treballar quan
  entrem al laboratori químic» (17 passos de seguretat + les 5 preguntes finals).

El llenç de l'editor s'ajusta automàticament a la mida del diagrama, de manera
que els processos llargs (com el del laboratori) no queden tallats.

## Com s'obre

No cal instal·lar res ni cap servidor: és una pàgina web estàtica sense dependències.

- **Opció A (en línia):** activeu GitHub Pages al repositori
  (*Settings → Pages → Branch: main → / (root)*) i compartiu l'enllaç amb el professorat.
- **Opció B (local):** descarregueu el repositori i obriu `index.html` amb el navegador
  (doble clic).

## Com es fa servir

| Acció | Com |
|---|---|
| Afegir una figura | Botons de la barra d'eines: Inici, Procés, Decisió, Document, Connector, Fi, Nota |
| Moure una figura | Arrossegar-la (s'ajusta a una graella de 10 px) |
| Editar el text | Doble clic sobre la figura (Ctrl+Retorn o clic fora per desar) |
| Connectar dues figures | Seleccionar la figura d'origen i arrossegar un dels punts blaus fins a la figura de destí. La fletxa es traça i s'encamina sola |
| Etiquetar una fletxa («Sí»/«No», «1a»/«2a»...) | Doble clic sobre la fletxa, o el camp «Etiqueta» de la barra d'eines |
| Canviar color / mida de lletra / duplicar / eliminar | Seleccionar la figura i fer servir els controls de la barra d'eines (o la tecla Supr) |
| Redimensionar | Arrossegar el quadradet de la cantonada inferior dreta de la figura seleccionada |
| Diversos diagrames | Pestanyes a la part superior: «＋ Nou diagrama», doble clic per canviar el nom, «×» per eliminar |

## Exportació

- **⬇ Exporta a Excel (.xlsx):** genera un llibre amb **un full per cada diagrama**
  (com el llibre de diagrames de la coordinació). Les figures són formes natives
  d'Excel: es poden moure, canviar el text, els colors... Les fletxes queden
  *connectades* a les figures, de manera que si es mou una figura dins l'Excel,
  la fletxa la segueix.
- **Desa JSON / Obre JSON:** per guardar còpies de seguretat o compartir els
  diagrames amb una altra persona perquè els continuï editant amb l'app.

El treball en curs es desa automàticament al navegador (localStorage), així
no es perd res en tancar la pestanya.

## Estructura del codi

```
index.html            Pàgina principal
css/styles.css        Estils
js/app.js             Editor (llenç SVG, interacció, pestanyes, desament)
js/routing.js         Encaminament automàtic de les fletxes (compartit editor/exportació)
js/xlsx-export.js     Generació del .xlsx amb formes DrawingML natives
js/zip.js             Escriptor ZIP mínim (un .xlsx és un ZIP) sense dependències
js/exemple-alexia.js  Diagrama d'exemple «Notes a l'Alexia»
js/exemple-laboratori.js Diagrama d'exemple «Laboratori químic»
test/genera-xlsx.cjs  Prova: genera el .xlsx des de Node (node test/genera-xlsx.cjs)
```

## Verificació

Per generar el fitxer d'exemple fora del navegador:

```bash
node test/genera-xlsx.cjs sortida.xlsx
```

El fitxer resultant s'ha validat amb `openpyxl` i renderitzat amb LibreOffice
per comprovar que les formes, els connectors acodats i les etiquetes
apareixen correctament.
