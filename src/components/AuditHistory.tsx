import React, { useState, useEffect } from 'react';
import { History, Search, Filter, Download, User, Calendar, Database, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuditLog {
  id: string;
  created_at: string;
  user_email: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  action_type: string;
  changed_fields: string[] | null;
  old_values: any;
  new_values: any;
  organization_id: string;
}

export default function AuditHistory() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const logsPerPage = 20;

  useEffect(() => {
    loadAuditLogs();
  }, []);

  async function loadAuditLogs() {
    try {
      setLoading(true);

      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`user_email.ilike.%${searchTerm}%,entity_name.ilike.%${searchTerm}%`);
      }

      if (filterType !== 'all') {
        query = query.eq('entity_type', filterType);
      }

      if (filterAction !== 'all') {
        query = query.eq('action_type', filterAction);
      }

      if (startDate) {
        query = query.gte('created_at', new Date(startDate).toISOString());
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query = query.lte('created_at', end.toISOString());
      }

      query = query.limit(500);

      const { data, error } = await query;

      if (error) throw error;
      if (data) {
        setLogs(data);
        setFilteredLogs(data);
        setPage(1);
      }
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
      rate: 'Tasa de interés',
      amount: 'Monto',
      loan_date: 'Fecha de préstamo',
      payment_date: 'Fecha de pago',
      due_date: 'Fecha de vencimiento',
      phone_number: 'Teléfono',
      id_number: 'Cédula',
      nickname: 'Apodo',
      notes: 'Notas',
      status: 'Estado',
      interest_rate: 'Tasa de interés',
      residence_address: 'Dirección residencia',
      workplace: 'Lugar de trabajo',
      workplace_address: 'Dirección trabajo',
      reference_name: 'Nombre referencia',
      reference_phone: 'Teléfono referencia',
      reference_relationship: 'Relación referencia',
      monthly_salary: 'Salario mensual',
      other_income: 'Otros ingresos',
      collateral_type: 'Tipo de garantía',
      collateral_value: 'Valor de garantía',
      collateral_description: 'Descripción garantía'
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

  function exportToCSV() {
    const headers = ['Fecha', 'Usuario', 'Acción', 'Tipo', 'Registro', 'Campos Modificados'];
    const rows = filteredLogs.map(log => [
      new Date(log.created_at).toLocaleString('es-ES'),
      log.user_email,
      getActionText(log.action_type),
      getEntityTypeText(log.entity_type),
      log.entity_name || 'N/A',
      log.changed_fields?.join(', ') || 'N/A'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historial-auditoria-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <p className="text-gray-600 dark:text-gray-400">Cargando historial de auditoría...</p>
      </div>
    );
  }

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const displayLogs = filteredLogs.slice((page - 1) * logsPerPage, page * logsPerPage);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <History className="text-blue-600 dark:text-blue-400" size={24} />
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Historial de Auditoría Completo
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {filteredLogs.length} registros encontrados
          </p>
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
            <Search className="text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por usuario, nombre o ID..."
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de registro
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todos</option>
              <option value="clients">Clientes</option>
              <option value="loans">Préstamos</option>
              <option value="payments">Pagos</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Acción
            </label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todas</option>
              <option value="INSERT">Creación</option>
              <option value="UPDATE">Modificación</option>
              <option value="DELETE">Eliminación</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Desde
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Hasta
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {displayLogs.map((log) => (
          <div
            key={log.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            <div
              className="p-4 bg-gray-50 dark:bg-gray-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action_type)}`}>
                      {getActionText(log.action_type)}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {getEntityTypeText(log.entity_type)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {log.entity_name || 'Sin nombre'}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <User size={14} />
                      {log.user_email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(log.created_at).toLocaleString('es-ES')}
                    </span>
                  </div>
                </div>
                {expandedLog === log.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </div>

            {expandedLog === log.id && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                {log.action_type === 'UPDATE' && log.changed_fields && log.changed_fields.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Campos modificados:
                    </h4>
                    {log.changed_fields.map((field) => (
                      <div key={field} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {formatFieldName(field)}
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-red-600 dark:text-red-400">
                            Antes: {formatValue(log.old_values?.[field])}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="text-green-600 dark:text-green-400">
                            Después: {formatValue(log.new_values?.[field])}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {log.action_type === 'INSERT' && log.new_values && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Datos creados:
                    </h4>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {JSON.stringify(log.new_values, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {log.action_type === 'DELETE' && log.old_values && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Datos eliminados:
                    </h4>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {JSON.stringify(log.old_values, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
