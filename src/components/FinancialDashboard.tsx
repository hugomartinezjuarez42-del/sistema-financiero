import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Users, Calendar, Percent, AlertCircle, CheckCircle } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Client } from '../App';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface FinancialDashboardProps {
  clients: Client[];
  isDark: boolean;
}

interface MonthlyData {
  month: string;
  loans: number;
  payments: number;
  interest: number;
  expectedInterest: number;
}

interface ClientRanking {
  name: string;
  totalPaid: number;
  totalLoaned: number;
  onTimePayments: number;
  latePayments: number;
  score: number;
}

export default function FinancialDashboard({ clients, isDark }: FinancialDashboardProps) {
  const formatLempiras = (amount: number) => {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const stats = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let totalLoaned = 0;
    let totalOutstanding = 0;
    let totalInterestCollected = 0;
    let totalInterestExpected = 0;
    let totalInterestPending = 0;
    let activeLoans = 0;
    let overdueLoans = 0;
    let projectedIncome30Days = 0;

    clients.forEach(client => {
      client.loans.forEach(loan => {
        const loanDate = new Date(loan.date);
        const daysSinceLoan = Math.floor((now.getTime() - loanDate.getTime()) / (1000 * 60 * 60 * 24));
        const quincenasElapsed = Math.floor(daysSinceLoan / 15);
        const interestPerQuincena = (loan.principal * client.rate) / 100;

        totalLoaned += loan.principal;

        const totalCapitalPaid = loan.payments.reduce((sum, p) => sum + p.amount, 0);
        const outstanding = loan.principal - totalCapitalPaid;
        totalOutstanding += outstanding;

        if (outstanding > 0) {
          activeLoans++;
        }

        const totalInterestPaid = (loan.interestPayments || []).reduce((sum, p) => sum + p.amount, 0);
        totalInterestCollected += totalInterestPaid;

        const expectedInterest = interestPerQuincena * quincenasElapsed;
        totalInterestExpected += expectedInterest;

        const pendingInterest = Math.max(0, expectedInterest - totalInterestPaid);
        totalInterestPending += pendingInterest;

        if (pendingInterest > interestPerQuincena * 2 && outstanding > 0) {
          overdueLoans++;
        }

        if (outstanding > 0) {
          const daysUntil30 = 30;
          const quincenasIn30Days = Math.floor(daysUntil30 / 15);
          projectedIncome30Days += interestPerQuincena * Math.max(1, quincenasIn30Days);
        }
      });
    });

    const recoveryRate = totalInterestExpected > 0
      ? (totalInterestCollected / totalInterestExpected) * 100
      : 0;

    return {
      totalLoaned,
      totalOutstanding,
      totalInterestCollected,
      totalInterestExpected,
      totalInterestPending,
      activeLoans,
      overdueLoans,
      activeClients: clients.filter(c => c.loans.some(l => {
        const paid = l.payments.reduce((s, p) => s + p.amount, 0);
        return l.principal - paid > 0;
      })).length,
      recoveryRate,
      projectedIncome30Days
    };
  }, [clients]);

  const monthlyData = useMemo((): MonthlyData[] => {
    const months: { [key: string]: MonthlyData } = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('es-HN', { month: 'short', year: 'numeric' });

      months[key] = {
        month: monthName,
        loans: 0,
        payments: 0,
        interest: 0,
        expectedInterest: 0
      };
    }

    clients.forEach(client => {
      client.loans.forEach(loan => {
        const loanDate = new Date(loan.date);
        const loanKey = `${loanDate.getFullYear()}-${String(loanDate.getMonth() + 1).padStart(2, '0')}`;

        if (months[loanKey]) {
          months[loanKey].loans += loan.principal;
        }

        loan.payments.forEach(payment => {
          const payDate = new Date(payment.date);
          const payKey = `${payDate.getFullYear()}-${String(payDate.getMonth() + 1).padStart(2, '0')}`;
          if (months[payKey]) {
            months[payKey].payments += payment.amount;
          }
        });

        (loan.interestPayments || []).forEach(payment => {
          const payDate = new Date(payment.date);
          const payKey = `${payDate.getFullYear()}-${String(payDate.getMonth() + 1).padStart(2, '0')}`;
          if (months[payKey]) {
            months[payKey].interest += payment.amount;
          }
        });
      });
    });

    return Object.values(months);
  }, [clients]);

  const clientRankings = useMemo((): { best: ClientRanking[]; worst: ClientRanking[] } => {
    const rankings: ClientRanking[] = clients.map(client => {
      let totalPaid = 0;
      let totalLoaned = 0;
      let onTimePayments = 0;
      let latePayments = 0;

      client.loans.forEach(loan => {
        totalLoaned += loan.principal;
        const capitalPaid = loan.payments.reduce((sum, p) => sum + p.amount, 0);
        const interestPaid = (loan.interestPayments || []).reduce((sum, p) => sum + p.amount, 0);
        totalPaid += capitalPaid + interestPaid;

        const loanDate = new Date(loan.date);
        const now = new Date();
        const daysSinceLoan = Math.floor((now.getTime() - loanDate.getTime()) / (1000 * 60 * 60 * 24));
        const quincenasElapsed = Math.floor(daysSinceLoan / 15);
        const interestPerQuincena = (loan.principal * client.rate) / 100;
        const expectedInterest = interestPerQuincena * quincenasElapsed;

        if (interestPaid >= expectedInterest) {
          onTimePayments += quincenasElapsed;
        } else {
          latePayments += Math.floor((expectedInterest - interestPaid) / interestPerQuincena);
        }
      });

      const paymentRate = (onTimePayments + latePayments) > 0
        ? (onTimePayments / (onTimePayments + latePayments)) * 100
        : 0;

      const recoveryRate = totalLoaned > 0 ? (totalPaid / totalLoaned) * 100 : 0;

      const score = (paymentRate * 0.6) + (recoveryRate * 0.4);

      return {
        name: client.name,
        totalPaid,
        totalLoaned,
        onTimePayments,
        latePayments,
        score
      };
    }).filter(r => r.totalLoaned > 0);

    rankings.sort((a, b) => b.score - a.score);

    return {
      best: rankings.slice(0, 10),
      worst: rankings.slice(-10).reverse()
    };
  }, [clients]);

  const cashflowChartData = {
    labels: monthlyData.map(d => d.month),
    datasets: [
      {
        label: 'Préstamos Otorgados',
        data: monthlyData.map(d => d.loans),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4
      },
      {
        label: 'Pagos de Capital',
        data: monthlyData.map(d => d.payments),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4
      },
      {
        label: 'Intereses Cobrados',
        data: monthlyData.map(d => d.interest),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      }
    ]
  };

  const comparisonChartData = {
    labels: monthlyData.map(d => d.month),
    datasets: [
      {
        label: 'Mes Actual',
        data: monthlyData.map(d => d.interest + d.payments),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: isDark ? '#e5e7eb' : '#374151'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: isDark ? '#9ca3af' : '#6b7280'
        },
        grid: {
          color: isDark ? '#374151' : '#e5e7eb'
        }
      },
      x: {
        ticks: {
          color: isDark ? '#9ca3af' : '#6b7280'
        },
        grid: {
          color: isDark ? '#374151' : '#e5e7eb'
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Prestado</p>
              <p className="text-2xl font-bold">{formatLempiras(stats.totalLoaned)}</p>
            </div>
            <DollarSign className="text-blue-500" size={32} />
          </div>
        </div>

        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Capital Pendiente</p>
              <p className="text-2xl font-bold">{formatLempiras(stats.totalOutstanding)}</p>
            </div>
            <TrendingUp className="text-orange-500" size={32} />
          </div>
        </div>

        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Préstamos Activos</p>
              <p className="text-2xl font-bold">{stats.activeLoans}</p>
              <p className="text-xs text-red-500">{stats.overdueLoans} morosos</p>
            </div>
            <Users className="text-green-500" size={32} />
          </div>
        </div>

        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Tasa de Recuperación</p>
              <p className="text-2xl font-bold">{stats.recoveryRate.toFixed(1)}%</p>
            </div>
            <Percent className="text-purple-500" size={32} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Interés Cobrado</p>
              <p className="text-xl font-bold text-green-600">{formatLempiras(stats.totalInterestCollected)}</p>
            </div>
            <CheckCircle className="text-green-500" size={24} />
          </div>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <p>Esperado: {formatLempiras(stats.totalInterestExpected)}</p>
          </div>
        </div>

        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Interés Pendiente</p>
              <p className="text-xl font-bold text-red-600">{formatLempiras(stats.totalInterestPending)}</p>
            </div>
            <AlertCircle className="text-red-500" size={24} />
          </div>
        </div>
      </div>

      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="text-blue-500" size={24} />
          <h3 className="text-xl font-bold">Proyección 30 Días</h3>
        </div>
        <p className="text-3xl font-bold text-blue-600">{formatLempiras(stats.projectedIncome30Days)}</p>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Ingresos estimados por intereses</p>
      </div>

      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
        <h3 className="text-xl font-bold mb-4">Flujo de Efectivo Mensual</h3>
        <div className="h-80">
          <Line data={cashflowChartData} options={chartOptions} />
        </div>
      </div>

      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
        <h3 className="text-xl font-bold mb-4">Comparación Mes a Mes</h3>
        <div className="h-80">
          <Bar data={comparisonChartData} options={chartOptions} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="text-green-500" />
            Top 10 Mejores Clientes
          </h3>
          <div className="space-y-2">
            {clientRankings.best.map((client, idx) => (
              <div key={idx} className={`p-3 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{idx + 1}. {client.name}</span>
                  <span className="text-green-600 font-bold">{client.score.toFixed(0)}%</span>
                </div>
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Pagado: {formatLempiras(client.totalPaid)} | A tiempo: {client.onTimePayments}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingDown className="text-red-500" />
            Clientes con Más Atrasos
          </h3>
          <div className="space-y-2">
            {clientRankings.worst.map((client, idx) => (
              <div key={idx} className={`p-3 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{client.name}</span>
                  <span className="text-red-600 font-bold">{client.score.toFixed(0)}%</span>
                </div>
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Pagado: {formatLempiras(client.totalPaid)} | Atrasos: {client.latePayments}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
