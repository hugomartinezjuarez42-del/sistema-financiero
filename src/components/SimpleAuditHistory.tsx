import React, { useState, useEffect } from 'react';
import { History, User, Calendar, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuditLog {
  id: string;
  created_at: string;
  user_email: string;
  entity_type: string;
  entity_name: string;
  action_type: string;
  changed_fields: string[] | null;
  old_values: any;
  new_values: any;
}

export default function SimpleAuditHistory() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAuditLogs();
  }, []);

  async function loadAuditLogs() {
    try {
      setLoading(true);

      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (searchTerm) {
        query = query.or(`user_email.ilike.%${searchTerm}%,entity_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (data) setLogs(data);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    loadAuditLogs();
  }

  function getActionColor(action: string) {
    switch (action) {
      case 'INSERT': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'UPDATE': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'DELETE': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  function getActionText(action: string) {
    switch (action) {
      case 'INSERT': return 'Creó';
      case 'UPDATE': return 'Modificó';
      case 'DELETE': return 'Eliminó';
      default: return action;
    }
  }

  function getEntityTypeText(type: string) {
    switch (type) {
      case 'clients': return 'Cliente';
      case 'loans': return 'Préstamo';
      case 'payments': return 'Pago';
      default: return type;
    }
  }

  function formatFieldName(field: string): string {
    const fieldNames: Record<string, string> = {
      name: 'Nombre',
      rate: 'Tasa',
      amount: 'Monto',
      loan_date: 'Fecha préstamo',
      payment_date: 'Fecha pago',
      due_date: 'Fecha vencimiento',
      phone_number: 'Teléfono',
      id_number: 'Cédula',
      nickname: 'Apodo',
      notes: 'Notas',
      status: 'Estado',
      interest_rate: 'Tasa interés'
    };
    return fieldNames[field] || field;
  }

  function formatValue(value: any): string {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (typeof value === 'number') return value.toLocaleString('es-ES');
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
      return new Date(value).toLocaleDateString('es-ES');
    }
    return String(value);
  }


  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <p className="text-gray-600 dark:text-gray-400">Cargando historial...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <History className="text-blue-600 dark:text-blue-400" size={24} />
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Historial de Cambios
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Últimos {logs.length} cambios
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
            <Search className="text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por usuario o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              className="flex-1 bg-transparent focus:outline-none dark:text-white"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </div>

      {logs.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
          No hay cambios registrados aún
        </p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {logs.map((log) => (
            <div
              key={log.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              <div
                className="p-3 bg-gray-50 dark:bg-gray-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getActionColor(log.action_type)}`}>
                        {getActionText(log.action_type)}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {getEntityTypeText(log.entity_type)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {log.entity_name || 'Sin nombre'}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        {log.user_email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(log.created_at).toLocaleString('es-ES')}
                      </span>
                    </div>
                  </div>
                  {expandedLog === log.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              {expandedLog === log.id && (
                <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  {log.action_type === 'UPDATE' && log.changed_fields && log.changed_fields.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">
                        Campos modificados:
                      </h4>
                      {log.changed_fields.map((field) => (
                        <div key={field} className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                          <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {formatFieldName(field)}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-red-600 dark:text-red-400">
                              {formatValue(log.old_values?.[field])}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="text-green-600 dark:text-green-400">
                              {formatValue(log.new_values?.[field])}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {log.action_type === 'INSERT' && (
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <p className="font-semibold mb-1">Registro creado</p>
                      <p className="text-xs text-gray-500">
                        Se creó {getEntityTypeText(log.entity_type).toLowerCase()}: {log.entity_name}
                      </p>
                    </div>
                  )}

                  {log.action_type === 'DELETE' && (
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <p className="font-semibold mb-1">Registro eliminado</p>
                      <p className="text-xs text-gray-500">
                        Se eliminó {getEntityTypeText(log.entity_type).toLowerCase()}: {log.entity_name}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
