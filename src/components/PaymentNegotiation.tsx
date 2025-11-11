import React, { useState } from 'react';
import { Handshake, Calendar, DollarSign, Clock, Save, X, TrendingDown, FileText, Percent } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Client } from '../App';

interface PaymentNegotiationProps {
  client: Client;
  loan: any;
  formatLempiras: (amount: number) => string;
  onClose: () => void;
  onSuccess: () => void;
}

interface PaymentScheduleItem {
  installment: number;
  dueDate: string;
  capitalAmount: number;
  interestAmount: number;
  totalAmount: number;
}

export default function PaymentNegotiation({ client, loan, formatLempiras, onClose, onSuccess }: PaymentNegotiationProps) {
  const [planType, setPlanType] = useState<'custom' | 'reduced_interest' | 'grace_period' | 'restructure'>('custom');
  const [negotiatedAmount, setNegotiatedAmount] = useState(loan.principal);
  const [interestRatePerPayment, setInterestRatePerPayment] = useState(2);
  const [installments, setInstallments] = useState(4);
  const [frequencyDays, setFrequencyDays] = useState(15);
  const [gracePeriodDays, setGracePeriodDays] = useState(0);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const calculateEndDate = () => {
    const start = new Date(startDate);
    start.setDate(start.getDate() + gracePeriodDays + (installments * frequencyDays));
    return start.toISOString().split('T')[0];
  };

  const calculatePaymentBreakdown = (): PaymentScheduleItem[] => {
    if (installments === 0 || negotiatedAmount === 0) return [];

    const schedule: PaymentScheduleItem[] = [];
    const start = new Date(startDate);
    start.setDate(start.getDate() + gracePeriodDays);

    // Capital por cuota (se divide el monto negociado entre las cuotas)
    const capitalPerPayment = negotiatedAmount / installments;

    // Interés por cuota (se calcula sobre el capital de cada cuota)
    const interestPerPayment = capitalPerPayment * (interestRatePerPayment / 100);

    // Total por cuota (capital + interés)
    const totalPerPayment = capitalPerPayment + interestPerPayment;

    for (let i = 0; i < installments; i++) {
      const dueDate = new Date(start);
      dueDate.setDate(dueDate.getDate() + (i * frequencyDays));

      schedule.push({
        installment: i + 1,
        dueDate: dueDate.toISOString().split('T')[0],
        capitalAmount: capitalPerPayment,
        interestAmount: interestPerPayment,
        totalAmount: totalPerPayment
      });
    }

    return schedule;
  };

  const getTotals = () => {
    const schedule = calculatePaymentBreakdown();
    const totalCapital = schedule.reduce((sum, p) => sum + p.capitalAmount, 0);
    const totalInterest = schedule.reduce((sum, p) => sum + p.interestAmount, 0);
    const totalAmount = schedule.reduce((sum, p) => sum + p.totalAmount, 0);

    return { totalCapital, totalInterest, totalAmount };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data: orgData } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!orgData?.organization_id) throw new Error('No organization found');

      const schedule = calculatePaymentBreakdown();
      if (schedule.length === 0) {
        throw new Error('No se pudo generar el calendario de pagos');
      }

      const totalPayment = schedule[0].totalAmount;
      const endDate = calculateEndDate();

      // Crear el plan de pago
      const { data: plan, error: planError } = await supabase
        .from('payment_plans')
        .insert({
          loan_id: loan.id,
          client_id: client.id,
          user_id: user.id,
          organization_id: orgData.organization_id,
          plan_type: planType,
          original_amount: loan.principal,
          negotiated_amount: negotiatedAmount,
          new_interest_rate: interestRatePerPayment,
          installments: installments,
          installment_amount: totalPayment,
          frequency_days: frequencyDays,
          grace_period_days: gracePeriodDays,
          start_date: startDate,
          end_date: endDate,
          status: 'active',
          notes: notes
        })
        .select()
        .single();

      if (planError) throw planError;

      // Crear los pagos individuales con desglose de capital e interés
      const paymentsToInsert = schedule.map(s => ({
        plan_id: plan.id,
        organization_id: orgData.organization_id,
        installment_number: s.installment,
        due_date: s.dueDate,
        amount: s.totalAmount,
        capital_amount: s.capitalAmount,
        interest_amount: s.interestAmount,
        status: 'pending'
      }));

      const { error: paymentsError } = await supabase
        .from('plan_payments')
        .insert(paymentsToInsert);

      if (paymentsError) throw paymentsError;

      alert('Plan de pago creado exitosamente con desglose de capital e interés');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating payment plan:', error);
      alert('Error al crear el plan de pago: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const schedule = calculatePaymentBreakdown();
  const totals = getTotals();
  const savings = loan.principal - negotiatedAmount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Handshake size={32} />
              <div>
                <h2 className="text-2xl font-bold">Negociación de Pago</h2>
                <p className="text-blue-100">Cliente: {client.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Información del Préstamo Original</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-300">Capital Original:</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-white">{formatLempiras(loan.principal)}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-300">Tasa Actual:</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-white">{client.rate}%</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-300">Fecha del Préstamo:</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-white">{loan.date}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Plan
            </label>
            <select
              value={planType}
              onChange={(e) => setPlanType(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="custom">Plan Personalizado</option>
              <option value="reduced_interest">Interés Reducido</option>
              <option value="grace_period">Período de Gracia</option>
              <option value="restructure">Reestructuración</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <DollarSign className="inline" size={16} /> Monto Negociado (Capital)
              </label>
              <input
                type="number"
                value={negotiatedAmount}
                onChange={(e) => setNegotiatedAmount(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Percent className="inline" size={16} /> Tasa de Interés por Cuota (%)
              </label>
              <input
                type="number"
                value={interestRatePerPayment}
                onChange={(e) => setInterestRatePerPayment(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                min="0"
                max="100"
                step="0.1"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Este porcentaje se aplicará sobre el capital de cada cuota
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Número de Cuotas
              </label>
              <input
                type="number"
                value={installments}
                onChange={(e) => setInstallments(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="inline" size={16} /> Frecuencia (días)
              </label>
              <input
                type="number"
                value={frequencyDays}
                onChange={(e) => setFrequencyDays(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Clock className="inline" size={16} /> Período de Gracia (días)
              </label>
              <input
                type="number"
                value={gracePeriodDays}
                onChange={(e) => setGracePeriodDays(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de Inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="inline" size={16} /> Notas
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={3}
              placeholder="Detalles de la negociación..."
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <DollarSign className="text-blue-600" />
              Resumen del Plan
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Cuota por Pago:</p>
                <p className="text-lg font-bold text-blue-600">{formatLempiras(schedule[0]?.totalAmount || 0)}</p>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <div>Capital: {formatLempiras(schedule[0]?.capitalAmount || 0)}</div>
                  <div>Interés: {formatLempiras(schedule[0]?.interestAmount || 0)}</div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Total Capital:</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{formatLempiras(totals.totalCapital)}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Total Interés:</p>
                <p className="text-lg font-bold text-orange-600">{formatLempiras(totals.totalInterest)}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Total a Pagar:</p>
                <p className="text-lg font-bold text-green-600">{formatLempiras(totals.totalAmount)}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800 grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-xs">Ahorro en Capital:</p>
                <p className="text-md font-bold text-green-600">{formatLempiras(savings)}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-xs">Fecha Final:</p>
                <p className="text-md font-bold text-gray-900 dark:text-white">{calculateEndDate()}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Calendario de Pagos</h3>
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-200 dark:bg-gray-600 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-gray-900 dark:text-white">Cuota</th>
                    <th className="px-4 py-2 text-left text-gray-900 dark:text-white">Fecha</th>
                    <th className="px-4 py-2 text-right text-gray-900 dark:text-white">Capital</th>
                    <th className="px-4 py-2 text-right text-gray-900 dark:text-white">Interés</th>
                    <th className="px-4 py-2 text-right text-gray-900 dark:text-white font-bold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {schedule.map((payment) => (
                    <tr key={payment.installment} className="hover:bg-gray-100 dark:hover:bg-gray-600">
                      <td className="px-4 py-3 text-gray-900 dark:text-white">#{payment.installment}</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">{payment.dueDate}</td>
                      <td className="px-4 py-3 text-right text-blue-600 font-medium">
                        {formatLempiras(payment.capitalAmount)}
                      </td>
                      <td className="px-4 py-3 text-right text-orange-600 font-medium">
                        {formatLempiras(payment.interestAmount)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800">
                        {formatLempiras(payment.totalAmount)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-blue-100 dark:bg-blue-900 font-bold">
                    <td colSpan={2} className="px-4 py-3 text-gray-900 dark:text-white">TOTALES:</td>
                    <td className="px-4 py-3 text-right text-blue-600">{formatLempiras(totals.totalCapital)}</td>
                    <td className="px-4 py-3 text-right text-orange-600">{formatLempiras(totals.totalInterest)}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{formatLempiras(totals.totalAmount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t dark:border-gray-600">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              <Save size={18} />
              {loading ? 'Guardando...' : 'Crear Plan de Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
