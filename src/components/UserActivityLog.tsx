import React, { useState, useEffect } from 'react';
import { History, Filter, Download, Search, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuditLog {
  id: string;
  action_type: string;
  entity_type: string;
  entity_name: string;
  old_values: any;
  new_values: any;
  created_at: string;
}

export default function UserActivityLog() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'create' | 'update' | 'delete'>('all');
  const [filterEntity, setFilterEntity] = useState<'all' | 'client' | 'loan' | 'payment'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filterType !== 'all' && log.action_type !== filterType) return false;
    if (filterEntity !== 'all' && log.entity_type !== filterEntity) return false;
    if (searchTerm && !log.entity_name.toLowerCase().includes(searchTerm.toLowerCase())) return false;

    if (startDate) {
      const logDate = new Date(log.created_at);
      const start = new Date(startDate);
      if (logDate < start) return false;
    }

    if (endDate) {
      const logDate = new Date(log.created_at);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (logDate > end) return false;
    }

    return true;
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create':
        return 'Creación';
      case 'update':
        return 'Actualización';
      case 'delete':
        return 'Eliminación';
      default:
        return action;
    }
  };

  const getEntityLabel = (entity: string) => {
    switch (entity) {
      case 'client':
        return 'Cliente';
      case 'loan':
        return 'Préstamo';
      case 'payment':
        return 'Pago';
      default:
        return entity;
    }
  };

  const exportToCSV = () => {
    const headers = ['Fecha', 'Acción', 'Tipo', 'Nombre', 'Detalles'];
    const rows = filteredLogs.map(log => [
      new Date(log.created_at).toLocaleString('es-HN'),
      getActionLabel(log.action_type),
      getEntityLabel(log.entity_type),
      log.entity_name,
      JSON.stringify(log.new_values || {})
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `registro_actividad_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const renderChanges = (log: AuditLog) => {
    if (log.action_type === 'create') {
      return (
        <div className="text-sm text-gray-600">
          <span className="font-semibold">Nuevo registro creado</span>
        </div>
      );
    }

    if (log.action_type === 'delete') {
      return (
        <div className="text-sm text-gray-600">
          <span className="font-semibold">Registro eliminado</span>
        </div>
      );
    }

    if (log.action_type === 'update' && log.old_values && log.new_values) {
      const changes = Object.keys(log.new_values).filter(
        key => JSON.stringify(log.old_values[key]) !== JSON.stringify(log.new_values[key])
      );

      if (changes.length === 0) return null;

      return (
        <div className="text-xs text-gray-600 mt-2 space-y-1">
          {changes.slice(0, 3).map(key => (
            <div key={key} className="flex gap-2">
              <span className="font-semibold">{key}:</span>
              <span className="text-red-600">{String(log.old_values[key] || '-')}</span>
              <span>→</span>
              <span className="text-green-600">{String(log.new_values[key] || '-')}</span>
            </div>
          ))}
          {changes.length > 3 && (
            <div className="text-gray-500 italic">+{changes.length - 3} cambios más...</div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-3xl font-bold mb-2">Registro de Actividad</h2>
        <p className="text-gray-300">Historial completo de cambios en el sistema</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Filter className="inline" size={16} /> Tipo de Acción
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas</option>
              <option value="create">Creación</option>
              <option value="update">Actualización</option>
              <option value="delete">Eliminación</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Entidad
            </label>
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas</option>
              <option value="client">Clientes</option>
              <option value="loan">Préstamos</option>
              <option value="payment">Pagos</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="inline" size={16} /> Fecha Inicio
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="inline" size={16} /> Fecha Fin
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Search className="inline" size={16} /> Buscar
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nombre..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Mostrando {filteredLogs.length} de {logs.length} registros
          </p>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download size={18} />
            Exportar CSV
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando registros...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <History className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500 dark:text-gray-400">No se encontraron registros</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getActionColor(log.action_type)}`}>
                        {getActionLabel(log.action_type)}
                      </span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {getEntityLabel(log.entity_type)}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {log.entity_name}
                      </span>
                    </div>
                    {renderChanges(log)}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(log.created_at).toLocaleDateString('es-HN')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(log.created_at).toLocaleTimeString('es-HN')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
