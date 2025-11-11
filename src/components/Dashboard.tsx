import React from 'react';
import { TrendingUp, DollarSign, Users, AlertCircle, Calendar, Percent } from 'lucide-react';
import { Client } from '../App';

interface DashboardProps {
  clients: Client[];
  calcLoanState: (loan: any, rate: number, date: Date) => { outstanding: number; accruedInterest: number; quincenas: number };
  formatLempiras: (amount: number) => string;
}

export default function Dashboard({ clients, calcLoanState, formatLempiras }: DashboardProps) {
  const today = new Date();

  let totalPrestado = 0;
  let totalPendiente = 0;
  let totalCapitalPendiente = 0;
  let totalInteresPendiente = 0;
  let totalPrestamosActivos = 0;
  let totalInteresPagado = 0;
  let totalCapitalPagado = 0;

  const clientesConDeuda: Array<{ name: string; nickname: string; deuda: number; prestamos: number }> = [];

  clients.forEach(client => {
    let clientDeuda = 0;
    let clientPrestamosActivos = 0;

    client.loans.forEach(loan => {
      const state = calcLoanState(loan, client.rate, today);
      totalPrestado += loan.principal;
      totalPendiente += state.outstanding;

      const capitalPendiente = Math.max(0, loan.principal - loan.payments.reduce((s, p) => s + p.amount, 0));
      totalCapitalPendiente += capitalPendiente;
      totalInteresPendiente += state.accruedInterest;

      if (state.outstanding > 0) {
        totalPrestamosActivos++;
        clientPrestamosActivos++;
      }

      clientDeuda += state.outstanding;

      totalInteresPagado += (loan.interestPayments || []).reduce((sum, p) => sum + p.amount, 0);
      totalCapitalPagado += loan.payments.reduce((sum, p) => sum + p.amount, 0);
    });

    if (clientDeuda > 0) {
      clientesConDeuda.push({
        name: client.name,
        nickname: client.nickname,
        deuda: clientDeuda,
        prestamos: clientPrestamosActivos
      });
    }
  });

  clientesConDeuda.sort((a, b) => b.deuda - a.deuda);
  const top5Deudores = clientesConDeuda.slice(0, 5);

  const tasaRecuperacion = totalPrestado > 0 ? (totalCapitalPagado / totalPrestado) * 100 : 0;
  const clientesActivos = clientesConDeuda.length;
  const promedioDeuda = clientesActivos > 0 ? totalPendiente / clientesActivos : 0;

  const alertas = [];
  clients.forEach(client => {
    client.loans.forEach(loan => {
      const state = calcLoanState(loan, client.rate, today);
      if (state.quincenas >= 8 && state.outstanding > 0) {
        alertas.push({
          cliente: client.name,
          quincenas: state.quincenas,
          pendiente: state.outstanding,
          fecha: loan.date
        });
      }
    });
  });

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-3xl font-bold mb-2">Dashboard Financiero</h2>
        <p className="text-indigo-100">Resumen completo de tu cartera de préstamos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Clientes</p>
              <p className="text-3xl font-bold text-gray-900">{clients.length}</p>
              <p className="text-xs text-blue-600 mt-1">{clientesActivos} con deuda activa</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="text-blue-600" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Prestado</p>
              <p className="text-2xl font-bold text-gray-900">{formatLempiras(totalPrestado)}</p>
              <p className="text-xs text-green-600 mt-1">Capital total entregado</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="text-green-600" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Pendiente</p>
              <p className="text-2xl font-bold text-gray-900">{formatLempiras(totalPendiente)}</p>
              <p className="text-xs text-red-600 mt-1">Capital + Intereses</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <TrendingUp className="text-red-600" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Préstamos Activos</p>
              <p className="text-3xl font-bold text-gray-900">{totalPrestamosActivos}</p>
              <p className="text-xs text-purple-600 mt-1">Con saldo pendiente</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Calendar className="text-purple-600" size={28} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Percent className="text-indigo-600" size={20} />
            Métricas Financieras
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Tasa de Recuperación</span>
                <span className="text-lg font-bold text-indigo-600">{tasaRecuperacion.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(tasaRecuperacion, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Capital recuperado del total prestado</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-600">Capital Pagado</p>
                <p className="text-lg font-bold text-green-600">{formatLempiras(totalCapitalPagado)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Interés Pagado</p>
                <p className="text-lg font-bold text-orange-600">{formatLempiras(totalInteresPagado)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-600">Capital Pendiente</p>
                <p className="text-lg font-bold text-blue-600">{formatLempiras(totalCapitalPendiente)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Interés Pendiente</p>
                <p className="text-lg font-bold text-red-600">{formatLempiras(totalInteresPendiente)}</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600">Promedio de Deuda por Cliente</p>
              <p className="text-xl font-bold text-purple-600">{formatLempiras(promedioDeuda)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="text-red-600" size={20} />
            Top 5 - Mayores Deudas
          </h3>
          {top5Deudores.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay clientes con deudas activas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {top5Deudores.map((cliente, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {cliente.name}
                        {cliente.nickname && <span className="text-gray-500 font-normal"> ({cliente.nickname})</span>}
                      </p>
                      <p className="text-xs text-gray-500">{cliente.prestamos} préstamo(s) activo(s)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">{formatLempiras(cliente.deuda)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {alertas.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center gap-2">
            <AlertCircle className="text-yellow-600" size={20} />
            Alertas - Préstamos con +8 Quincenas
          </h3>
          <div className="space-y-2">
            {alertas.slice(0, 5).map((alerta, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white rounded-lg"
              >
                <div>
                  <p className="font-semibold text-gray-900">{alerta.cliente}</p>
                  <p className="text-sm text-gray-600">Fecha préstamo: {alerta.fecha}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-yellow-700 font-semibold">{alerta.quincenas} quincenas</p>
                  <p className="text-sm font-bold text-red-600">{formatLempiras(alerta.pendiente)}</p>
                </div>
              </div>
            ))}
          </div>
          {alertas.length > 5 && (
            <p className="text-sm text-gray-600 mt-3 text-center">
              Y {alertas.length - 5} alerta(s) más...
            </p>
          )}
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-md p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Gráfico de Distribución</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Capital Recuperado vs Pendiente</span>
            </div>
            <div className="flex h-8 rounded-lg overflow-hidden">
              <div
                className="bg-green-500 flex items-center justify-center text-white text-xs font-semibold"
                style={{ width: `${totalPrestado > 0 ? (totalCapitalPagado / totalPrestado) * 100 : 0}%` }}
              >
                {totalPrestado > 0 && ((totalCapitalPagado / totalPrestado) * 100).toFixed(0)}%
              </div>
              <div
                className="bg-red-500 flex items-center justify-center text-white text-xs font-semibold"
                style={{ width: `${totalPrestado > 0 ? (totalCapitalPendiente / totalPrestado) * 100 : 0}%` }}
              >
                {totalPrestado > 0 && ((totalCapitalPendiente / totalPrestado) * 100).toFixed(0)}%
              </div>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-600">
                <span className="inline-block w-3 h-3 bg-green-500 rounded mr-1"></span>
                Pagado: {formatLempiras(totalCapitalPagado)}
              </span>
              <span className="text-xs text-gray-600">
                <span className="inline-block w-3 h-3 bg-red-500 rounded mr-1"></span>
                Pendiente: {formatLempiras(totalCapitalPendiente)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
