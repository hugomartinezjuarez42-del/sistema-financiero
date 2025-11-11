import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Send, X, Calendar, MessageSquare, CheckCircle, XCircle, Clock, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Loan } from '../App';

interface Reminder {
  id: string;
  client_id: string;
  reminder_date: string;
  message: string;
  status: 'pending' | 'sent' | 'cancelled';
  created_at: string;
  sent_at?: string;
  notes?: string;
}

interface WhatsAppRemindersProps {
  clientId: string;
  clientName: string;
  clientPhone?: string;
  loans?: Loan[];
  clientRate?: number;
  formatLempiras: (amount: number) => string;
}

export default function WhatsAppReminders({ clientId, clientName, clientPhone, loans = [], clientRate = 14, formatLempiras }: WhatsAppRemindersProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    message: '',
    notes: ''
  });

  const calculateLoanSummary = () => {
    try {
      if (!loans || loans.length === 0) return null;

      const activeLoan = loans[0];
      if (!activeLoan || !activeLoan.date || !activeLoan.principal) return null;

      const loanStartDate = new Date(activeLoan.date);
      const today = new Date();

      const daysSinceLoan = Math.floor((today.getTime() - loanStartDate.getTime()) / (1000 * 60 * 60 * 24));
      const quincenasElapsed = Math.max(0, Math.floor(daysSinceLoan / 15));

      const interestPerQuincena = (activeLoan.principal * clientRate) / 100;
      const totalInterestDue = interestPerQuincena * quincenasElapsed;
      const totalInterestPaid = (activeLoan.interestPayments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
      const interestPending = Math.max(0, totalInterestDue - totalInterestPaid);

      const totalCapitalPaid = (activeLoan.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
      const capitalRemaining = Math.max(0, activeLoan.principal - totalCapitalPaid);

      let lastPaymentDate = loanStartDate;
      if (activeLoan.interestPayments && activeLoan.interestPayments.length > 0) {
        const dates = activeLoan.interestPayments
          .map(p => new Date(p.date).getTime())
          .filter(t => !isNaN(t));
        if (dates.length > 0) {
          lastPaymentDate = new Date(Math.max(...dates));
        }
      }

      const daysSinceLastPayment = Math.floor((today.getTime() - lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        capitalRemaining,
        interestPending,
        daysSinceLastPayment,
        quincenasElapsed,
        interestPerQuincena,
        loanDate: activeLoan.date
      };
    } catch (error) {
      console.error('Error calculating loan summary:', error);
      return null;
    }
  };

  const generateAutoMessage = () => {
    const summary = calculateLoanSummary();
    if (!summary) {
      return `Hola ${clientName}, le recordamos que tiene un pago pendiente. ¡Gracias por su atención!`;
    }

    const { capitalRemaining, interestPending, daysSinceLastPayment, interestPerQuincena, quincenasElapsed } = summary;

    const quincenasPendientes = interestPending > 0
      ? Math.ceil(interestPending / interestPerQuincena)
      : 0;

    let message = `Hola ${clientName}, saludos de INVERSIONES GVM.\n\n`;

    if (daysSinceLastPayment > 15) {
      message += `⏰ Notamos que han pasado ${daysSinceLastPayment} días desde su último pago.\n\n`;
    }

    message += `📊 *Estado de su préstamo:*\n`;
    message += `• Capital pendiente: ${formatLempiras(capitalRemaining)}\n`;
    message += `• Quincenas transcurridas: ${quincenasElapsed}\n`;
    message += `• Quincenas a deber: ${quincenasPendientes}\n`;
    message += `• Interés acumulado: ${formatLempiras(interestPending)}\n`;
    message += `• Pago de interés quincenal: ${formatLempiras(interestPerQuincena)}\n\n`;

    if (quincenasPendientes > 2) {
      message += `⚠️ Su cuenta tiene ${quincenasPendientes} quincenas pendientes. Le recomendamos ponerse al día.\n\n`;
    } else if (quincenasPendientes > 0) {
      message += `💡 Tiene ${quincenasPendientes} quincena${quincenasPendientes > 1 ? 's' : ''} pendiente${quincenasPendientes > 1 ? 's' : ''} de pago.\n\n`;
    }

    message += `Por favor, realice su pago a la brevedad posible.\n\n`;
    message += `Gracias por su confianza. 🙏`;

    return message;
  };

  useEffect(() => {
    loadReminders();
  }, [clientId]);

  const loadReminders = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_reminders')
        .select('*')
        .eq('client_id', clientId)
        .order('reminder_date', { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const createReminder = async () => {
    if (!formData.date || !formData.message) {
      alert('Por favor complete la fecha y el mensaje');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('whatsapp_reminders')
        .insert({
          client_id: clientId,
          reminder_date: formData.date,
          message: formData.message,
          notes: formData.notes || null,
          created_by: user?.id
        });

      if (error) throw error;

      alert('Recordatorio creado exitosamente');
      setFormData({
        date: '',
        message: '',
        notes: ''
      });
      setShowForm(false);
      loadReminders();
    } catch (error) {
      console.error('Error creating reminder:', error);
      alert('Error al crear el recordatorio');
    }
  };

  const sendReminder = async (reminder: Reminder) => {
    if (!clientPhone) {
      alert('Este cliente no tiene número de teléfono registrado');
      return;
    }

    const phone = clientPhone.replace(/\D/g, '');
    const message = encodeURIComponent(reminder.message);
    const whatsappUrl = `https://wa.me/504${phone}?text=${message}`;

    try {
      const { error } = await supabase
        .from('whatsapp_reminders')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', reminder.id);

      if (error) throw error;

      window.open(whatsappUrl, '_blank');
      loadReminders();
    } catch (error) {
      console.error('Error updating reminder status:', error);
      alert('Error al actualizar el estado del recordatorio');
    }
  };

  const cancelReminder = async (reminderId: string) => {
    if (!confirm('¿Cancelar este recordatorio?')) return;

    try {
      const { error } = await supabase
        .from('whatsapp_reminders')
        .update({ status: 'cancelled' })
        .eq('id', reminderId);

      if (error) throw error;

      alert('Recordatorio cancelado');
      loadReminders();
    } catch (error) {
      console.error('Error cancelling reminder:', error);
      alert('Error al cancelar el recordatorio');
    }
  };

  const deleteReminder = async (reminderId: string) => {
    if (!confirm('¿Eliminar este recordatorio?')) return;

    try {
      const { error } = await supabase
        .from('whatsapp_reminders')
        .delete()
        .eq('id', reminderId);

      if (error) throw error;

      alert('Recordatorio eliminado');
      loadReminders();
    } catch (error) {
      console.error('Error deleting reminder:', error);
      alert('Error al eliminar el recordatorio');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('es-HN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="text-green-600" size={18} />;
      case 'cancelled':
        return <XCircle className="text-red-600" size={18} />;
      default:
        return <Clock className="text-yellow-600" size={18} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'sent':
        return 'Enviado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Pendiente';
    }
  };

  const pendingReminders = reminders.filter(r => r.status === 'pending');
  const completedReminders = reminders.filter(r => r.status !== 'pending');

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Bell className="text-green-600" size={28} />
          Recordatorios WhatsApp
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Nuevo Recordatorio
        </button>
      </div>

      {!clientPhone && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-yellow-800 text-sm">
            ⚠️ Este cliente no tiene número de teléfono registrado. Agrégalo para poder enviar recordatorios.
          </p>
        </div>
      )}

      {showForm && (
        <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-6 mb-6 border border-green-200">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Plus className="text-green-600" size={20} />
            Crear Recordatorio
          </h4>

          <div className="space-y-4">
            <button
              onClick={() => setFormData({ ...formData, message: generateAutoMessage() })}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles size={18} />
              Generar Mensaje Automático con Detalles del Préstamo
            </button>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha del Recordatorio
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                placeholder="Escribe el mensaje del recordatorio..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas Internas (opcional)
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas para uso interno..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={createReminder}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Crear Recordatorio
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : reminders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Bell className="mx-auto text-gray-400 mb-3" size={48} />
          <p className="text-gray-500">No hay recordatorios programados</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingReminders.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Clock className="text-yellow-600" size={18} />
                Recordatorios Pendientes ({pendingReminders.length})
              </h4>
              <div className="space-y-2">
                {pendingReminders.map(reminder => (
                  <div
                    key={reminder.id}
                    className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="text-gray-600" size={16} />
                          <span className="font-semibold text-gray-900">
                            {formatDate(reminder.reminder_date)}
                          </span>
                          {getStatusIcon(reminder.status)}
                          <span className="text-sm text-gray-600">{getStatusLabel(reminder.status)}</span>
                        </div>
                        <div className="flex items-start gap-2 text-gray-700 mb-2">
                          <MessageSquare className="text-gray-500 mt-0.5" size={16} />
                          <p className="text-sm flex-1">{reminder.message}</p>
                        </div>
                        {reminder.notes && (
                          <p className="text-xs text-gray-500 mt-1">📝 {reminder.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => sendReminder(reminder)}
                          disabled={!clientPhone}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Enviar ahora"
                        >
                          <Send size={18} />
                        </button>
                        <button
                          onClick={() => cancelReminder(reminder.id)}
                          className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                          title="Cancelar"
                        >
                          <XCircle size={18} />
                        </button>
                        <button
                          onClick={() => deleteReminder(reminder.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {completedReminders.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <CheckCircle className="text-gray-600" size={18} />
                Historial ({completedReminders.length})
              </h4>
              <div className="space-y-2">
                {completedReminders.map(reminder => (
                  <div
                    key={reminder.id}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="text-gray-600" size={16} />
                          <span className="font-semibold text-gray-900">
                            {formatDate(reminder.reminder_date)}
                          </span>
                          {getStatusIcon(reminder.status)}
                          <span className="text-sm text-gray-600">{getStatusLabel(reminder.status)}</span>
                        </div>
                        <div className="flex items-start gap-2 text-gray-700 mb-2">
                          <MessageSquare className="text-gray-500 mt-0.5" size={16} />
                          <p className="text-sm flex-1">{reminder.message}</p>
                        </div>
                        {reminder.sent_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            📤 Enviado: {new Date(reminder.sent_at).toLocaleString('es-HN')}
                          </p>
                        )}
                        {reminder.notes && (
                          <p className="text-xs text-gray-500 mt-1">📝 {reminder.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => deleteReminder(reminder.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
