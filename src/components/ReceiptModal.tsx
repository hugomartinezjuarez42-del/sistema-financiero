import React, { useRef, useState } from 'react';
import { X, Printer, Share2, Image as ImageIcon } from 'lucide-react';
import { Client, Loan } from '../App';
import html2canvas from 'html2canvas';
import { supabase } from '../lib/supabase';

interface ReceiptModalProps {
  client: Client;
  loan: Loan;
  payments: Array<{ amount: number; type: 'capital' | 'interest' }>;
  formatLempiras: (amount: number) => string;
  onClose: () => void;
  previousCapital: number;
  previousInterest: number;
  currentCapital: number;
  currentInterest: number;
}

export default function ReceiptModal({
  client,
  loan,
  payments,
  formatLempiras,
  onClose,
  previousCapital,
  previousInterest,
  currentCapital,
  currentInterest
}: ReceiptModalProps) {
  const today = new Date();
  const receiptNumber = `REC-${today.getTime()}`;
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const capitalPayment = payments.find(p => p.type === 'capital');
  const interestPayment = payments.find(p => p.type === 'interest');
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  const handleShareWhatsAppText = () => {
    let paymentsText = '*💵 PAGOS RECIBIDOS:*\n';
    if (capitalPayment) {
      paymentsText += `💰 Pago a Capital: ${formatLempiras(capitalPayment.amount)}\n`;
    }
    if (interestPayment) {
      paymentsText += `📊 Pago de Interés: ${formatLempiras(interestPayment.amount)}\n`;
    }
    paymentsText += `*TOTAL PAGADO: ${formatLempiras(totalPaid)}*\n\n`;

    const message = `*RECIBO DE PAGO*\n\n` +
      `📋 Recibo: ${receiptNumber}\n` +
      `📅 Fecha: ${today.toLocaleDateString('es-HN', { year: 'numeric', month: 'long', day: 'numeric' })}\n\n` +
      `*CLIENTE:*\n` +
      `👤 ${client.name}\n` +
      `🆔 ${client.idNumber}\n` +
      `${client.nickname ? `📝 Apodo: ${client.nickname}\n` : ''}` +
      `\n*PRÉSTAMO:*\n` +
      `📆 Fecha: ${loan.date}\n` +
      `💰 Monto original: ${formatLempiras(loan.principal)}\n` +
      `📊 Tasa: ${client.rate}% quincenal\n\n` +
      paymentsText +
      `*SALDO ANTERIOR:*\n` +
      `Capital: ${formatLempiras(previousCapital)}\n` +
      `Interés: ${formatLempiras(previousInterest)}\n\n` +
      `*SALDO ACTUAL:*\n` +
      `Capital: ${formatLempiras(currentCapital)}\n` +
      `Interés: ${formatLempiras(currentInterest)}\n\n` +
      `✅ Gracias por su pago puntual`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShareWhatsAppImage = async () => {
    if (!receiptRef.current) return;

    setIsGeneratingImage(true);

    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 480,
        windowHeight: receiptRef.current.scrollHeight
      });

      const fileName = `recibo-${client.name}-${receiptNumber}.png`;
      downloadImage(canvas, fileName);

      setTimeout(() => {
        const phoneNumber = client.phoneNumber?.replace(/\D/g, '');
        const whatsappUrl = phoneNumber
          ? `https://wa.me/${phoneNumber}`
          : `https://wa.me/`;

        window.open(whatsappUrl, '_blank');
        setIsGeneratingImage(false);
      }, 1000);

    } catch (error) {
      console.error('Error generating image:', error);
      alert('Error al generar la imagen del recibo');
      setIsGeneratingImage(false);
    }
  };

  const downloadImage = (canvas: HTMLCanvasElement, filename: string) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between print:hidden">
          <h2 className="text-lg font-bold text-white">Recibo de Pago</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
            title="Cerrar"
          >
            <X size={22} />
          </button>
        </div>

        <div ref={receiptRef} className="p-6 bg-white">
          <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
            <h1 className="text-2xl font-bold text-blue-900 mb-1">INVERSIONES GVM</h1>
            <h2 className="text-lg font-bold text-gray-900">RECIBO DE PAGO</h2>
            <p className="text-sm text-gray-600 mt-1">Sistema de Gestión de Préstamos</p>
            <p className="text-xs text-gray-500 mt-1">Recibo No. {receiptNumber}</p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Fecha:</span>
              <span className="font-medium">{today.toLocaleDateString('es-HN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Hora:</span>
              <span className="font-medium">{today.toLocaleTimeString('es-HN')}</span>
            </div>

            <div className="border-t border-dashed border-gray-300 my-3"></div>

            <div className="font-bold text-gray-800 mb-2">CLIENTE:</div>
            <div className="flex justify-between">
              <span className="text-gray-600">Nombre:</span>
              <span className="font-medium">{client.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ID:</span>
              <span className="font-medium">{client.idNumber}</span>
            </div>
            {client.nickname && (
              <div className="flex justify-between">
                <span className="text-gray-600">Apodo:</span>
                <span className="font-medium">{client.nickname}</span>
              </div>
            )}

            <div className="border-t border-dashed border-gray-300 my-3"></div>

            <div className="font-bold text-gray-800 mb-2">DETALLES DEL PRÉSTAMO:</div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fecha del préstamo:</span>
              <span className="font-medium">{loan.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Monto original:</span>
              <span className="font-medium">{formatLempiras(loan.principal)}</span>
            </div>

            <div className="border-t border-dashed border-gray-300 my-3"></div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-4 my-4">
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-2">PAGOS RECIBIDOS</div>
                {capitalPayment && (
                  <div className="mb-2">
                    <div className="text-sm font-bold text-blue-900">💰 Pago a Capital</div>
                    <div className="text-xl font-bold text-green-600">
                      {formatLempiras(capitalPayment.amount)}
                    </div>
                  </div>
                )}
                {interestPayment && (
                  <div className="mb-2">
                    <div className="text-sm font-bold text-blue-900">📊 Pago de Interés</div>
                    <div className="text-xl font-bold text-orange-600">
                      {formatLempiras(interestPayment.amount)}
                    </div>
                  </div>
                )}
                {payments.length > 1 && (
                  <div className="mt-3 pt-3 border-t-2 border-blue-400">
                    <div className="text-xs text-gray-600">TOTAL PAGADO</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatLempiras(totalPaid)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-dashed border-gray-300 my-3"></div>

            <div className="bg-yellow-50 rounded-lg p-3 space-y-2">
              <div className="font-bold text-gray-800 text-xs mb-2">SALDO ANTERIOR:</div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Capital pendiente:</span>
                <span className="font-semibold text-red-600">{formatLempiras(previousCapital)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Interés pendiente:</span>
                <span className="font-semibold text-orange-600">{formatLempiras(previousInterest)}</span>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-3 space-y-2 mt-2">
              <div className="font-bold text-gray-800 text-xs mb-2">SALDO ACTUAL:</div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Capital pendiente:</span>
                <span className="font-semibold text-blue-600">{formatLempiras(currentCapital)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Interés pendiente:</span>
                <span className="font-semibold text-purple-600">{formatLempiras(currentInterest)}</span>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-300 text-center">
              <div className="text-xs text-gray-500 mb-1">Firma del cliente</div>
              <div className="border-t border-gray-400 w-48 mx-auto mt-2"></div>
            </div>
          </div>

          <div className="border-t-2 border-dashed border-gray-300 mt-6 pt-4 text-center text-xs text-gray-500">
            <p>Gracias por su pago puntual</p>
            <p>Conserve este recibo para sus registros</p>
            <p className="font-semibold mt-1">Este documento es válido como comprobante de pago</p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white px-4 py-4 border-t-2 border-gray-200 print:hidden space-y-3">
          <div className="text-center text-sm font-semibold text-gray-700 mb-2">
            ¿Qué deseas hacer con este recibo?
          </div>

          <button
            onClick={handleShareWhatsAppImage}
            disabled={isGeneratingImage}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 text-white py-4 px-6 rounded-xl font-bold transition-all transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-3 shadow-lg"
          >
            <ImageIcon size={22} />
            {isGeneratingImage ? 'Generando imagen...' : 'Enviar por WhatsApp (Imagen)'}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleShareWhatsAppText}
              className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <Share2 size={18} />
              Enviar Texto
            </button>
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <Printer size={18} />
              Imprimir
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors"
          >
            Cerrar y Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
