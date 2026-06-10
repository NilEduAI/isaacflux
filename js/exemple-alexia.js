/* Diagrama d'exemple: «Com registrar les notes a l'Alexia», elaborat a partir
   del document "COM REGISTRAR NOTES A L'ALEXIA 2025-2026 (versió maig 2026)". */
(function (global) {
  'use strict';

  global.IsaacFluxExemple = function () {
    return {
      id: 'exemple-alexia',
      name: "Notes a l'Alexia",
      nodes: [
        { id: 'n01', type: 'inici', x: 340, y: 30, w: 280, h: 60, text: "INICI\nFinal d'avaluació", fontSize: 14 },
        { id: 'n02', type: 'proces', x: 340, y: 140, w: 280, h: 90, text: "Entrar a l'Alexia: a «Les meves àrees», situar-se sobre el mòdul i clicar la icona «Quadern»", fontSize: 13 },
        { id: 'n03', type: 'decisio', x: 330, y: 290, w: 300, h: 130, text: 'Existeix ja el quadern de la convocatòria?', fontSize: 13 },
        { id: 'n04', type: 'proces', x: 740, y: 305, w: 300, h: 100, text: 'Crear el quadern: triar «Quadern avaluació activa» (MAI «avaluació acumulativa») i donar-li un nom', fontSize: 13 },
        { id: 'n05', type: 'proces', x: 340, y: 490, w: 280, h: 80, text: 'Seleccionar la convocatòria (1a o 2a) al desplegable superior del quadern', fontSize: 13 },
        { id: 'n06', type: 'decisio', x: 330, y: 630, w: 300, h: 140, text: 'Quina convocatòria estem qualificant?', fontSize: 13 },
        { id: 'n07', type: 'proces', x: 740, y: 645, w: 300, h: 110, text: "Registrar NOMÉS els RA no assolits en 1a convocatòria i dels quals l'alumne n'hagi fet ús. Mai per apujar nota", fontSize: 13 },
        { id: 'n08', type: 'proces', x: 340, y: 840, w: 280, h: 100, text: 'Registrar les notes dels RA segons la taula: PD, EP, NA, 5–10, AJ, NQ, EX (nombres enters, sense decimals)', fontSize: 13 },
        { id: 'n09', type: 'document', x: 20, y: 845, w: 250, h: 90, text: 'Taules de qualificacions del procediment (RA i MP)', fontSize: 12 },
        { id: 'n10', type: 'decisio', x: 330, y: 1000, w: 300, h: 130, text: 'És final de curs?', fontSize: 13 },
        { id: 'n11', type: 'fi', x: 20, y: 1030, w: 260, h: 70, text: "FI\nNotes de l'avaluació registrades", fontSize: 12 },
        { id: 'n12', type: 'proces', x: 340, y: 1190, w: 280, h: 90, text: 'Registrar la nota final del MP a la columna «Nota» del bloc «Notes finals»', fontSize: 13 },
        { id: 'n13', type: 'decisio', x: 330, y: 1340, w: 300, h: 150, text: "Tots els RA tenen nota numèrica (5–10), inclosa l'estada a l'empresa?", fontSize: 12 },
        { id: 'n14', type: 'proces', x: 20, y: 1360, w: 260, h: 110, text: "Icona «Avaluar» → verificar la convocatòria → «Calcular Mitjana»: l'Alexia calcula la mitjana ponderada", fontSize: 12 },
        { id: 'n15', type: 'proces', x: 740, y: 1360, w: 300, h: 110, text: "Introduir la nota manualment: 1–4 si algun RA és NA; PQ si només resta pendent l'estada a l'empresa", fontSize: 13 },
        { id: 'n16', type: 'proces', x: 340, y: 1560, w: 280, h: 100, text: "MAI registrar res a la columna «Recuperació». Des d'«Avaluar»: prémer Enter i clicar «Desar» abans de sortir", fontSize: 13 },
        { id: 'n17', type: 'fi', x: 340, y: 1720, w: 280, h: 70, text: "FI\nQualificacions registrades a l'Alexia", fontSize: 13 },
        { id: 'n18', type: 'nota', x: 1090, y: 30, w: 350, h: 90, text: "Basat en el document «Com registrar les qualificacions a l'Alexia», curs 2025-2026 (versió maig 2026).", fontSize: 12 }
      ],
      edges: [
        { id: 'e01', from: 'n01', to: 'n02', label: '' },
        { id: 'e02', from: 'n02', to: 'n03', label: '' },
        { id: 'e03', from: 'n03', to: 'n04', label: 'No' },
        { id: 'e04', from: 'n03', to: 'n05', label: 'Sí' },
        { id: 'e05', from: 'n04', to: 'n05', label: '' },
        { id: 'e06', from: 'n05', to: 'n06', label: '' },
        { id: 'e07', from: 'n06', to: 'n08', label: '1a' },
        { id: 'e08', from: 'n06', to: 'n07', label: '2a' },
        { id: 'e09', from: 'n07', to: 'n12', label: '' },
        { id: 'e10', from: 'n09', to: 'n08', label: '' },
        { id: 'e11', from: 'n08', to: 'n10', label: '' },
        { id: 'e12', from: 'n10', to: 'n11', label: 'No' },
        { id: 'e13', from: 'n10', to: 'n12', label: 'Sí' },
        { id: 'e14', from: 'n12', to: 'n13', label: '' },
        { id: 'e15', from: 'n13', to: 'n14', label: 'Sí' },
        { id: 'e16', from: 'n13', to: 'n15', label: 'No' },
        { id: 'e17', from: 'n14', to: 'n16', label: '' },
        { id: 'e18', from: 'n15', to: 'n16', label: '' },
        { id: 'e19', from: 'n16', to: 'n17', label: '' }
      ]
    };
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
