import React, { useState, useRef } from 'react';
import { X, Download, Calendar } from 'lucide-react';
import html2canvas from 'html2canvas';
import type { Client, Loan, Payment } from '../App';

interface QuincenasHistoryModalProps {
  client: Client;
  loan: Loan;
  formatLempiras: (amount: number) => string;
  onClose: () => void;
}

interface QuincenaInfo {
  number: number;
  startDate: Date;
  endDate: Date;
  interestDue: number;
  interestAccumulated: number;
  capitalPaid: number;
  interestPaid: number;
  capitalRemaining: number;
  status: 'paid' | 'partial' | 'unpaid';
}

export default function QuincenasHistoryModal({ client, loan, formatLempiras, onClose }: QuincenasHistoryModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [startQuincena, setStartQuincena] = useState<number>(1);
  const [endQuincena, setEndQuincena] = useState<number>(1);

  const calculateQuincenas = (): QuincenaInfo[] => {
    const quincenas: QuincenaInfo[] = [];
    const loanStartDate = new Date(loan.date);
    const today = new Date();

    const daysSinceLoan = Math.floor((today.getTime() - loanStartDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalQuincenas = Math.ceil(daysSinceLoan / 15) + 1;

    const interestPerQuincena = (loan.principal * client.rate) / 100;

    const allCapitalPayments = [...loan.payments].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const allInterestPayments = [...loan.interestPayments].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let accumulatedInterest = 0;
    let remainingCapital = loan.principal;

    for (let i = 0; i < totalQuincenas; i++) {
      const startDate = new Date(loanStartDate);
      startDate.setDate(startDate.getDate() + (i * 15));

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 14);

      if (endDate <= today) {
        accumulatedInterest += interestPerQuincena;
      }

      const capitalPaid = allCapitalPayments
        .filter(p => {
          const payDate = new Date(p.date);
          return payDate >= startDate && payDate <= endDate;
        })
        .reduce((sum, p) => sum + p.amount, 0);

      const interestPaid = allInterestPayments
        .filter(p => {
          const payDate = new Date(p.date);
          return payDate >= startDate && payDate <= endDate;
        })
        .reduce((sum, p) => sum + p.amount, 0);

      accumulatedInterest -= interestPaid;
      remainingCapital -= capitalPaid;

      let status: 'paid' | 'partial' | 'unpaid' = 'unpaid';
      if (endDate > today) {
        status = 'unpaid';
      } else if (accumulatedInterest <= 0) {
        status = 'paid';
      } else if (interestPaid > 0) {
        status = 'partial';
      }

      quincenas.push({
        number: i + 1,
        startDate,
        endDate,
        interestDue: interestPerQuincena,
        interestAccumulated: Math.max(0, accumulatedInterest),
        capitalPaid,
        interestPaid,
        capitalRemaining: Math.max(0, remainingCapital),
        status
      });
    }

    return quincenas;
  };

  const quincenas = calculateQuincenas();

  const handleGeneratePDF = async () => {
    if (!contentRef.current) return;

    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        width: contentRef.current.scrollWidth,
        height: contentRef.current.scrollHeight,
        windowWidth: contentRef.current.scrollWidth,
        windowHeight: contentRef.current.scrollHeight
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `historial_quincenas_${client.name}_${loan.date}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el documento');
    }
  };

  const filteredQuincenas = quincenas.filter(q =>
    q.number >= startQuincena && q.number <= endQuincena
  );

  const totalInterestDue = filteredQuincenas.reduce((sum, q) => sum + q.interestDue, 0);
  const totalInterestPaid = filteredQuincenas.reduce((sum, q) => sum + q.interestPaid, 0);
  const totalCapitalPaid = filteredQuincenas.reduce((sum, q) => sum + q.capitalPaid, 0);
  const finalInterestAccumulated = filteredQuincenas.length > 0 ? filteredQuincenas[filteredQuincenas.length - 1].interestAccumulated : 0;
  const finalCapitalRemaining = filteredQuincenas.length > 0 ? filteredQuincenas[filteredQuincenas.length - 1].capitalRemaining : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Historial de Quincenas</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Calendar size={18} />
              Seleccionar Rango de Quincenas
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Desde Quincena:
                </label>
                <select
                  value={startQuincena}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setStartQuincena(val);
                    if (val > endQuincena) setEndQuincena(val);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {quincenas.map(q => (
                    <option key={q.number} value={q.number}>
                      Quincena {q.number} ({q.startDate.toLocaleDateString('es-HN', { day: '2-digit', month: 'short' })})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hasta Quincena:
                </label>
                <select
                  value={endQuincena}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setEndQuincena(val);
                    if (val < startQuincena) setStartQuincena(val);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {quincenas.map(q => (
                    <option key={q.number} value={q.number}>
                      Quincena {q.number} ({q.endDate.toLocaleDateString('es-HN', { day: '2-digit', month: 'short' })})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div ref={contentRef} className="bg-white p-6" style={{ minWidth: '1000px' }}>
            <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
              <h1 className="text-2xl font-bold text-blue-900 mb-1">INVERSIONES GVM</h1>
              <h2 className="text-lg font-bold text-gray-900">HISTORIAL DE QUINCENAS</h2>
              <p className="text-sm text-gray-600 mt-2">
                Quincenas {startQuincena} a {endQuincena}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <p className="text-gray-600">Cliente:</p>
                <p className="font-bold">{client.name}</p>
              </div>
              <div>
                <p className="text-gray-600">ID:</p>
                <p className="font-bold">{client.idNumber}</p>
              </div>
              <div>
                <p className="text-gray-600">Fecha del Préstamo:</p>
                <p className="font-bold">{loan.date}</p>
              </div>
              <div>
                <p className="text-gray-600">Monto Prestado:</p>
                <p className="font-bold">{formatLempiras(loan.principal)}</p>
              </div>
            </div>

            <div>
              <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="px-2 py-2 text-left" style={{ width: '5%' }}>Q#</th>
                    <th className="px-2 py-2 text-left" style={{ width: '15%' }}>Periodo</th>
                    <th className="px-2 py-2 text-right" style={{ width: '12%' }}>Int. Generado</th>
                    <th className="px-2 py-2 text-right" style={{ width: '12%' }}>Int. Pagado</th>
                    <th className="px-2 py-2 text-right" style={{ width: '12%' }}>Int. Acumulado</th>
                    <th className="px-2 py-2 text-right" style={{ width: '12%' }}>Capital Pagado</th>
                    <th className="px-2 py-2 text-right" style={{ width: '12%' }}>Capital Restante</th>
                    <th className="px-2 py-2 text-center" style={{ width: '10%' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuincenas.map(q => (
                    <tr key={q.number} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-2 py-2 font-medium">{q.number}</td>
                      <td className="px-2 py-2 text-xs">
                        {q.startDate.toLocaleDateString('es-HN', { day: '2-digit', month: 'short' })} - {q.endDate.toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-2 py-2 text-right text-xs">{formatLempiras(q.interestDue)}</td>
                      <td className="px-2 py-2 text-right text-xs font-medium text-green-600">
                        {q.interestPaid > 0 ? formatLempiras(q.interestPaid) : '-'}
                      </td>
                      <td className="px-2 py-2 text-right text-xs font-bold text-orange-600">
                        {q.interestAccumulated > 0 ? formatLempiras(q.interestAccumulated) : '-'}
                      </td>
                      <td className="px-2 py-2 text-right text-xs font-medium text-blue-600">
                        {q.capitalPaid > 0 ? formatLempiras(q.capitalPaid) : '-'}
                      </td>
                      <td className="px-2 py-2 text-right text-xs font-bold text-gray-700">
                        {formatLempiras(q.capitalRemaining)}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {q.status === 'paid' && (
                          <span className="px-1.5 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            ✓
                          </span>
                        )}
                        {q.status === 'partial' && (
                          <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                            ◐
                          </span>
                        )}
                        {q.status === 'unpaid' && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            ✗
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold border-t-2 border-gray-300 text-xs">
                    <td colSpan={2} className="px-2 py-3">TOTALES</td>
                    <td className="px-2 py-3 text-right">{formatLempiras(totalInterestDue)}</td>
                    <td className="px-2 py-3 text-right text-green-600">{formatLempiras(totalInterestPaid)}</td>
                    <td className="px-2 py-3 text-right text-orange-600">{formatLempiras(finalInterestAccumulated)}</td>
                    <td className="px-2 py-3 text-right text-blue-600">{formatLempiras(totalCapitalPaid)}</td>
                    <td className="px-2 py-3 text-right text-gray-700">{formatLempiras(finalCapitalRemaining)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
              <p>Documento generado el {new Date().toLocaleDateString('es-HN')}</p>
              <p className="font-semibold mt-1">INVERSIONES GVM</p>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={handleGeneratePDF}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Descargar como Imagen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
