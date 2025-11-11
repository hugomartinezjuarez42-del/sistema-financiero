import { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, X } from 'lucide-react';
import type { Client } from '../App';
import * as api from '../lib/api';

interface CollectionManagerProps {
  client: Client;
  onClose: () => void;
  onUpdate: () => void;
}

export default function CollectionManager({ client, onClose, onUpdate }: CollectionManagerProps) {
  const [status, setStatus] = useState<'paid' | 'postponed' | 'pending'>('pending');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentTracking, setCurrentTracking] = useState<any>(null);

  useEffect(() => {
    loadCurrentTracking();
  }, []);

  async function loadCurrentTracking() {
    try {
      const tracking = await api.getCurrentCollectionTracking(client.id);
      if (tracking) {
        setCurrentTracking(tracking);
        setStatus(tracking.status);
        setAmount(tracking.amount_collected?.toString() || '');
        setNotes(tracking.notes || '');
      }
    } catch (error) {
      console.error('Error loading tracking:', error);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);

      await api.saveCollectionTracking({
        clientId: client.id,
        status,
        amountCollected: parseFloat(amount) || 0,
        notes: notes.trim()
      });

      alert('Gestión de cobro guardada');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error saving tracking:', error);
      alert('Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  const getTotalPending = () => {
    if (!client.loans || client.loans.length === 0) {
      return 0;
    }

    const totals = client.loans.reduce((acc, loan) => {
      const payments = loan.payments || [];
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const outstanding = loan.principal - totalPaid;

      return acc + outstanding;
    }, 0);

    return totals;
  };

  const totalPending = getTotalPending();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full">
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Gestionar Cobro
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              {client.name}
              {client.nickname && <span className="text-gray-600 dark:text-gray-400"> ({client.nickname})</span>}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total pendiente: <span className="font-bold text-red-600 dark:text-red-400">
                L {totalPending.toFixed(2)}
              </span>
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Estado del cobro:
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setStatus('paid')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    status === 'paid'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <CheckCircle
                    size={24}
                    className={`mx-auto mb-1 ${status === 'paid' ? 'text-green-600' : 'text-gray-400'}`}
                  />
                  <div className={`text-sm font-medium ${status === 'paid' ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    Pagó
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('postponed')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    status === 'postponed'
                      ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Clock
                    size={24}
                    className={`mx-auto mb-1 ${status === 'postponed' ? 'text-yellow-600' : 'text-gray-400'}`}
                  />
                  <div className={`text-sm font-medium ${status === 'postponed' ? 'text-yellow-700 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    Próxima
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('pending')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    status === 'pending'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <AlertCircle
                    size={24}
                    className={`mx-auto mb-1 ${status === 'pending' ? 'text-red-600' : 'text-gray-400'}`}
                  />
                  <div className={`text-sm font-medium ${status === 'pending' ? 'text-red-700 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    Pendiente
                  </div>
                </button>
              </div>
            </div>

            {status === 'paid' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Monto cobrado (opcional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="L 0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Deja en blanco si no registraste el pago específico
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notas (opcional)
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Ej: Pagó parcial, promete el resto la próxima..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {status === 'postponed' && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  💡 Este cliente aparecerá en tu lista de cobros de la próxima quincena
                </p>
              </div>
            )}

            {status === 'paid' && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✅ Cliente marcado como cobrado esta quincena
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
