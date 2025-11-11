import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Client } from '../App';

interface AdvancedSearchProps {
  clients: Client[];
  onFilter: (filtered: Client[]) => void;
  calcLoanState: (loan: any, rate: number, date: Date) => { outstanding: number; accruedInterest: number; quincenas: number };
}

type SortOption = 'name-asc' | 'name-desc' | 'debt-desc' | 'debt-asc';

export default function AdvancedSearch({ clients, onFilter, calcLoanState }: AdvancedSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minDebt: '',
    maxDebt: '',
    hasActiveLoans: 'all' as 'all' | 'yes' | 'no',
    minQuincenas: ''
  });
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filters, sortBy, clients]);

  const applyFilters = () => {
    const today = new Date();
    let filtered = [...clients];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(term) ||
        client.idNumber.toLowerCase().includes(term) ||
        client.nickname.toLowerCase().includes(term)
      );
    }

    filtered = filtered.filter(client => {
      let totalDebt = 0;
      let hasActive = false;
      let maxQuincenas = 0;

      client.loans.forEach(loan => {
        const state = calcLoanState(loan, client.rate, today);
        totalDebt += state.outstanding;
        if (state.outstanding > 0) hasActive = true;
        maxQuincenas = Math.max(maxQuincenas, state.quincenas);
      });

      if (filters.minDebt && totalDebt < parseFloat(filters.minDebt)) return false;
      if (filters.maxDebt && totalDebt > parseFloat(filters.maxDebt)) return false;
      if (filters.hasActiveLoans === 'yes' && !hasActive) return false;
      if (filters.hasActiveLoans === 'no' && hasActive) return false;
      if (filters.minQuincenas && maxQuincenas < parseFloat(filters.minQuincenas)) return false;

      return true;
    });

    filtered.sort((a, b) => {
      const today = new Date();
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'debt-desc': {
          const debtA = a.loans.reduce((sum, loan) => sum + calcLoanState(loan, a.rate, today).outstanding, 0);
          const debtB = b.loans.reduce((sum, loan) => sum + calcLoanState(loan, b.rate, today).outstanding, 0);
          return debtB - debtA;
        }
        case 'debt-asc': {
          const debtA = a.loans.reduce((sum, loan) => sum + calcLoanState(loan, a.rate, today).outstanding, 0);
          const debtB = b.loans.reduce((sum, loan) => sum + calcLoanState(loan, b.rate, today).outstanding, 0);
          return debtA - debtB;
        }
        default:
          return 0;
      }
    });

    onFilter(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      minDebt: '',
      maxDebt: '',
      hasActiveLoans: 'all',
      minQuincenas: ''
    });
    setSortBy('name-asc');
    onFilter(clients);
  };

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    filters.minDebt !== '' ||
    filters.maxDebt !== '' ||
    filters.hasActiveLoans !== 'all' ||
    filters.minQuincenas !== '' ||
    sortBy !== 'name-asc';

  return (
    <div className="bg-white rounded-xl shadow-md p-4 mb-6">
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder="Buscar por nombre, ID o apodo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            showFilters || hasActiveFilters
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <SlidersHorizontal size={18} />
          Filtros
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors flex items-center gap-2"
          >
            <X size={18} />
            Limpiar
          </button>
        )}
      </div>

      {showFilters && (
        <div className="border-t pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deuda mínima (L)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="0.00"
                value={filters.minDebt}
                onChange={(e) => setFilters({ ...filters, minDebt: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deuda máxima (L)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="0.00"
                value={filters.maxDebt}
                onChange={(e) => setFilters({ ...filters, maxDebt: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Préstamos activos</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={filters.hasActiveLoans}
                onChange={(e) => setFilters({ ...filters, hasActiveLoans: e.target.value as any })}
              >
                <option value="all">Todos</option>
                <option value="yes">Solo con préstamos activos</option>
                <option value="no">Solo sin préstamos activos</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quincenas mínimas</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="0"
                value={filters.minQuincenas}
                onChange={(e) => setFilters({ ...filters, minQuincenas: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ordenar por</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
              >
                <option value="name-asc">Nombre (A-Z)</option>
                <option value="name-desc">Nombre (Z-A)</option>
                <option value="debt-desc">Deuda (Mayor a Menor)</option>
                <option value="debt-asc">Deuda (Menor a Mayor)</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
