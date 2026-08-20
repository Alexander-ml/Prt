import type { LedgerEntry, FinancialSummary } from '../types';

function exportToCSV(headers: string[], rows: (string | number)[][], filename: string) {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      const str = String(cell);
      return str.includes(',') ? `"${str}"` : str;
    }).join(','))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportLedgerToCSV(entries: LedgerEntry[], periodLabel: string) {
  const headers = ['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Referencia', 'Monto'];
  const rows = entries.map(e => [
    e.date,
    e.type === 'ingreso' ? 'Ingreso' : 'Egreso',
    e.categoryName,
    e.description,
    e.reference,
    e.amount.toFixed(2),
  ]);
  rows.push(['', '', '', '', 'TOTAL:', entries.reduce((s, e) => s + (e.type === 'ingreso' ? e.amount : -e.amount), 0).toFixed(2)]);
  exportToCSV(headers, rows, `Libro_Diario_${periodLabel.replace(/\s/g, '_')}`);
}

export function exportIncomeStatementCSV(summary: FinancialSummary, periodLabel: string, breakdown: { category: string; amount: number; type: string }[]) {
  const headers = ['Concepto', 'Monto (S/)'];
  const rows: (string | number)[][] = [
    ['=== ESTADO DE RESULTADOS ===', ''],
    ['Período', periodLabel],
    ['', ''],
    ['INGRESOS', ''],
    ...breakdown.filter(b => b.type === 'ingreso').map(b => [b.category, b.amount.toFixed(2)]),
    ['Total Ingresos', summary.totalRevenue.toFixed(2)],
    ['', ''],
    ['EGRESOS', ''],
    ...breakdown.filter(b => b.type === 'egreso').map(b => [b.category, b.amount.toFixed(2)]),
    ['Total Egresos', summary.totalExpenses.toFixed(2)],
    ['', ''],
    ['UTILIDAD NETA', summary.netProfit.toFixed(2)],
    ['IGV Recaudado', summary.taxCollected.toFixed(2)],
  ];
  exportToCSV(headers, rows, `Estado_Resultados_${periodLabel.replace(/\s/g, '_')}`);
}

export function exportCashFlowCSV(
  inflows: { source: string; amount: number }[],
  outflows: { source: string; amount: number }[],
  periodLabel: string
) {
  const headers = ['Concepto', 'Monto (S/)'];
  const totalIn = inflows.reduce((s, i) => s + i.amount, 0);
  const totalOut = outflows.reduce((s, o) => s + o.amount, 0);
  const rows: (string | number)[][] = [
    ['=== FLUJO DE EFECTIVO ===', ''],
    ['Período', periodLabel],
    ['', ''],
    ['ENTRADAS DE EFECTIVO', ''],
    ...inflows.map(i => [i.source, i.amount.toFixed(2)]),
    ['Total Entradas', totalIn.toFixed(2)],
    ['', ''],
    ['SALIDAS DE EFECTIVO', ''],
    ...outflows.map(o => [o.source, o.amount.toFixed(2)]),
    ['Total Salidas', totalOut.toFixed(2)],
    ['', ''],
    ['FLUJO NETO', (totalIn - totalOut).toFixed(2)],
  ];
  exportToCSV(headers, rows, `Flujo_Efectivo_${periodLabel.replace(/\s/g, '_')}`);
}
