import React from 'react';
import { Client, Loan } from '../App';

interface ReceiptPrintProps {
  client: Client;
  loan: Loan;
  payment: { amount: number; type: 'capital' | 'interest' };
  formatLempiras: (amount: number) => string;
}

export function generateReceipt(
  client: Client,
  loan: Loan,
  payment: { amount: number; type: 'capital' | 'interest' },
  formatLempiras: (amount: number) => string
) {
  const today = new Date();
  const receiptNumber = `REC-${today.getTime()}`;

  const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Recibo de Pago - ${receiptNumber}</title>
      <style>
        @media print {
          body { margin: 0; padding: 15px; }
          .no-print { display: none; }
        }
        body {
          font-family: 'Courier New', monospace;
          max-width: 400px;
          margin: 0 auto;
          padding: 20px;
          line-height: 1.4;
        }
        .receipt-header {
          text-align: center;
          border-bottom: 2px dashed #000;
          padding-bottom: 15px;
          margin-bottom: 15px;
        }
        .receipt-header h1 {
          margin: 0;
          font-size: 20px;
          font-weight: bold;
        }
        .receipt-header p {
          margin: 3px 0;
          font-size: 12px;
        }
        .receipt-body {
          font-size: 13px;
        }
        .row {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
        }
        .row.bold {
          font-weight: bold;
        }
        .divider {
          border-top: 1px dashed #000;
          margin: 15px 0;
        }
        .total-section {
          background: #f0f0f0;
          padding: 10px;
          margin: 15px 0;
          border: 2px solid #000;
        }
        .receipt-footer {
          text-align: center;
          border-top: 2px dashed #000;
          padding-top: 15px;
          margin-top: 20px;
          font-size: 11px;
        }
        .signature-line {
          margin-top: 40px;
          border-top: 1px solid #000;
          padding-top: 5px;
          text-align: center;
          font-size: 11px;
        }
      </style>
    </head>
    <body>
      <div class="receipt-header">
        <h1>RECIBO DE PAGO</h1>
        <p>Sistema de Gestión de Préstamos</p>
        <p>Recibo No. ${receiptNumber}</p>
      </div>

      <div class="receipt-body">
        <div class="row">
          <span>Fecha:</span>
          <span>${today.toLocaleDateString('es-HN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</span>
        </div>
        <div class="row">
          <span>Hora:</span>
          <span>${today.toLocaleTimeString('es-HN')}</span>
        </div>

        <div class="divider"></div>

        <div class="row bold">
          <span>CLIENTE:</span>
        </div>
        <div class="row">
          <span>Nombre:</span>
          <span>${client.name}</span>
        </div>
        <div class="row">
          <span>ID:</span>
          <span>${client.idNumber}</span>
        </div>
        ${client.nickname ? `
        <div class="row">
          <span>Apodo:</span>
          <span>${client.nickname}</span>
        </div>
        ` : ''}

        <div class="divider"></div>

        <div class="row bold">
          <span>DETALLES DEL PRÉSTAMO:</span>
        </div>
        <div class="row">
          <span>Fecha del préstamo:</span>
          <span>${loan.date}</span>
        </div>
        <div class="row">
          <span>Monto original:</span>
          <span>${formatLempiras(loan.principal)}</span>
        </div>
        <div class="row">
          <span>Tasa de interés:</span>
          <span>${client.rate}% quincenal</span>
        </div>

        <div class="divider"></div>

        <div class="total-section">
          <div class="row bold" style="font-size: 16px;">
            <span>PAGO RECIBIDO:</span>
          </div>
          <div class="row bold" style="font-size: 18px; margin-top: 10px;">
            <span>${payment.type === 'capital' ? 'Pago a Capital' : 'Pago de Interés'}:</span>
            <span>${formatLempiras(payment.amount)}</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="row">
          <span>Capital pagado total:</span>
          <span>${formatLempiras(loan.payments.reduce((s, p) => s + p.amount, 0) + (payment.type === 'capital' ? payment.amount : 0))}</span>
        </div>
        <div class="row">
          <span>Interés pagado total:</span>
          <span>${formatLempiras((loan.interestPayments || []).reduce((s, p) => s + p.amount, 0) + (payment.type === 'interest' ? payment.amount : 0))}</span>
        </div>

        <div class="signature-line">
          Firma del cliente: _______________________
        </div>
      </div>

      <div class="receipt-footer">
        <p>Gracias por su pago puntual</p>
        <p>Conserve este recibo para sus registros</p>
        <p>Este documento es válido como comprobante de pago</p>
      </div>

      <div class="no-print" style="text-align: center; margin-top: 30px;">
        <button onclick="window.print()" style="background: #4F46E5; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; margin-right: 10px;">
          Imprimir Recibo
        </button>
        <button onclick="window.close()" style="background: #6B7280; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
          Cerrar
        </button>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '', 'width=400,height=600');
  if (!printWindow) {
    alert('Por favor permite ventanas emergentes para imprimir recibos');
    return;
  }

  printWindow.document.write(content);
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
  }, 250);
}
