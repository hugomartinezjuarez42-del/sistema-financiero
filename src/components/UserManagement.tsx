import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, AlertCircle, CheckCircle, Eye, EyeOff, Shield, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface OrganizationUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'member'>('member');
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      setError('');

      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        setError('No estás autenticado');
        return;
      }

      const { data, error: fetchError } = await supabase.rpc('get_organization_users');

      if (fetchError) throw fetchError;

      setUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateUser() {
    if (!newEmail || !newPassword) {
      setError('Email y contraseña son requeridos');
      return;
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (!newEmail.includes('@')) {
      setError('Email inválido');
      return;
    }

    try {
      setCreating(true);
      setError('');
      setSuccess('');

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('No autenticado');
      }

      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', userData.user.id)
        .single();

      if (!orgMember) {
        throw new Error('No perteneces a ninguna organización');
      }

      if (orgMember.role !== 'admin') {
        throw new Error('Solo los administradores pueden crear usuarios');
      }

      const { data, error: rpcError } = await supabase.rpc('create_user_in_organization', {
        p_email: newEmail.trim().toLowerCase(),
        p_password: newPassword,
        p_role: newRole,
        p_organization_id: orgMember.organization_id
      });

      if (rpcError) {
        if (rpcError.message.includes('already registered') || rpcError.message.includes('already exists')) {
          throw new Error('Este email ya está registrado');
        }
        throw rpcError;
      }

      setSuccess(`Usuario ${newEmail} creado exitosamente`);
      setNewEmail('');
      setNewPassword('');
      setNewRole('member');

      await loadUsers();
    } catch (err: unknown) {
      console.error('Error creating user:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al crear usuario');
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteUser(userId: string, userEmail: string) {
    if (!confirm(`¿Estás seguro de eliminar al usuario ${userEmail}?`)) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('No autenticado');
      }

      if (userId === currentUser.user.id) {
        throw new Error('No puedes eliminarte a ti mismo');
      }

      const { error: deleteError } = await supabase.rpc('delete_user_from_organization', {
        user_id_to_delete: userId
      });

      if (deleteError) throw deleteError;

      setSuccess(`Usuario ${userEmail} eliminado correctamente`);
      await loadUsers();
    } catch (err: unknown) {
      console.error('Error deleting user:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al eliminar usuario');
      }
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <Users className="text-blue-600 dark:text-blue-400" size={24} />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Gestión de Usuarios
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400">Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <Users className="text-blue-600 dark:text-blue-400" size={24} />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Gestión de Usuarios
        </h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
          <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-2">
          <CheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-green-800 dark:text-green-200 text-sm">{success}</p>
        </div>
      )}

      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <UserPlus size={20} />
          Crear Nuevo Usuario
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value);
                setError('');
                setSuccess('');
              }}
              placeholder="usuario@ejemplo.com"
              disabled={creating}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError('');
                  setSuccess('');
                }}
                placeholder="Mínimo 6 caracteres"
                disabled={creating}
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={creating}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rol
            </label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as 'admin' | 'member')}
              disabled={creating}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
            >
              <option value="member">Miembro</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <button
            onClick={handleCreateUser}
            disabled={creating || !newEmail || !newPassword}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
          >
            {creating ? (
              <>Creando...</>
            ) : (
              <>
                <UserPlus size={20} />
                Crear Usuario
              </>
            )}
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
          Usuarios de la Organización ({users.length})
        </h3>

        {users.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No hay usuarios en la organización
          </p>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg ${
                    user.role === 'admin'
                      ? 'bg-purple-100 dark:bg-purple-900/30'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    {user.role === 'admin' ? (
                      <Shield className="text-purple-600 dark:text-purple-400" size={20} />
                    ) : (
                      <User className="text-gray-600 dark:text-gray-400" size={20} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {user.email}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {user.role === 'admin' ? 'Administrador' : 'Miembro'}
                      </span>
                      <span>•</span>
                      <span>Desde {new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteUser(user.id, user.email)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Eliminar usuario"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
