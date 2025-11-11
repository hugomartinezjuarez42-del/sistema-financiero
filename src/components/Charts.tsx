import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Client } from '../App';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ChartsProps {
  clients: Client[];
  calcLoanState: (loan: any, rate: number, date: Date) => any;
  formatLempiras: (amount: number) => string;
}

export default function Charts({ clients, calcLoanState, formatLempiras }: ChartsProps) {
  const today = new Date();

  const clientDebts = clients.map(client => {
    const totalDebt = client.loans.reduce((sum, loan) => {
      const state = calcLoanState(loan, client.rate, today);
      return sum + state.outstanding;
    }, 0);
    return {
      name: client.nickname || client.name.split(' ')[0],
      debt: totalDebt
    };
  }).filter(c => c.debt > 0).sort((a, b) => b.debt - a.debt).slice(0, 10);

  const debtChartData = {
    labels: clientDebts.map(c => c.name),
    datasets: [
      {
        label: 'Deuda Total (L)',
        data: clientDebts.map(c => c.debt),
        backgroundColor: 'rgba(79, 70, 229, 0.8)',
        borderColor: 'rgba(79, 70, 229, 1)',
        borderWidth: 2
      }
    ]
  };

  const clientInterest = clients.map(client => {
    const totalInterest = client.loans.reduce((sum, loan) => {
      const state = calcLoanState(loan, client.rate, today);
      return sum + state.accruedInterest;
    }, 0);
    return {
      name: client.nickname || client.name.split(' ')[0],
      interest: totalInterest
    };
  }).filter(c => c.interest > 0).sort((a, b) => b.interest - a.interest).slice(0, 10);

  const interestChartData = {
    labels: clientInterest.map(c => c.name),
    datasets: [
      {
        label: 'Interés Acumulado (L)',
        data: clientInterest.map(c => c.interest),
        backgroundColor: 'rgba(220, 38, 38, 0.8)',
        borderColor: 'rgba(220, 38, 38, 1)',
        borderWidth: 2
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return ` ${formatLempiras(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return 'L ' + value.toLocaleString();
          }
        }
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Top 10 - Deuda Total</h3>
        <div style={{ height: '300px' }}>
          <Bar data={debtChartData} options={options} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Top 10 - Interés Acumulado</h3>
        <div style={{ height: '300px' }}>
          <Bar data={interestChartData} options={options} />
        </div>
      </div>
    </div>
  );
}
