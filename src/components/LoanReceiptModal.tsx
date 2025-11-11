import React, { useRef } from 'react';
import { X, Printer, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import type { Client, Loan } from '../App';

interface LoanReceiptModalProps {
  client: Client;
  loan: Loan;
  formatLempiras: (amount: number) => string;
  onClose: () => void;
}

export default function LoanReceiptModal({ client, loan, formatLempiras, onClose }: LoanReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  const receiptNumber = `L-${Date.now().toString().slice(-8)}`;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsAppImage = async () => {
    if (!receiptRef.current) return;

    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'comprobante_prestamo.png', { type: 'image/png' });

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({
              files: [file],
              title: 'Comprobante de Préstamo',
              text: `Comprobante de préstamo - ${client.name}`
            }).catch((error) => {
              console.error('Error sharing:', error);
            });
          } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `comprobante_prestamo_${client.name}_${loan.date}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Error al generar la imagen del comprobante');
    }
  };

  const handleShareWhatsAppText = () => {
    if (!client.phoneNumber) {
      alert('Este cliente no tiene número de teléfono registrado');
      return;
    }

    const message = `
*INVERSIONES GVM*
*COMPROBANTE DE PRÉSTAMO*

📋 *Recibo No:* ${receiptNumber}
📅 *Fecha:* ${today.toLocaleDateString('es-HN')}

👤 *CLIENTE:*
Nombre: ${client.name}
ID: ${client.idNumber}

💰 *PRÉSTAMO:*
Monto prestado: ${formatLempiras(loan.principal)}
Fecha del préstamo: ${loan.date}

✅ *Estado:* Préstamo activo

Gracias por su confianza.
Este documento es válido como comprobante de préstamo.
    `.trim();

    const phone = client.phoneNumber.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/504${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3 flex items-center justify-between print:hidden">
          <h2 className="text-lg font-bold text-white">Comprobante de Préstamo</h2>
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
            <h2 className="text-lg font-bold text-gray-900">COMPROBANTE DE PRÉSTAMO</h2>
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
              <span className="text-gray-600">Monto prestado:</span>
              <span className="font-medium text-lg">{formatLempiras(loan.principal)}</span>
            </div>

            <div className="border-t border-dashed border-gray-300 my-3"></div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4 my-4">
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-2">MONTO TOTAL PRESTADO</div>
                <div className="text-3xl font-bold text-green-600">
                  {formatLempiras(loan.principal)}
                </div>
              </div>
            </div>


            <div className="mt-8 pt-4 border-t border-gray-300 text-center">
              <div className="text-xs text-gray-500 mb-1">Firma del cliente</div>
              <div className="border-t border-gray-400 w-48 mx-auto mt-2"></div>
              <p className="text-xs text-gray-600 mt-4">{client.name}</p>
            </div>
          </div>

          <div className="border-t-2 border-dashed border-gray-300 mt-6 pt-4 text-center text-xs text-gray-500">
            <p>Gracias por su confianza</p>
            <p>Conserve este comprobante para sus registros</p>
            <p className="font-semibold mt-1">Este documento es válido como comprobante de préstamo</p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white px-4 py-4 border-t-2 border-gray-200 print:hidden space-y-3">
          <div className="text-center text-sm font-semibold text-gray-700 mb-2">
            ¿Qué deseas hacer con este comprobante?
          </div>

          <button
            onClick={handleShareWhatsAppImage}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 px-6 rounded-xl font-bold transition-all transform hover:scale-105 flex items-center justify-center gap-3 shadow-lg"
          >
            <Share2 size={22} />
            Enviar por WhatsApp (Imagen)
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
