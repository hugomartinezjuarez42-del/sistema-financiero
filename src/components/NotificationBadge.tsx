import React, { useState, useEffect } from 'react';
import { Bell, AlertCircle, Clock, X, Check } from 'lucide-react';
import { Client } from '../App';
import { supabase } from '../lib/supabase';

interface NotificationBadgeProps {
  clients: Client[];
  calcLoanState: (loan: any, rate: number, date: Date) => any;
}

interface ClientAlert {
  clientId: string;
  clientName: string;
  quincenas: number;
  level: 'critical' | 'warning' | 'info';
}

export default function NotificationBadge({ clients, calcLoanState }: NotificationBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const today = new Date();

  useEffect(() => {
    loadDismissals();
  }, []);

  const loadDismissals = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_dismissals')
        .select('client_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (!error && data) {
        setDismissedIds(new Set(data.map(d => d.client_id)));
      }
    } catch (err) {
      console.error('Error loading dismissals:', err);
    }
  };

  const dismissAlert = async (clientId: string) => {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return;

      await supabase
        .from('notification_dismissals')
        .upsert({
          user_id: userId,
          client_id: clientId
        });

      setDismissedIds(prev => new Set([...prev, clientId]));
    } catch (err) {
      console.error('Error dismissing alert:', err);
    }
  };

  const clientAlerts: ClientAlert[] = [];

  clients.forEach(client => {
    if (dismissedIds.has(client.id)) return;

    client.loans.forEach(loan => {
      const state = calcLoanState(loan, client.rate, today);
      if (state.outstanding > 0) {
        if (state.quincenas >= 12) {
          clientAlerts.push({
            clientId: client.id,
            clientName: client.name,
            quincenas: state.quincenas,
            level: 'critical'
          });
        } else if (state.quincenas >= 8) {
          clientAlerts.push({
            clientId: client.id,
            clientName: client.name,
            quincenas: state.quincenas,
            level: 'warning'
          });
        } else if (state.quincenas >= 5) {
          clientAlerts.push({
            clientId: client.id,
            clientName: client.name,
            quincenas: state.quincenas,
            level: 'info'
          });
        }
      }
    });
  });

  const alerts = {
    critical: clientAlerts.filter(a => a.level === 'critical'),
    warning: clientAlerts.filter(a => a.level === 'warning'),
    info: clientAlerts.filter(a => a.level === 'info')
  };

  const totalAlerts = clientAlerts.length;

  if (totalAlerts === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <Bell size={24} className="text-gray-700" />
        {totalAlerts > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {totalAlerts > 9 ? '9+' : totalAlerts}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Bell size={18} />
                  Notificaciones ({totalAlerts})
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

          {alerts.critical.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-2 text-red-600 font-medium mb-2">
                <AlertCircle size={16} />
                Crítico ({alerts.critical.length})
              </div>
              <div className="space-y-2 ml-6">
                {alerts.critical.slice(0, 3).map((alert, i) => (
                  <div key={i} className="flex items-center justify-between text-sm text-gray-700">
                    <span>{alert.clientName}: {alert.quincenas} quincenas</span>
                    <button
                      onClick={() => dismissAlert(alert.clientId)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title="Marcar como visto"
                    >
                      <Check size={14} className="text-green-600" />
                    </button>
                  </div>
                ))}
                {alerts.critical.length > 3 && (
                  <p className="text-xs text-gray-500">+{alerts.critical.length - 3} más</p>
                )}
              </div>
            </div>
          )}

          {alerts.warning.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-2 text-yellow-600 font-medium mb-2">
                <Clock size={16} />
                Advertencia ({alerts.warning.length})
              </div>
              <div className="space-y-2 ml-6">
                {alerts.warning.slice(0, 3).map((alert, i) => (
                  <div key={i} className="flex items-center justify-between text-sm text-gray-700">
                    <span>{alert.clientName}: {alert.quincenas} quincenas</span>
                    <button
                      onClick={() => dismissAlert(alert.clientId)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title="Marcar como visto"
                    >
                      <Check size={14} className="text-green-600" />
                    </button>
                  </div>
                ))}
                {alerts.warning.length > 3 && (
                  <p className="text-xs text-gray-500">+{alerts.warning.length - 3} más</p>
                )}
              </div>
            </div>
          )}

          {alerts.info.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-blue-600 font-medium mb-2">
                <Bell size={16} />
                Información ({alerts.info.length})
              </div>
              <div className="space-y-2 ml-6">
                {alerts.info.slice(0, 2).map((alert, i) => (
                  <div key={i} className="flex items-center justify-between text-sm text-gray-700">
                    <span>{alert.clientName}: {alert.quincenas} quincenas</span>
                    <button
                      onClick={() => dismissAlert(alert.clientId)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title="Marcar como visto"
                    >
                      <Check size={14} className="text-green-600" />
                    </button>
                  </div>
                ))}
                {alerts.info.length > 2 && (
                  <p className="text-xs text-gray-500">+{alerts.info.length - 2} más</p>
                )}
              </div>
            </div>
          )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
