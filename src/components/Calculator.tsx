import React, { useState } from 'react';
import { Calculator as CalcIcon, X } from 'lucide-react';

interface CalculatorProps {
  onClose: () => void;
}

export default function Calculator({ onClose }: CalculatorProps) {
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('14');
  const [targetQuincenas, setTargetQuincenas] = useState('');
  const [result, setResult] = useState<any>(null);

  const calculate = () => {
    const p = parseFloat(principal);
    const r = parseFloat(rate) / 100;
    const q = parseInt(targetQuincenas);

    if (isNaN(p) || isNaN(r) || isNaN(q) || q <= 0) {
      alert('Por favor ingresa valores válidos');
      return;
    }

    const interestPerQuincena = p * r;
    const totalInterest = interestPerQuincena * q;
    const totalPayment = p + totalInterest;
    const paymentPerQuincena = totalPayment / q;

    setResult({
      principal: p,
      rate: r * 100,
      quincenas: q,
      interestPerQuincena,
      totalInterest,
      totalPayment,
      paymentPerQuincena
    });
  };

  const formatLempiras = (amount: number) => `L ${amount.toFixed(2)}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <CalcIcon className="text-indigo-600" size={28} />
            Calculadora de Proyecciones
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto del Préstamo (L)
            </label>
            <input
              type="number"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="10000"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tasa de Interés (% quincenal)
            </label>
            <input
              type="number"
              step="0.1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="14"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ¿En cuántas quincenas quieres liquidar?
            </label>
            <input
              type="number"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="6"
              value={targetQuincenas}
              onChange={(e) => setTargetQuincenas(e.target.value)}
            />
          </div>

          <button
            onClick={calculate}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-colors"
          >
            Calcular
          </button>

          {result && (
            <div className="mt-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Resultados:</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Interés por Quincena</p>
                  <p className="text-xl font-bold text-indigo-600">
                    {formatLempiras(result.interestPerQuincena)}
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Interés Total</p>
                  <p className="text-xl font-bold text-red-600">
                    {formatLempiras(result.totalInterest)}
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Pago por Quincena</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatLempiras(result.paymentPerQuincena)}
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Total a Pagar</p>
                  <p className="text-xl font-bold text-purple-600">
                    {formatLempiras(result.totalPayment)}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm mt-4">
                <h4 className="font-medium text-gray-800 mb-3">Plan de Pagos:</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {Array.from({ length: result.quincenas }, (_, i) => (
                    <div key={i} className="flex justify-between text-sm border-b border-gray-100 pb-2">
                      <span className="text-gray-600">Quincena {i + 1}</span>
                      <span className="font-medium">{formatLempiras(result.paymentPerQuincena)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-yellow-800">
                  <strong>Nota:</strong> Esta es una proyección si pagas la misma cantidad cada quincena.
                  En el sistema real, el interés se calcula sobre el capital pendiente.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
