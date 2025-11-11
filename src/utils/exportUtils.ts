import { Client, Loan } from '../App';

interface LoanCalculation {
  quincenas: number;
  capitalPendiente: number;
  interesAcumulado: number;
  totalPendiente: number;
  pagosTotalesCapital: number;
  pagosTotalesInteres: number;
}

export function exportToCSV(
  clients: Client[],
  calculations: Map<string, Map<string, LoanCalculation>>,
  formatLempiras: (amount: number) => string
) {
  let csv = 'Cliente,ID,Apodo,Tasa (%),Fecha Préstamo,Monto Prestado,Capital Pendiente,Interés Acumulado,Total Pendiente,Quincenas,Pagos Capital,Pagos Interés\n';

  clients.forEach(client => {
    client.loans.forEach(loan => {
      const calc = calculations.get(client.id)?.get(loan.id);
      if (!calc) return;

      const row = [
        `"${client.name}"`,
        `"${client.idNumber}"`,
        `"${client.nickname || '-'}"`,
        client.rate,
        loan.date,
        loan.principal.toFixed(2),
        calc.capitalPendiente.toFixed(2),
        calc.interesAcumulado.toFixed(2),
        calc.totalPendiente.toFixed(2),
        calc.quincenas,
        calc.pagosTotalesCapital.toFixed(2),
        calc.pagosTotalesInteres.toFixed(2)
      ].join(',');

      csv += row + '\n';
    });
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `reporte_prestamos_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportClientToPDF(
  client: Client,
  calculations: Map<string, LoanCalculation>,
  formatLempiras: (amount: number) => string
) {
  const content = generatePDFContent(client, calculations, formatLempiras);

  const printWindow = window.open('', '', 'width=800,height=600');
  if (!printWindow) {
    alert('Por favor permite ventanas emergentes para exportar PDF');
    return;
  }

  printWindow.document.write(content);
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
  }, 250);
}

function generatePDFContent(
  client: Client,
  calculations: Map<string, LoanCalculation>,
  formatLempiras: (amount: number) => string
): string {
  const today = new Date().toLocaleDateString('es-HN');

  let totalPrestado = 0;
  let totalPendiente = 0;
  let totalCapitalPagado = 0;
  let totalInteresPagado = 0;

  client.loans.forEach(loan => {
    const calc = calculations.get(loan.id);
    if (calc) {
      totalPrestado += loan.principal;
      totalPendiente += calc.totalPendiente;
      totalCapitalPagado += calc.pagosTotalesCapital;
      totalInteresPagado += calc.pagosTotalesInteres;
    }
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Reporte - ${client.name}</title>
      <style>
        @media print {
          body { margin: 0; padding: 20px; }
          .no-print { display: none; }
        }
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          line-height: 1.6;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #4F46E5;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #1F2937;
          margin: 0;
          font-size: 28px;
        }
        .header p {
          color: #6B7280;
          margin: 5px 0;
        }
        .client-info {
          background: #F3F4F6;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .client-info h2 {
          margin: 0 0 10px 0;
          color: #1F2937;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
        }
        .info-label {
          font-weight: bold;
          color: #4B5563;
        }
        .summary {
          background: #EEF2FF;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .summary h3 {
          margin: 0 0 15px 0;
          color: #4F46E5;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th {
          background: #4F46E5;
          color: white;
          padding: 12px;
          text-align: left;
          font-size: 14px;
        }
        td {
          padding: 10px;
          border-bottom: 1px solid #E5E7EB;
        }
        tr:hover {
          background: #F9FAFB;
        }
        .amount {
          text-align: right;
          font-weight: 600;
        }
        .total-row {
          background: #FEF3C7;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          color: #6B7280;
          font-size: 12px;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #E5E7EB;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        .status-active {
          background: #FEF3C7;
          color: #92400E;
        }
        .status-paid {
          background: #D1FAE5;
          color: #065F46;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Sistema de Gestión de Préstamos</h1>
        <p>Reporte Detallado de Cliente</p>
        <p><strong>Fecha de emisión:</strong> ${today}</p>
      </div>

      <div class="client-info">
        <h2>${client.name}${client.nickname ? ` (${client.nickname})` : ''}</h2>
        <div class="info-row">
          <span class="info-label">ID:</span>
          <span>${client.idNumber}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Tasa de interés:</span>
          <span>${client.rate}% quincenal</span>
        </div>
        <div class="info-row">
          <span class="info-label">Total de préstamos:</span>
          <span>${client.loans.length}</span>
        </div>
      </div>

      <div class="summary">
        <h3>Resumen Financiero</h3>
        <div class="info-row">
          <span class="info-label">Total prestado:</span>
          <span class="amount">${formatLempiras(totalPrestado)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Total pagado a capital:</span>
          <span class="amount" style="color: #059669">${formatLempiras(totalCapitalPagado)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Total pagado en intereses:</span>
          <span class="amount" style="color: #DC2626">${formatLempiras(totalInteresPagado)}</span>
        </div>
        <div class="info-row" style="margin-top: 10px; padding-top: 10px; border-top: 2px solid #4F46E5;">
          <span class="info-label" style="font-size: 18px;">TOTAL PENDIENTE:</span>
          <span class="amount" style="color: #4F46E5; font-size: 20px;">${formatLempiras(totalPendiente)}</span>
        </div>
      </div>

      <h3 style="color: #1F2937; margin-bottom: 15px;">Detalle de Préstamos</h3>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Monto</th>
            <th>Quincenas</th>
            <th>Cap. Pagado</th>
            <th>Int. Pagado</th>
            <th>Pendiente</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${client.loans.map(loan => {
            const calc = calculations.get(loan.id);
            if (!calc) return '';

            const isPaid = calc.totalPendiente < 1;

            return `
              <tr>
                <td>${loan.date}</td>
                <td class="amount">${formatLempiras(loan.principal)}</td>
                <td>${calc.quincenas}</td>
                <td class="amount" style="color: #059669">${formatLempiras(calc.pagosTotalesCapital)}</td>
                <td class="amount" style="color: #DC2626">${formatLempiras(calc.pagosTotalesInteres)}</td>
                <td class="amount">${formatLempiras(calc.totalPendiente)}</td>
                <td>
                  <span class="status-badge ${isPaid ? 'status-paid' : 'status-active'}">
                    ${isPaid ? 'LIQUIDADO' : 'ACTIVO'}
                  </span>
                </td>
              </tr>
            `;
          }).join('')}
          <tr class="total-row">
            <td colspan="3"><strong>TOTALES</strong></td>
            <td class="amount">${formatLempiras(totalCapitalPagado)}</td>
            <td class="amount">${formatLempiras(totalInteresPagado)}</td>
            <td class="amount">${formatLempiras(totalPendiente)}</td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <div class="footer">
        <p>Este reporte fue generado automáticamente por el Sistema de Gestión de Préstamos</p>
        <p>© ${new Date().getFullYear()} - Todos los derechos reservados</p>
      </div>

      <div class="no-print" style="text-align: center; margin-top: 20px;">
        <button onclick="window.print()" style="background: #4F46E5; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
          Imprimir / Guardar como PDF
        </button>
        <button onclick="window.close()" style="background: #6B7280; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; margin-left: 10px;">
          Cerrar
        </button>
      </div>
    </body>
    </html>
  `;
}

export function exportAllClientsToPDF(
  clients: Client[],
  calculations: Map<string, Map<string, LoanCalculation>>,
  formatLempiras: (amount: number) => string
) {
  let grandTotalPrestado = 0;
  let grandTotalPendiente = 0;
  let grandTotalCapitalPagado = 0;
  let grandTotalInteresPagado = 0;

  clients.forEach(client => {
    client.loans.forEach(loan => {
      const calc = calculations.get(client.id)?.get(loan.id);
      if (calc) {
        grandTotalPrestado += loan.principal;
        grandTotalPendiente += calc.totalPendiente;
        grandTotalCapitalPagado += calc.pagosTotalesCapital;
        grandTotalInteresPagado += calc.pagosTotalesInteres;
      }
    });
  });

  const today = new Date().toLocaleDateString('es-HN');

  const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Reporte General de Clientes</title>
      <style>
        @media print {
          body { margin: 0; padding: 20px; }
          .no-print { display: none; }
        }
        body {
          font-family: Arial, sans-serif;
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
          line-height: 1.6;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #4F46E5;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #1F2937;
          margin: 0;
          font-size: 32px;
        }
        .header p {
          color: #6B7280;
          margin: 5px 0;
        }
        .summary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 25px;
          border-radius: 12px;
          margin-bottom: 40px;
        }
        .summary h2 {
          margin: 0 0 20px 0;
          font-size: 24px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .summary-item {
          background: rgba(255,255,255,0.1);
          padding: 15px;
          border-radius: 8px;
        }
        .summary-label {
          font-size: 14px;
          opacity: 0.9;
          margin-bottom: 5px;
        }
        .summary-value {
          font-size: 24px;
          font-weight: bold;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th {
          background: #4F46E5;
          color: white;
          padding: 12px;
          text-align: left;
          font-size: 13px;
        }
        td {
          padding: 10px;
          border-bottom: 1px solid #E5E7EB;
          font-size: 13px;
        }
        tr:hover {
          background: #F9FAFB;
        }
        .amount {
          text-align: right;
          font-weight: 600;
        }
        .total-row {
          background: #FEF3C7;
          font-weight: bold;
          font-size: 14px;
        }
        .footer {
          text-align: center;
          color: #6B7280;
          font-size: 12px;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #E5E7EB;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Sistema de Gestión de Préstamos</h1>
        <p>Reporte General de Todos los Clientes</p>
        <p><strong>Fecha de emisión:</strong> ${today}</p>
      </div>

      <div class="summary">
        <h2>Resumen Ejecutivo</h2>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-label">Total de Clientes</div>
            <div class="summary-value">${clients.length}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Prestado</div>
            <div class="summary-value">${formatLempiras(grandTotalPrestado)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Pagado (Capital)</div>
            <div class="summary-value">${formatLempiras(grandTotalCapitalPagado)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Pendiente</div>
            <div class="summary-value">${formatLempiras(grandTotalPendiente)}</div>
          </div>
        </div>
      </div>

      <h3 style="color: #1F2937; margin-bottom: 15px;">Resumen por Cliente</h3>
      <table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>ID</th>
            <th>Préstamos</th>
            <th>Total Prestado</th>
            <th>Cap. Pagado</th>
            <th>Int. Pagado</th>
            <th>Total Pendiente</th>
          </tr>
        </thead>
        <tbody>
          ${clients.map(client => {
            let clientTotalPrestado = 0;
            let clientTotalPendiente = 0;
            let clientTotalCapitalPagado = 0;
            let clientTotalInteresPagado = 0;

            client.loans.forEach(loan => {
              const calc = calculations.get(client.id)?.get(loan.id);
              if (calc) {
                clientTotalPrestado += loan.principal;
                clientTotalPendiente += calc.totalPendiente;
                clientTotalCapitalPagado += calc.pagosTotalesCapital;
                clientTotalInteresPagado += calc.pagosTotalesInteres;
              }
            });

            return `
              <tr>
                <td><strong>${client.name}</strong>${client.nickname ? ` (${client.nickname})` : ''}</td>
                <td>${client.idNumber}</td>
                <td>${client.loans.length}</td>
                <td class="amount">${formatLempiras(clientTotalPrestado)}</td>
                <td class="amount" style="color: #059669">${formatLempiras(clientTotalCapitalPagado)}</td>
                <td class="amount" style="color: #DC2626">${formatLempiras(clientTotalInteresPagado)}</td>
                <td class="amount"><strong>${formatLempiras(clientTotalPendiente)}</strong></td>
              </tr>
            `;
          }).join('')}
          <tr class="total-row">
            <td colspan="3"><strong>TOTALES GENERALES</strong></td>
            <td class="amount">${formatLempiras(grandTotalPrestado)}</td>
            <td class="amount">${formatLempiras(grandTotalCapitalPagado)}</td>
            <td class="amount">${formatLempiras(grandTotalInteresPagado)}</td>
            <td class="amount">${formatLempiras(grandTotalPendiente)}</td>
          </tr>
        </tbody>
      </table>

      <div class="footer">
        <p>Este reporte fue generado automáticamente por el Sistema de Gestión de Préstamos</p>
        <p>© ${new Date().getFullYear()} - Todos los derechos reservados</p>
      </div>

      <div class="no-print" style="text-align: center; margin-top: 20px;">
        <button onclick="window.print()" style="background: #4F46E5; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
          Imprimir / Guardar como PDF
        </button>
        <button onclick="window.close()" style="background: #6B7280; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; margin-left: 10px;">
          Cerrar
        </button>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '', 'width=1000,height=700');
  if (!printWindow) {
    alert('Por favor permite ventanas emergentes para exportar PDF');
    return;
  }

  printWindow.document.write(content);
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
  }, 250);
}
