import React, { useState } from 'react';
import { BarChart3, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { Client } from '../App';

interface ComparativeAnalysisProps {
  clients: Client[];
  calcLoanState: (loan: any, rate: number, date: Date) => { outstanding: number; accruedInterest: number; quincenas: number };
  formatLempiras: (amount: number) => string;
}

interface MonthlyData {
  month: string;
  year: number;
  loansCreated: number;
  totalLoaned: number;
  capitalPaid: number;
  interestPaid: number;
  newClients: number;
}

export default function ComparativeAnalysis({ clients, calcLoanState, formatLempiras }: ComparativeAnalysisProps) {
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  const getMonthlyData = (): MonthlyData[] => {
    const dataMap = new Map<string, MonthlyData>();

    clients.forEach(client => {
      const clientCreatedDate = new Date(client.created_at);
      const clientKey = `${clientCreatedDate.getFullYear()}-${clientCreatedDate.getMonth()}`;

      if (!dataMap.has(clientKey)) {
        dataMap.set(clientKey, {
          month: monthNames[clientCreatedDate.getMonth()],
          year: clientCreatedDate.getFullYear(),
          loansCreated: 0,
          totalLoaned: 0,
          capitalPaid: 0,
          interestPaid: 0,
          newClients: 0
        });
      }
      dataMap.get(clientKey)!.newClients++;

      client.loans.forEach(loan => {
        const loanDate = new Date(loan.date);
        const loanKey = `${loanDate.getFullYear()}-${loanDate.getMonth()}`;

        if (!dataMap.has(loanKey)) {
          dataMap.set(loanKey, {
            month: monthNames[loanDate.getMonth()],
            year: loanDate.getFullYear(),
            loansCreated: 0,
            totalLoaned: 0,
            capitalPaid: 0,
            interestPaid: 0,
            newClients: 0
          });
        }

        const monthData = dataMap.get(loanKey)!;
        monthData.loansCreated++;
        monthData.totalLoaned += loan.principal;

        loan.payments.forEach(payment => {
          const paymentDate = new Date(payment.date);
          const paymentKey = `${paymentDate.getFullYear()}-${paymentDate.getMonth()}`;

          if (!dataMap.has(paymentKey)) {
            dataMap.set(paymentKey, {
              month: monthNames[paymentDate.getMonth()],
              year: paymentDate.getFullYear(),
              loansCreated: 0,
              totalLoaned: 0,
              capitalPaid: 0,
              interestPaid: 0,
              newClients: 0
            });
          }

          dataMap.get(paymentKey)!.capitalPaid += payment.amount;
        });

        (loan.interestPayments || []).forEach(payment => {
          const paymentDate = new Date(payment.date);
          const paymentKey = `${paymentDate.getFullYear()}-${paymentDate.getMonth()}`;

          if (!dataMap.has(paymentKey)) {
            dataMap.set(paymentKey, {
              month: monthNames[paymentDate.getMonth()],
              year: paymentDate.getFullYear(),
              loansCreated: 0,
              totalLoaned: 0,
              capitalPaid: 0,
              interestPaid: 0,
              newClients: 0
            });
          }

          dataMap.get(paymentKey)!.interestPaid += payment.amount;
        });
      });
    });

    return Array.from(dataMap.values())
      .filter(data => viewMode === 'yearly' || data.year === selectedYear)
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return monthNames.indexOf(a.month) - monthNames.indexOf(b.month);
      });
  };

  const getYearlyData = () => {
    const yearMap = new Map<number, {
      year: number;
      loansCreated: number;
      totalLoaned: number;
      capitalPaid: number;
      interestPaid: number;
      newClients: number;
    }>();

    const monthlyData = getMonthlyData();
    monthlyData.forEach(data => {
      if (!yearMap.has(data.year)) {
        yearMap.set(data.year, {
          year: data.year,
          loansCreated: 0,
          totalLoaned: 0,
          capitalPaid: 0,
          interestPaid: 0,
          newClients: 0
        });
      }

      const yearData = yearMap.get(data.year)!;
      yearData.loansCreated += data.loansCreated;
      yearData.totalLoaned += data.totalLoaned;
      yearData.capitalPaid += data.capitalPaid;
      yearData.interestPaid += data.interestPaid;
      yearData.newClients += data.newClients;
    });

    return Array.from(yearMap.values()).sort((a, b) => a.year - b.year);
  };

  const monthlyData = viewMode === 'monthly' ? getMonthlyData() : [];
  const yearlyData = viewMode === 'yearly' ? getYearlyData() : [];
  const displayData = viewMode === 'monthly' ? monthlyData : yearlyData;

  const availableYears = Array.from(new Set(
    clients.flatMap(c => [
      new Date(c.created_at).getFullYear(),
      ...c.loans.map(l => new Date(l.date).getFullYear())
    ])
  )).sort((a, b) => b - a);

  if (availableYears.length === 0) {
    availableYears.push(new Date().getFullYear());
  }

  const maxValue = Math.max(
    ...displayData.map(d => Math.max(d.totalLoaned, d.capitalPaid, d.interestPaid))
  );

  const getBarHeight = (value: number) => {
    return maxValue > 0 ? (value / maxValue) * 100 : 0;
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const getTotals = () => {
    return displayData.reduce(
      (acc, data) => ({
        loansCreated: acc.loansCreated + data.loansCreated,
        totalLoaned: acc.totalLoaned + data.totalLoaned,
        capitalPaid: acc.capitalPaid + data.capitalPaid,
        interestPaid: acc.interestPaid + data.interestPaid,
        newClients: acc.newClients + data.newClients
      }),
      { loansCreated: 0, totalLoaned: 0, capitalPaid: 0, interestPaid: 0, newClients: 0 }
    );
  };

  const totals = getTotals();

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-3xl font-bold mb-2">Análisis Comparativo</h2>
        <p className="text-blue-100">Comparación mensual y anual de operaciones</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vista:</label>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'monthly'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Mensual
              </button>
              <button
                onClick={() => setViewMode('yearly')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'yearly'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Anual
              </button>
            </div>
          </div>

          {viewMode === 'monthly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Año:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="text-blue-600" size={20} />
              <p className="text-sm font-medium text-gray-700">Préstamos</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">{totals.loansCreated}</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="text-green-600" size={20} />
              <p className="text-sm font-medium text-gray-700">Total Prestado</p>
            </div>
            <p className="text-xl font-bold text-green-600">{formatLempiras(totals.totalLoaned)}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-purple-600" size={20} />
              <p className="text-sm font-medium text-gray-700">Capital Pagado</p>
            </div>
            <p className="text-xl font-bold text-purple-600">{formatLempiras(totals.capitalPaid)}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="text-orange-600" size={20} />
              <p className="text-sm font-medium text-gray-700">Intereses</p>
            </div>
            <p className="text-xl font-bold text-orange-600">{formatLempiras(totals.interestPaid)}</p>
          </div>

          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-cyan-600" size={20} />
              <p className="text-sm font-medium text-gray-700">Nuevos Clientes</p>
            </div>
            <p className="text-2xl font-bold text-cyan-600">{totals.newClients}</p>
          </div>
        </div>

        {displayData.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">No hay datos disponibles para el período seleccionado</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Gráfico Comparativo</h3>
              <div className="flex items-end justify-between gap-2 h-64 bg-gray-50 rounded-lg p-4">
                {displayData.map((data, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="flex-1 w-full flex items-end justify-center gap-1">
                      <div
                        className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer relative group"
                        style={{ height: `${getBarHeight(data.totalLoaned)}%`, minHeight: data.totalLoaned > 0 ? '4px' : '0' }}
                        title={`Prestado: ${formatLempiras(data.totalLoaned)}`}
                      >
                        <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {formatLempiras(data.totalLoaned)}
                        </span>
                      </div>
                      <div
                        className="w-full bg-green-500 rounded-t hover:bg-green-600 transition-colors cursor-pointer relative group"
                        style={{ height: `${getBarHeight(data.capitalPaid)}%`, minHeight: data.capitalPaid > 0 ? '4px' : '0' }}
                        title={`Capital: ${formatLempiras(data.capitalPaid)}`}
                      >
                        <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-green-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {formatLempiras(data.capitalPaid)}
                        </span>
                      </div>
                      <div
                        className="w-full bg-orange-500 rounded-t hover:bg-orange-600 transition-colors cursor-pointer relative group"
                        style={{ height: `${getBarHeight(data.interestPaid)}%`, minHeight: data.interestPaid > 0 ? '4px' : '0' }}
                        title={`Interés: ${formatLempiras(data.interestPaid)}`}
                      >
                        <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {formatLempiras(data.interestPaid)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-gray-600">
                      {viewMode === 'monthly' ? data.month : data.year}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-sm text-gray-600">Prestado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm text-gray-600">Capital Pagado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-500 rounded"></div>
                  <span className="text-sm text-gray-600">Intereses</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {viewMode === 'monthly' ? 'Mes' : 'Año'}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Préstamos</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Prestado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capital Pagado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Intereses</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nuevos Clientes</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crecimiento</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayData.map((data, index) => {
                    const prevData = index > 0 ? displayData[index - 1] : null;
                    const growth = prevData ? calculateGrowth(data.totalLoaned, prevData.totalLoaned) : 0;

                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {viewMode === 'monthly' ? `${data.month} ${data.year}` : data.year}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{data.loansCreated}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                          {formatLempiras(data.totalLoaned)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {formatLempiras(data.capitalPaid)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-orange-600">
                          {formatLempiras(data.interestPaid)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{data.newClients}</td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {index > 0 && (
                            <span className={`text-sm font-semibold ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
