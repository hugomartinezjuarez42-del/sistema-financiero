import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileText, Download, Printer, Eye } from 'lucide-react';

interface PlanPayment {
  installment_number: number;
  due_date: string;
  amount: number;
  capital_amount?: number;
  interest_amount?: number;
  status: string;
  paid_date?: string;
  paid_amount?: number;
}

interface PaymentPlan {
  id: string;
  plan_type: string;
  original_amount: number;
  negotiated_amount: number;
  new_interest_rate?: number;
  installments: number;
  installment_amount: number;
  frequency_days: number;
  grace_period_days: number;
  start_date: string;
  end_date: string;
  status: string;
  notes?: string;
  created_at: string;
}

interface Client {
  name: string;
  phone_number?: string;
  identification?: string;
  address?: string;
}

interface Loan {
  amount: number;
  interest_rate: number;
  loan_date: string;
}

interface PaymentPlanPDFProps {
  plan: PaymentPlan;
  client: Client;
  loan: Loan;
  payments: PlanPayment[];
  organizationName?: string;
}

export default function PaymentPlanPDF({
  plan,
  client,
  loan,
  payments,
  organizationName = 'Sistema de Préstamos'
}: PaymentPlanPDFProps) {
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const formatLempiras = (amount: number) => {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-HN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPlanTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'extended_term': 'Extensión de Plazo',
      'reduced_interest': 'Reducción de Interés',
      'restructure': 'Reestructuración',
      'partial_condonation': 'Condonación Parcial',
      'custom': 'Plan Personalizado'
    };
    return types[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const statuses: { [key: string]: string } = {
      'active': 'Activo',
      'completed': 'Completado',
      'cancelled': 'Cancelado',
      'pending': 'Pendiente',
      'paid': 'Pagado'
    };
    return statuses[status] || status;
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPos = 20;

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(organizationName, pageWidth / 2, yPos, { align: 'center' });

    yPos += 8;
    doc.setFontSize(14);
    doc.text('PLAN DE NEGOCIACIÓN DE PAGO', pageWidth / 2, yPos, { align: 'center' });

    yPos += 3;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Plan No. ${plan.id.substring(0, 8).toUpperCase()}`, pageWidth / 2, yPos, { align: 'center' });

    yPos += 10;

    // Client Information
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN DEL CLIENTE', 14, yPos);
    yPos += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const clientInfo = [
      ['Nombre:', client.name],
      ['Teléfono:', client.phone_number || 'N/A'],
      ['Identificación:', client.identification || 'N/A'],
      ['Dirección:', client.address || 'N/A']
    ];

    clientInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 14, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 50, yPos);
      yPos += 5;
    });

    yPos += 5;

    // Loan Information
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN DEL PRÉSTAMO ORIGINAL', 14, yPos);
    yPos += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const loanInfo = [
      ['Monto Prestado:', formatLempiras(loan.amount)],
      ['Tasa de Interés:', `${loan.interest_rate}%`],
      ['Fecha del Préstamo:', formatDate(loan.loan_date)]
    ];

    loanInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 14, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 65, yPos);
      yPos += 5;
    });

    yPos += 5;

    // Negotiation Details
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLES DE LA NEGOCIACIÓN', 14, yPos);
    yPos += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const negotiationInfo = [
      ['Tipo de Plan:', getPlanTypeLabel(plan.plan_type)],
      ['Estado:', getStatusLabel(plan.status)],
      ['Monto Original:', formatLempiras(plan.original_amount)],
      ['Monto Negociado:', formatLempiras(plan.negotiated_amount)],
      ...(plan.new_interest_rate ? [['Nueva Tasa de Interés:', `${plan.new_interest_rate}%`]] : []),
      ['Número de Cuotas:', plan.installments.toString()],
      ['Monto por Cuota:', formatLempiras(plan.installment_amount)],
      ['Frecuencia:', `Cada ${plan.frequency_days} días`],
      ['Período de Gracia:', `${plan.grace_period_days} días`],
      ['Fecha de Inicio:', formatDate(plan.start_date)],
      ['Fecha de Finalización:', formatDate(plan.end_date)],
      ['Fecha de Creación:', formatDate(plan.created_at)]
    ];

    negotiationInfo.forEach(([label, value]) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.text(label, 14, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 70, yPos);
      yPos += 5;
    });

    if (plan.notes) {
      yPos += 2;
      doc.setFont('helvetica', 'bold');
      doc.text('Notas:', 14, yPos);
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      const notesLines = doc.splitTextToSize(plan.notes, pageWidth - 28);
      doc.text(notesLines, 14, yPos);
      yPos += (notesLines.length * 5) + 3;
    }

    yPos += 5;

    // Payment Schedule Table
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('CALENDARIO DE PAGOS', 14, yPos);
    yPos += 5;

    const tableData = payments.map(payment => [
      payment.installment_number.toString(),
      formatDate(payment.due_date),
      payment.capital_amount ? formatLempiras(payment.capital_amount) : '-',
      payment.interest_amount ? formatLempiras(payment.interest_amount) : '-',
      formatLempiras(payment.amount),
      getStatusLabel(payment.status),
      payment.paid_date ? formatDate(payment.paid_date) : '-',
      payment.paid_amount ? formatLempiras(payment.paid_amount) : '-'
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Fecha', 'Capital', 'Interés', 'Total', 'Estado', 'F. Pago', 'Pagado']],
      body: tableData,
      styles: {
        fontSize: 7,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 28 },
        2: { cellWidth: 25, textColor: [37, 99, 235] },
        3: { cellWidth: 25, textColor: [234, 88, 12] },
        4: { cellWidth: 25, fontStyle: 'bold' },
        5: { cellWidth: 22 },
        6: { cellWidth: 26 },
        7: { cellWidth: 25 }
      }
    });

    // Summary
    const finalY = (doc as any).lastAutoTable.finalY || yPos + 50;
    yPos = finalY + 10;

    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN', 14, yPos);
    yPos += 6;

    const paidPayments = payments.filter(p => p.status === 'paid');
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const totalPaid = paidPayments.reduce((sum, p) => sum + (p.paid_amount || 0), 0);
    const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summary = [
      ['Total Negociado:', formatLempiras(plan.negotiated_amount)],
      ['Cuotas Pagadas:', `${paidPayments.length} de ${plan.installments}`],
      ['Total Pagado:', formatLempiras(totalPaid)],
      ['Total Pendiente:', formatLempiras(totalPending)],
      ['Progreso:', `${Math.round((paidPayments.length / plan.installments) * 100)}%`]
    ];

    summary.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 14, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 70, yPos);
      yPos += 5;
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
      doc.text(
        `Generado el ${new Date().toLocaleDateString('es-HN')} a las ${new Date().toLocaleTimeString('es-HN')}`,
        pageWidth / 2,
        doc.internal.pageSize.height - 6,
        { align: 'center' }
      );
    }

    return doc;
  };

  const handlePreview = () => {
    try {
      setLoading(true);
      const doc = generatePDF();
      // Usar datauristring para mejor compatibilidad móvil
      const pdfDataUri = doc.output('datauristring');
      setPreviewUrl(pdfDataUri);
    } catch (error) {
      console.error('Error generating preview:', error);
      alert('Error al generar la vista previa: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    try {
      setLoading(true);
      const doc = generatePDF();
      const fileName = `Plan_Negociacion_${client.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      alert('PDF descargado exitosamente');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error al descargar el PDF');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    try {
      setLoading(true);
      const doc = generatePDF();
      const pdfDataUri = doc.output('datauristring');

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>Imprimir Plan de Negociación</title></head>
            <body style="margin:0">
              <iframe width="100%" height="100%" src="${pdfDataUri}"></iframe>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };
      }
    } catch (error) {
      console.error('Error printing PDF:', error);
      alert('Error al imprimir el PDF: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const closePreview = () => {
    setPreviewUrl(null);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handlePreview}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Vista Previa"
      >
        <Eye className="w-4 h-4" />
        <span>Ver</span>
      </button>

      <button
        onClick={handleDownload}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Descargar PDF"
      >
        <Download className="w-4 h-4" />
        <span>Descargar</span>
      </button>

      <button
        onClick={handlePrint}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Imprimir"
      >
        <Printer className="w-4 h-4" />
        <span>Imprimir</span>
      </button>

      {previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Vista Previa - Plan de Negociación</h3>
              <button
                onClick={closePreview}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={previewUrl}
                className="w-full h-full"
                title="Vista previa del PDF"
              />
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                Descargar
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
              <button
                onClick={closePreview}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
