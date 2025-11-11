import React from 'react';
import { LogOut, User, Shield } from 'lucide-react';

interface HeaderProps {
  userEmail?: string;
  onLogout: () => void;
  onShowPolicies?: () => void;
}

export default function Header({ userEmail, onLogout, onShowPolicies }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <User size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Sistema de Préstamos</h1>
            <p className="text-sm text-gray-600">{userEmail}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onShowPolicies && (
            <button
              onClick={onShowPolicies}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Shield size={20} />
              <span>Políticas</span>
            </button>
          )}
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </header>
  );
}
