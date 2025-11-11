import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, TrendingUp, TrendingDown, Shield } from 'lucide-react';
import type { CreditAnalysis } from '../utils/creditAnalysis';

interface CreditScoreProps {
  analysis: CreditAnalysis;
  formatLempiras: (amount: number) => string;
}

export default function CreditScore({ analysis, formatLempiras }: CreditScoreProps) {
  const getRiskColor = () => {
    switch (analysis.risk) {
      case 'bajo': return 'bg-green-100 border-green-500 text-green-800';
      case 'medio': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'alto': return 'bg-orange-100 border-orange-500 text-orange-800';
      case 'muy-alto': return 'bg-red-100 border-red-500 text-red-800';
    }
  };

  const getRiskIcon = () => {
    switch (analysis.risk) {
      case 'bajo': return <CheckCircle size={24} className="text-green-600" />;
      case 'medio': return <AlertTriangle size={24} className="text-yellow-600" />;
      case 'alto': return <AlertTriangle size={24} className="text-orange-600" />;
      case 'muy-alto': return <XCircle size={24} className="text-red-600" />;
    }
  };

  const getScoreColor = () => {
    if (analysis.score >= 80) return 'text-green-600';
    if (analysis.score >= 60) return 'text-yellow-600';
    if (analysis.score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBarColor = () => {
    if (analysis.score >= 80) return 'bg-green-500';
    if (analysis.score >= 60) return 'bg-yellow-500';
    if (analysis.score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
      <div className="flex items-center gap-3 mb-4">
        <Shield size={28} className="text-indigo-600" />
        <h3 className="text-xl font-bold text-gray-800">Análisis de Crédito</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-2">Puntuación de Crédito</div>
          <div className={`text-5xl font-bold ${getScoreColor()}`}>
            {analysis.score}
            <span className="text-2xl text-gray-500">/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
            <div
              className={`h-3 rounded-full ${getScoreBarColor()} transition-all duration-500`}
              style={{ width: `${analysis.score}%` }}
            ></div>
          </div>
        </div>

        <div className={`rounded-lg p-4 border-2 ${getRiskColor()}`}>
          <div className="flex items-center gap-2 mb-2">
            {getRiskIcon()}
            <span className="font-bold text-lg uppercase">
              Riesgo: {analysis.risk}
            </span>
          </div>
          <div className="text-sm mt-2">
            {analysis.shouldLend ? (
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle size={18} />
                <span className="font-medium">Recomendado para préstamo</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-700">
                <XCircle size={18} />
                <span className="font-medium">NO recomendado para préstamo</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border border-blue-200">
        <div className="font-bold text-gray-800 mb-2 flex items-center gap-2">
          <TrendingUp size={18} className="text-blue-600" />
          Recomendación
        </div>
        <p className="text-gray-700">{analysis.recommendation}</p>
        {analysis.maxRecommendedLoan > 0 && (
          <div className="mt-2 text-lg font-bold text-blue-700">
            Monto máximo recomendado: {formatLempiras(analysis.maxRecommendedLoan)}
          </div>
        )}
      </div>

      <div className="mb-6">
        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <TrendingDown size={18} />
          Comportamiento de Pago
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-gray-600 mb-1">Préstamos Totales</div>
            <div className="text-2xl font-bold text-indigo-600">
              {analysis.paymentBehavior.totalLoans}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-gray-600 mb-1">Préstamos Activos</div>
            <div className="text-2xl font-bold text-orange-600">
              {analysis.paymentBehavior.activeLoans}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-gray-600 mb-1">Préstamos Pagados</div>
            <div className="text-2xl font-bold text-green-600">
              {analysis.paymentBehavior.paidLoans}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-gray-600 mb-1">Tasa de Pago Puntual</div>
            <div className={`text-2xl font-bold ${analysis.paymentBehavior.onTimePaymentRate >= 80 ? 'text-green-600' : 'text-red-600'}`}>
              {analysis.paymentBehavior.onTimePaymentRate.toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      {analysis.reasons.length > 0 && (
        <div>
          <h4 className="font-bold text-gray-800 mb-3">Factores Considerados:</h4>
          <ul className="space-y-2">
            {analysis.reasons.map((reason, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-indigo-600 mt-1">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
