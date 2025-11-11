import React, { useState, useEffect } from 'react';
import { X, FileText, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import PaymentPlanPDF from './PaymentPlanPDF';

interface PaymentPlan {
  id: string;
  plan_type: string;
  original_amount: number;
  negotiated_amount: number;
  new_interest_rate: number | null;
  installments: number;
  installment_amount: number;
  frequency_days: number;
  grace_period_days: number;
  start_date: string;
  end_date: string;
  status: string;
  notes: string | null;
  created_at: string;
  loan_id: string;
}

interface PlanPayment {
  id: string;
  installment_number: number;
  due_date: string;
  amount: number;
  capital_amount?: number;
  interest_amount?: number;
  status: string;
  paid_date: string | null;
  paid_amount: number | null;
}

interface Client {
  id: string;
  name: string;
  phone_number?: string;
  identification?: string;
  address?: string;
}

interface Loan {
  id: string;
  amount: number;
  interest_rate: number;
  loan_date: string;
}

interface PaymentPlansModalProps {
  client: Client;
  loans: Loan[];
  onClose: () => void;
  organizationName?: string;
}

export default function PaymentPlansModal({
  client,
  loans,
  onClose,
  organizationName
}: PaymentPlansModalProps) {
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [planPayments, setPlanPayments] = useState<{ [key: string]: PlanPayment[] }>({});
  const [loading, setLoading] = useState(true);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentPlans();
  }, [client.id]);

  const loadPaymentPlans = async () => {
    try {
      setLoading(true);

      // Get all payment plans for this client
      const { data: plansData, error: plansError } = await supabase
        .from('payment_plans')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      if (plansError) throw plansError;

      if (plansData && plansData.length > 0) {
        setPlans(plansData);

        // Load payments for each plan
        const paymentsPromises = plansData.map(async (plan) => {
          const { data: paymentsData, error: paymentsError } = await supabase
            .from('plan_payments')
            .select('*')
            .eq('plan_id', plan.id)
            .order('installment_number', { ascending: true });

          if (paymentsError) throw paymentsError;
          return { planId: plan.id, payments: paymentsData || [] };
        });

        const paymentsResults = await Promise.all(paymentsPromises);
        const paymentsMap: { [key: string]: PlanPayment[] } = {};
        paymentsResults.forEach(({ planId, payments }) => {
          paymentsMap[planId] = payments;
        });

        setPlanPayments(paymentsMap);
      }
    } catch (error) {
      console.error('Error loading payment plans:', error);
      alert('Error al cargar los planes de pago');
    } finally {
      setLoading(false);
    }
  };

  const formatLempiras = (amount: number) => {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-HN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPlanTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'extended_term': 'Extensión de Plazo',
      'reduced_interest': 'Reducción de Interés',
      'restructure': 'Reestructuración',
      'partial_condonation': 'Condonación Parcial',
      'custom': 'Plan Personalizado'
    };
    return types[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      'active': 'bg-green-100 text-green-800',
      'completed': 'bg-blue-100 text-blue-800',
      'cancelled': 'bg-red-100 text-red-800',
      'pending': 'bg-yellow-100 text-yellow-800'
    };
    const labels: { [key: string]: string } = {
      'active': 'Activo',
      'completed': 'Completado',
      'cancelled': 'Cancelado',
      'pending': 'Pendiente'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      'paid': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'overdue': 'bg-red-100 text-red-800'
    };
    const labels: { [key: string]: string } = {
      'paid': 'Pagado',
      'pending': 'Pendiente',
      'overdue': 'Vencido'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getLoanForPlan = (plan: PaymentPlan): Loan | undefined => {
    return loans.find(loan => loan.id === plan.loan_id);
  };

  const calculateProgress = (plan: PaymentPlan) => {
    const payments = planPayments[plan.id] || [];
    const paidCount = payments.filter(p => p.status === 'paid').length;
    return Math.round((paidCount / plan.installments) * 100);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600 dark:text-gray-300">Cargando planes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Planes de Negociación
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Cliente: {client.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {plans.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No hay planes de negociación para este cliente
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {plans.map((plan) => {
                const loan = getLoanForPlan(plan);
                const payments = planPayments[plan.id] || [];
                const progress = calculateProgress(plan);
                const isExpanded = expandedPlan === plan.id;

                return (
                  <div
                    key={plan.id}
                    className="border dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-750"
                  >
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {getPlanTypeLabel(plan.plan_type)}
                            </h3>
                            {getStatusBadge(plan.status)}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Monto Negociado:</span>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {formatLempiras(plan.negotiated_amount)}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Cuotas:</span>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {plan.installments}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Por Cuota:</span>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {formatLempiras(plan.installment_amount)}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Frecuencia:</span>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {plan.frequency_days} días
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Progreso</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {isExpanded ? 'Ocultar detalles' : 'Ver detalles'}
                        </button>
                        {loan && (
                          <PaymentPlanPDF
                            plan={plan}
                            client={client}
                            loan={loan}
                            payments={payments}
                            organizationName={organizationName}
                          />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Fecha de inicio:</span>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {formatDate(plan.start_date)}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Fecha de finalización:</span>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {formatDate(plan.end_date)}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Monto original:</span>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {formatLempiras(plan.original_amount)}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Período de gracia:</span>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {plan.grace_period_days} días
                            </p>
                          </div>
                          {plan.new_interest_rate && (
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Nueva tasa de interés:</span>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {plan.new_interest_rate}%
                              </p>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Creado el:</span>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {formatDate(plan.created_at)}
                            </p>
                          </div>
                        </div>

                        {plan.notes && (
                          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              <strong>Notas:</strong> {plan.notes}
                            </p>
                          </div>
                        )}

                        {payments.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                              Calendario de Pagos
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-100 dark:bg-gray-700">
                                  <tr>
                                    <th className="px-4 py-2 text-left">#</th>
                                    <th className="px-4 py-2 text-left">Fecha</th>
                                    <th className="px-4 py-2 text-right">Capital</th>
                                    <th className="px-4 py-2 text-right">Interés</th>
                                    <th className="px-4 py-2 text-right font-bold">Total</th>
                                    <th className="px-4 py-2 text-center">Estado</th>
                                    <th className="px-4 py-2 text-left">F. Pago</th>
                                    <th className="px-4 py-2 text-right">Pagado</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-gray-700">
                                  {payments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                                      <td className="px-4 py-2">{payment.installment_number}</td>
                                      <td className="px-4 py-2">{formatDate(payment.due_date)}</td>
                                      <td className="px-4 py-2 text-right text-blue-600 font-medium">
                                        {payment.capital_amount ? formatLempiras(payment.capital_amount) : '-'}
                                      </td>
                                      <td className="px-4 py-2 text-right text-orange-600 font-medium">
                                        {payment.interest_amount ? formatLempiras(payment.interest_amount) : '-'}
                                      </td>
                                      <td className="px-4 py-2 text-right font-bold">
                                        {formatLempiras(payment.amount)}
                                      </td>
                                      <td className="px-4 py-2 text-center">
                                        {getPaymentStatusBadge(payment.status)}
                                      </td>
                                      <td className="px-4 py-2">
                                        {payment.paid_date ? formatDate(payment.paid_date) : '-'}
                                      </td>
                                      <td className="px-4 py-2 text-right">
                                        {payment.paid_amount ? formatLempiras(payment.paid_amount) : '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
