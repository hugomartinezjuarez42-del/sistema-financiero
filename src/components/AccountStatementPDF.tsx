import React from 'react';
import { FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Client } from '../App';

interface AccountStatementPDFProps {
  client: Client;
  calcLoanState: (loan: any, rate: number, date: Date) => { outstanding: number; accruedInterest: number; quincenas: number };
  formatLempiras: (amount: number) => string;
}

export default function AccountStatementPDF({ client, calcLoanState, formatLempiras }: AccountStatementPDFProps) {
  const generatePDF = () => {
    const doc = new jsPDF();
    const today = new Date();

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('ESTADO DE CUENTA', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Inversiones GVM', 105, 28, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`Fecha: ${today.toLocaleDateString('es-HN')}`, 14, 40);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN DEL CLIENTE', 14, 50);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Nombre: ${client.name}`, 14, 58);
    if (client.nickname) {
      doc.text(`Apodo: ${client.nickname}`, 14, 64);
    }
    if (client.id_number) {
      doc.text(`Cédula: ${client.id_number}`, 14, 70);
    }
    if (client.phone_number) {
      doc.text(`Teléfono: ${client.phone_number}`, 14, 76);
    }
    doc.text(`Tasa de Interés: ${client.rate}%`, 14, 82);

    let totalPrestado = 0;
    let totalPendiente = 0;
    let totalPagado = 0;
    let totalIntereses = 0;

    const loansData = client.loans.map((loan, index) => {
      const state = calcLoanState(loan, client.rate, today);
      const capitalPagado = loan.payments.reduce((sum, p) => sum + p.amount, 0);
      const interesesPagados = (loan.interestPayments || []).reduce((sum, p) => sum + p.amount, 0);

      totalPrestado += loan.principal;
      totalPendiente += state.outstanding;
      totalPagado += capitalPagado;
      totalIntereses += interesesPagados;

      return [
        index + 1,
        loan.date,
        formatLempiras(loan.principal),
        formatLempiras(capitalPagado),
        formatLempiras(state.accruedInterest),
        formatLempiras(state.outstanding),
        state.quincenas,
        loan.status === 'active' ? 'Activo' : loan.status === 'paid' ? 'Pagado' : loan.status === 'overdue' ? 'Vencido' : loan.status
      ];
    });

    autoTable(doc, {
      startY: 92,
      head: [['#', 'Fecha', 'Capital', 'Pagado', 'Interés', 'Pendiente', 'Quincenas', 'Estado']],
      body: loansData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
        6: { cellWidth: 20 },
        7: { cellWidth: 20 }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('RESUMEN GENERAL', 14, finalY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Total Prestado: ${formatLempiras(totalPrestado)}`, 14, finalY + 8);
    doc.text(`Total Pagado (Capital): ${formatLempiras(totalPagado)}`, 14, finalY + 15);
    doc.text(`Total Intereses Pagados: ${formatLempiras(totalIntereses)}`, 14, finalY + 22);
    doc.text(`Total Pendiente: ${formatLempiras(totalPendiente)}`, 14, finalY + 29);

    const tasaRecuperacion = totalPrestado > 0 ? ((totalPagado / totalPrestado) * 100).toFixed(1) : '0.0';
    doc.text(`Tasa de Recuperación: ${tasaRecuperacion}%`, 14, finalY + 36);

    if (client.loans.length > 0) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALLE DE PAGOS', 14, finalY + 48);

      const paymentsData: any[] = [];
      client.loans.forEach((loan, loanIndex) => {
        loan.payments.forEach(payment => {
          paymentsData.push([
            `Préstamo ${loanIndex + 1}`,
            payment.date,
            'Capital',
            formatLempiras(payment.amount),
            payment.notes || '-'
          ]);
        });

        (loan.interestPayments || []).forEach(payment => {
          paymentsData.push([
            `Préstamo ${loanIndex + 1}`,
            payment.date,
            'Interés',
            formatLempiras(payment.amount),
            payment.notes || '-'
          ]);
        });
      });

      paymentsData.sort((a, b) => new Date(b[1]).getTime() - new Date(a[1]).getTime());

      autoTable(doc, {
        startY: finalY + 53,
        head: [['Préstamo', 'Fecha', 'Tipo', 'Monto', 'Notas']],
        body: paymentsData.slice(0, 20),
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], fontSize: 8 },
        bodyStyles: { fontSize: 7 },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 25 },
          2: { cellWidth: 20 },
          3: { cellWidth: 25 },
          4: { cellWidth: 80 }
        }
      });
    }

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    doc.save(`Estado_Cuenta_${client.name.replace(/\s+/g, '_')}_${today.toISOString().split('T')[0]}.pdf`);
  };

  return (
    <button
      onClick={generatePDF}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      <FileText size={18} />
      <span>Estado de Cuenta PDF</span>
      <Download size={16} />
    </button>
  );
}
