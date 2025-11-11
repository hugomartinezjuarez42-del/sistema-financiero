import React, { useState } from 'react';
import { AlertCircle, X, ChevronDown, ChevronUp, User } from 'lucide-react';
import { Client } from '../App';

interface UntrackedClientsDropdownProps {
  untrackedClientIds: string[];
  allClients: Client[];
  onSelectClient: (client: Client) => void;
  onDismissAll: () => void;
}

export default function UntrackedClientsDropdown({
  untrackedClientIds,
  allClients,
  onSelectClient,
  onDismissAll
}: UntrackedClientsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const untrackedClients = allClients.filter(c => untrackedClientIds.includes(c.id));

  if (untrackedClients.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors animate-pulse"
      >
        <AlertCircle size={20} />
        <span>{untrackedClients.length} clientes sin gestionar</span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20 max-h-96 overflow-y-auto">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Clientes sin Gestionar Hoy
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('¿Descartar notificación de todos los clientes sin gestionar?')) {
                    onDismissAll();
                    setIsOpen(false);
                  }
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Descartar todos"
              >
                <X size={18} />
              </button>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {untrackedClients.map(client => {
                const activeLoans = client.loans?.filter(loan => {
                  const totalPaid = loan.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
                  return totalPaid < loan.principal;
                }).length || 0;

                const totalDebt = client.loans?.reduce((sum, loan) => {
                  const paid = loan.payments?.reduce((s, p) => s + p.amount, 0) || 0;
                  return sum + (loan.principal - paid);
                }, 0) || 0;

                return (
                  <button
                    key={client.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectClient(client);
                      setIsOpen(false);
                    }}
                    className="w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-full flex-shrink-0">
                        <User size={18} className="text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {client.name}
                        </div>
                        {client.nickname && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            "{client.nickname}"
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-600 dark:text-gray-300">
                          <span className="flex items-center gap-1">
                            <span className="font-semibold">{activeLoans}</span>
                            préstamo{activeLoans !== 1 ? 's' : ''} activo{activeLoans !== 1 ? 's' : ''}
                          </span>
                          {totalDebt > 0 && (
                            <span className="text-orange-600 dark:text-orange-400 font-semibold">
                              L {totalDebt.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs text-gray-600 dark:text-gray-400">
              Click en un cliente para gestionar su cobro
            </div>
          </div>
        </>
      )}
    </div>
  );
}
