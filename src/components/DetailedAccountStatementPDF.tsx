import React from 'react';
import { FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Client, Loan } from '../App';

interface DetailedAccountStatementPDFProps {
  client: Client;
  formatLempiras: (amount: number) => string;
}

interface QuincenaDetail {
  numero: number;
  fechaInicio: Date;
  fechaFin: Date;
  interesDevengado: number;
  pagoCapital: number;
  pagoInteres: number;
  saldoCapital: number;
  saldoInteres: number;
  estado: 'Pagado' | 'Pendiente' | 'Vencido';
}

export default function DetailedAccountStatementPDF({ client, formatLempiras }: DetailedAccountStatementPDFProps) {

  const calcularQuincenas = (loan: Loan, rate: number): QuincenaDetail[] => {
    const quincenas: QuincenaDetail[] = [];
    const fechaInicial = new Date(loan.date);
    const hoy = new Date();

    let saldoCapital = loan.principal;
    let saldoInteres = 0;
    let numeroQuincena = 0;

    const pagosCapital = [...loan.payments].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const pagosInteres = [...(loan.interestPayments || [])].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let indicePagoCapital = 0;
    let indicePagoInteres = 0;

    while (saldoCapital > 0.01 || numeroQuincena === 0) {
      numeroQuincena++;

      const fechaInicio = new Date(fechaInicial);
      fechaInicio.setDate(fechaInicio.getDate() + (numeroQuincena - 1) * 15);

      const fechaFin = new Date(fechaInicio);
      fechaFin.setDate(fechaFin.getDate() + 14);

      const saldoCapitalInicio = saldoCapital;
      const interesDevengado = (saldoCapitalInicio * rate) / 100;

      let pagoCapitalQuincena = 0;
      let pagoInteresQuincena = 0;

      while (indicePagoCapital < pagosCapital.length) {
        const pago = pagosCapital[indicePagoCapital];
        const fechaPago = new Date(pago.date);

        if (fechaPago >= fechaInicio && fechaPago <= fechaFin) {
          pagoCapitalQuincena += pago.amount;
          indicePagoCapital++;
        } else if (fechaPago > fechaFin) {
          break;
        } else {
          indicePagoCapital++;
        }
      }

      while (indicePagoInteres < pagosInteres.length) {
        const pago = pagosInteres[indicePagoInteres];
        const fechaPago = new Date(pago.date);

        if (fechaPago >= fechaInicio && fechaPago <= fechaFin) {
          pagoInteresQuincena += pago.amount;
          indicePagoInteres++;
        } else if (fechaPago > fechaFin) {
          break;
        } else {
          indicePagoInteres++;
        }
      }

      saldoCapital -= pagoCapitalQuincena;
      saldoInteres += interesDevengado;
      saldoInteres -= pagoInteresQuincena;

      if (saldoCapital < 0) saldoCapital = 0;
      if (saldoInteres < 0) saldoInteres = 0;

      let estado: 'Pagado' | 'Pendiente' | 'Vencido' = 'Pendiente';
      if (fechaFin < hoy) {
        if (pagoInteresQuincena >= interesDevengado * 0.99) {
          estado = 'Pagado';
        } else {
          estado = 'Vencido';
        }
      } else if (fechaInicio <= hoy && hoy <= fechaFin) {
        estado = 'Pendiente';
      }

      quincenas.push({
        numero: numeroQuincena,
        fechaInicio,
        fechaFin,
        interesDevengado,
        pagoCapital: pagoCapitalQuincena,
        pagoInteres: pagoInteresQuincena,
        saldoCapital: Math.max(0, saldoCapital),
        saldoInteres: Math.max(0, saldoInteres),
        estado
      });

      if (numeroQuincena > 200) break;

      if (saldoCapital <= 0.01 && fechaFin < hoy) {
        break;
      }
    }

    return quincenas;
  };

  const generateDetailedPDF = () => {
    const doc = new jsPDF();
    const today = new Date();
    let yPos = 20;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('ESTADO DE CUENTA DETALLADO', 105, yPos, { align: 'center' });
    yPos += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Inversiones GVM', 105, yPos, { align: 'center' });
    yPos += 10;

    doc.setFontSize(9);
    doc.text(`Fecha de emisión: ${today.toLocaleDateString('es-HN')}`, 105, yPos, { align: 'center' });
    yPos += 15;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN DEL CLIENTE', 14, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Nombre: ${client.name}`, 14, yPos);
    yPos += 5;
    if (client.nickname) {
      doc.text(`Apodo: ${client.nickname}`, 14, yPos);
      yPos += 5;
    }
    if (client.idNumber) {
      doc.text(`Cédula: ${client.idNumber}`, 14, yPos);
      yPos += 5;
    }
    if (client.phoneNumber) {
      doc.text(`Teléfono: ${client.phoneNumber}`, 14, yPos);
      yPos += 5;
    }
    doc.text(`Tasa de Interés: ${client.rate}% quincenal`, 14, yPos);
    yPos += 10;

    client.loans.forEach((loan, loanIndex) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(59, 130, 246);
      doc.rect(14, yPos - 4, 182, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(`PRÉSTAMO #${loanIndex + 1}`, 16, yPos + 1);
      doc.setTextColor(0, 0, 0);
      yPos += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Fecha del préstamo: ${loan.date}`, 14, yPos);
      doc.text(`Monto inicial: ${formatLempiras(loan.principal)}`, 100, yPos);
      yPos += 5;

      const status = loan.status === 'active' ? 'Activo' :
                    loan.status === 'paid' ? 'Pagado' :
                    loan.status === 'overdue' ? 'Vencido' :
                    loan.status === 'cancelled' ? 'Cancelado' : loan.status || 'Activo';
      doc.text(`Estado: ${status}`, 14, yPos);
      yPos += 8;

      const quincenas = calcularQuincenas(loan, client.rate);

      const tableData = quincenas.map(q => [
        q.numero.toString(),
        q.fechaInicio.toLocaleDateString('es-HN', { day: '2-digit', month: '2-digit' }),
        q.fechaFin.toLocaleDateString('es-HN', { day: '2-digit', month: '2-digit' }),
        formatLempiras(q.interesDevengado),
        formatLempiras(q.pagoCapital),
        formatLempiras(q.pagoInteres),
        formatLempiras(q.saldoCapital),
        formatLempiras(q.saldoInteres),
        q.estado
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Q#', 'Inicio', 'Fin', 'Int. Dev.', 'Pago Cap.', 'Pago Int.', 'Saldo Cap.', 'Saldo Int.', 'Estado']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [59, 130, 246],
          fontSize: 7,
          fontStyle: 'bold'
        },
        bodyStyles: { fontSize: 6 },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          1: { cellWidth: 18 },
          2: { cellWidth: 18 },
          3: { cellWidth: 20 },
          4: { cellWidth: 20 },
          5: { cellWidth: 20 },
          6: { cellWidth: 22 },
          7: { cellWidth: 22 },
          8: { cellWidth: 18, halign: 'center' }
        },
        didParseCell: function(data) {
          if (data.section === 'body' && data.column.index === 8) {
            const estado = data.cell.raw as string;
            if (estado === 'Pagado') {
              data.cell.styles.fillColor = [220, 252, 231];
              data.cell.styles.textColor = [22, 101, 52];
            } else if (estado === 'Vencido') {
              data.cell.styles.fillColor = [254, 226, 226];
              data.cell.styles.textColor = [153, 27, 27];
            } else {
              data.cell.styles.fillColor = [254, 249, 195];
              data.cell.styles.textColor = [133, 77, 14];
            }
          }
        }
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;

      const ultimaQuincena = quincenas[quincenas.length - 1];
      if (ultimaQuincena) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('RESUMEN DEL PRÉSTAMO:', 14, yPos);
        yPos += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`Capital pendiente: ${formatLempiras(ultimaQuincena.saldoCapital)}`, 14, yPos);
        doc.text(`Interés acumulado: ${formatLempiras(ultimaQuincena.saldoInteres)}`, 100, yPos);
        yPos += 5;

        const totalCapitalPagado = loan.payments.reduce((sum, p) => sum + p.amount, 0);
        const totalInteresPagado = (loan.interestPayments || []).reduce((sum, p) => sum + p.amount, 0);

        doc.text(`Total pagado a capital: ${formatLempiras(totalCapitalPagado)}`, 14, yPos);
        doc.text(`Total pagado en interés: ${formatLempiras(totalInteresPagado)}`, 100, yPos);
        yPos += 5;

        const totalPendiente = ultimaQuincena.saldoCapital + ultimaQuincena.saldoInteres;
        doc.setFont('helvetica', 'bold');
        doc.text(`TOTAL PENDIENTE: ${formatLempiras(totalPendiente)}`, 14, yPos);
        yPos += 10;
      }
    });

    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN GENERAL DE TODOS LOS PRÉSTAMOS', 14, yPos);
    yPos += 8;

    let totalPrestado = 0;
    let totalCapitalPendiente = 0;
    let totalInteresPendiente = 0;
    let totalCapitalPagado = 0;
    let totalInteresPagado = 0;

    client.loans.forEach(loan => {
      totalPrestado += loan.principal;
      const quincenas = calcularQuincenas(loan, client.rate);
      const ultima = quincenas[quincenas.length - 1];
      if (ultima) {
        totalCapitalPendiente += ultima.saldoCapital;
        totalInteresPendiente += ultima.saldoInteres;
      }
      totalCapitalPagado += loan.payments.reduce((sum, p) => sum + p.amount, 0);
      totalInteresPagado += (loan.interestPayments || []).reduce((sum, p) => sum + p.amount, 0);
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Total prestado a la fecha: ${formatLempiras(totalPrestado)}`, 14, yPos);
    yPos += 6;
    doc.text(`Total pagado a capital: ${formatLempiras(totalCapitalPagado)}`, 14, yPos);
    yPos += 6;
    doc.text(`Total pagado en intereses: ${formatLempiras(totalInteresPagado)}`, 14, yPos);
    yPos += 6;
    doc.text(`Capital pendiente: ${formatLempiras(totalCapitalPendiente)}`, 14, yPos);
    yPos += 6;
    doc.text(`Interés acumulado: ${formatLempiras(totalInteresPendiente)}`, 14, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    const granTotal = totalCapitalPendiente + totalInteresPendiente;
    doc.text(`SALDO TOTAL A PAGAR: ${formatLempiras(granTotal)}`, 14, yPos);

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Página ${i} de ${pageCount} - Estado de Cuenta de ${client.name}`,
        105,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
      doc.setTextColor(0, 0, 0);
    }

    doc.save(`Estado_Cuenta_Detallado_${client.name.replace(/\s+/g, '_')}_${today.toISOString().split('T')[0]}.pdf`);
  };

  return (
    <button
      onClick={generateDetailedPDF}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
    >
      <FileText size={18} />
      <span>Estado de Cuenta Detallado</span>
      <Download size={16} />
    </button>
  );
}
