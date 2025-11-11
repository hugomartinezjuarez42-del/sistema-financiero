import React, { useState } from 'react';
import { TrendingUp, DollarSign, Percent, Target, ArrowUpRight, ArrowDownRight, Users } from 'lucide-react';
import { Client } from '../App';

interface ProfitabilityAnalysisProps {
  clients: Client[];
  calcLoanState: (loan: any, rate: number, date: Date) => { outstanding: number; accruedInterest: number; quincenas: number };
  formatLempiras: (amount: number) => string;
}

interface ClientProfitability {
  client: Client;
  totalLoaned: number;
  totalInterestPaid: number;
  totalCapitalPaid: number;
  outstanding: number;
  profitMargin: number;
  roi: number;
  activeLoans: number;
  completedLoans: number;
  averageLoanAmount: number;
  paymentConsistency: number;
  riskScore: number;
}

export default function ProfitabilityAnalysis({ clients, calcLoanState, formatLempiras }: ProfitabilityAnalysisProps) {
  const [sortBy, setSortBy] = useState<'profitMargin' | 'roi' | 'totalInterestPaid'>('profitMargin');
  const [filterRisk, setFilterRisk] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const today = new Date();

  const calculateProfitability = (): ClientProfitability[] => {
    return clients.map(client => {
      let totalLoaned = 0;
      let totalInterestPaid = 0;
      let totalCapitalPaid = 0;
      let outstanding = 0;
      let activeLoans = 0;
      let completedLoans = 0;
      let totalPayments = 0;
      let onTimePayments = 0;

      client.loans.forEach(loan => {
        const state = calcLoanState(loan, client.rate, today);
        const capitalPaid = loan.payments.reduce((sum, p) => sum + p.amount, 0);
        const interestPaid = (loan.interestPayments || []).reduce((sum, p) => sum + p.amount, 0);

        totalLoaned += loan.principal;
        totalInterestPaid += interestPaid;
        totalCapitalPaid += capitalPaid;
        outstanding += state.outstanding;

        if (state.outstanding > 0) {
          activeLoans++;
        } else if (capitalPaid >= loan.principal) {
          completedLoans++;
        }

        const allPayments = [...loan.payments, ...(loan.interestPayments || [])];
        totalPayments += allPayments.length;

        allPayments.forEach(payment => {
          const paymentDate = new Date(payment.date);
          const loanDate = new Date(loan.date);
          const daysDiff = Math.floor((paymentDate.getTime() - loanDate.getTime()) / (1000 * 60 * 60 * 24));
          const expectedQuincenas = Math.floor(daysDiff / 15);
          if (expectedQuincenas >= 0 && expectedQuincenas <= daysDiff / 15 + 2) {
            onTimePayments++;
          }
        });
      });

      const profitMargin = totalLoaned > 0 ? (totalInterestPaid / totalLoaned) * 100 : 0;
      const roi = totalCapitalPaid > 0 ? (totalInterestPaid / totalCapitalPaid) * 100 : 0;
      const averageLoanAmount = client.loans.length > 0 ? totalLoaned / client.loans.length : 0;
      const paymentConsistency = totalPayments > 0 ? (onTimePayments / totalPayments) * 100 : 0;

      let riskScore = 100;
      if (outstanding > totalLoaned * 0.5) riskScore -= 30;
      if (paymentConsistency < 70) riskScore -= 20;
      if (activeLoans > 3) riskScore -= 15;
      if (totalCapitalPaid < totalLoaned * 0.3) riskScore -= 20;
      if (client.loans.some(loan => {
        const state = calcLoanState(loan, client.rate, today);
        return state.quincenas > 8;
      })) riskScore -= 15;

      return {
        client,
        totalLoaned,
        totalInterestPaid,
        totalCapitalPaid,
        outstanding,
        profitMargin,
        roi,
        activeLoans,
        completedLoans,
        averageLoanAmount,
        paymentConsistency,
        riskScore: Math.max(0, riskScore)
      };
    });
  };

  const profitabilityData = calculateProfitability();

  const filteredData = profitabilityData.filter(data => {
    if (filterRisk === 'all') return true;
    if (filterRisk === 'low') return data.riskScore >= 70;
    if (filterRisk === 'medium') return data.riskScore >= 40 && data.riskScore < 70;
    if (filterRisk === 'high') return data.riskScore < 40;
    return true;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortBy === 'profitMargin') return b.profitMargin - a.profitMargin;
    if (sortBy === 'roi') return b.roi - a.roi;
    if (sortBy === 'totalInterestPaid') return b.totalInterestPaid - a.totalInterestPaid;
    return 0;
  });

  const totalStats = {
    totalInterest: profitabilityData.reduce((sum, d) => sum + d.totalInterestPaid, 0),
    totalLoaned: profitabilityData.reduce((sum, d) => sum + d.totalLoaned, 0),
    avgProfitMargin: profitabilityData.length > 0
      ? profitabilityData.reduce((sum, d) => sum + d.profitMargin, 0) / profitabilityData.length
      : 0,
    avgRoi: profitabilityData.length > 0
      ? profitabilityData.reduce((sum, d) => sum + d.roi, 0) / profitabilityData.length
      : 0
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRiskLabel = (score: number) => {
    if (score >= 70) return 'Bajo';
    if (score >= 40) return 'Medio';
    return 'Alto';
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-3xl font-bold mb-2">Análisis de Rentabilidad</h2>
        <p className="text-green-100">Evaluación de rentabilidad por cliente</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Intereses Totales</p>
              <p className="text-2xl font-bold text-gray-900">{formatLempiras(totalStats.totalInterest)}</p>
              <p className="text-xs text-green-600 mt-1">Ganancia generada</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="text-green-600" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Margen Promedio</p>
              <p className="text-2xl font-bold text-gray-900">{totalStats.avgProfitMargin.toFixed(1)}%</p>
              <p className="text-xs text-blue-600 mt-1">Rentabilidad media</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Percent className="text-blue-600" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">ROI Promedio</p>
              <p className="text-2xl font-bold text-gray-900">{totalStats.avgRoi.toFixed(1)}%</p>
              <p className="text-xs text-purple-600 mt-1">Retorno de inversión</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Target className="text-purple-600" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Clientes Analizados</p>
              <p className="text-2xl font-bold text-gray-900">{profitabilityData.length}</p>
              <p className="text-xs text-orange-600 mt-1">Total en cartera</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <Users className="text-orange-600" size={28} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ordenar por:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="profitMargin">Margen de Ganancia</option>
              <option value="roi">ROI</option>
              <option value="totalInterestPaid">Intereses Pagados</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por riesgo:</label>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="low">Riesgo Bajo</option>
              <option value="medium">Riesgo Medio</option>
              <option value="high">Riesgo Alto</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prestado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interés Ganado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margen</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ROI</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consistencia</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Riesgo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Préstamos</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedData.map((data, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{data.client.name}</div>
                    {data.client.nickname && (
                      <div className="text-sm text-gray-500">({data.client.nickname})</div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatLempiras(data.totalLoaned)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-green-600">
                      {formatLempiras(data.totalInterestPaid)}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {data.profitMargin > 20 ? (
                        <ArrowUpRight className="text-green-600" size={16} />
                      ) : (
                        <ArrowDownRight className="text-red-600" size={16} />
                      )}
                      <span className={`text-sm font-semibold ${data.profitMargin > 20 ? 'text-green-600' : 'text-red-600'}`}>
                        {data.profitMargin.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                    {data.roi.toFixed(1)}%
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${data.paymentConsistency}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600">{data.paymentConsistency.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(data.riskScore)}`}>
                      {getRiskLabel(data.riskScore)} ({data.riskScore})
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex gap-2">
                      <span className="text-green-600 font-semibold">{data.activeLoans}</span>
                      <span className="text-gray-400">/</span>
                      <span className="text-gray-600">{data.completedLoans}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedData.length === 0 && (
          <div className="text-center py-12">
            <TrendingUp className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">No hay datos para mostrar con los filtros seleccionados</p>
          </div>
        )}
      </div>
    </div>
  );
}
