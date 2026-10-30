import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { formatearFecha, formatearMetros } from './formato';

const AZUL = [30, 58, 138];
const GRIS = [100, 116, 139];

const porcentaje = (parte, total) => (total > 0 ? `${((parte / total) * 100).toFixed(1)} %` : '—');

/**
 * Genera el PDF con exactamente los datos que muestra el dashboard
 * (mismo rango, KPIs, top de telas, colores y detalle).
 */
export function descargarReportePdf(reporte, { topTelas, porColor }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margen = 40;
  const ancho = doc.internal.pageSize.getWidth();
  let y = margen;

  doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...GRIS);
  doc.text('CAMISERÍA EUROPEA · INVENTARIO QR', margen, y);
  y += 22;
  doc.setFontSize(18).setTextColor(...AZUL);
  doc.text('Reporte de consumo de tela', margen, y);
  y += 18;
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...GRIS);
  doc.text(
    `${reporte.etiqueta}: ${formatearFecha(reporte.desde)} – ${formatearFecha(reporte.hasta)}   ·   Generado: ${formatearFecha(new Date())}`,
    margen, y
  );
  y += 16;

  const { tela_estrella: estrella, tela_estancada: estancada } = reporte.kpis;
  autoTable(doc, {
    startY: y,
    margin: { left: margen, right: margen },
    theme: 'grid',
    head: [['Indicador', 'Valor', 'Detalle']],
    body: [
      ['Metros cortados', formatearMetros(reporte.totales.metros_cortados), `${reporte.totales.cortes} cortes`],
      ['Tela estrella', estrella?.tipo_tela ?? 'Sin cortes', estrella ? `${formatearMetros(estrella.metros_cortados)} cortados` : '—'],
      ['Tela estancada', estancada?.tipo_tela ?? 'Ninguna', estancada
        ? `${formatearMetros(estancada.metros_cortados)} cortados · ${formatearMetros(estancada.stock_actual)} en bodega`
        : '—'],
    ],
    headStyles: { fillColor: AZUL },
    styles: { fontSize: 10 },
  });

  const seccion = (titulo, head, body) => {
    y = doc.lastAutoTable.finalY + 26;
    doc.setFont('helvetica', 'bold').setFontSize(12).setTextColor(...AZUL);
    doc.text(titulo, margen, y);
    autoTable(doc, {
      startY: y + 8,
      margin: { left: margen, right: margen },
      theme: 'striped',
      head: [head],
      body: body.length ? body : [[{ content: 'Sin datos en el periodo.', colSpan: head.length }]],
      headStyles: { fillColor: AZUL },
      styles: { fontSize: 9 },
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
    });
  };

  const total = reporte.totales.metros_cortados;

  seccion(
    'Top 5 de telas por metros cortados',
    ['#', 'Tela', 'Metros cortados', 'Participación', 'Cortes'],
    topTelas.map((t, i) => [i + 1, t.tipo_tela, formatearMetros(t.metros_cortados), porcentaje(t.metros_cortados, total), t.cortes])
  );

  seccion(
    'Consumo por color',
    ['#', 'Color', 'Metros cortados', 'Participación', 'Cortes'],
    porColor.map((c, i) => [i + 1, c.color, formatearMetros(c.metros_cortados), porcentaje(c.metros_cortados, total), c.cortes])
  );

  seccion(
    'Detalle por tela y color',
    ['Tela', 'Color', 'Metros cortados', 'Cortes', 'Stock actual'],
    reporte.detalle.map((d) => [d.tipo_tela, d.color, formatearMetros(d.metros_cortados), d.cortes, formatearMetros(d.stock_actual)])
  );

  const paginas = doc.getNumberOfPages();
  for (let i = 1; i <= paginas; i += 1) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...GRIS);
    doc.text(`Página ${i} de ${paginas}`, ancho - margen, doc.internal.pageSize.getHeight() - 20, { align: 'right' });
  }

  const fecha = new Date().toISOString().slice(0, 10);
  doc.save(`reporte-consumo-${reporte.rango}-${fecha}.pdf`);
}
