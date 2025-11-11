import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Mail, CheckCircle, XCircle, Loader, AlertCircle, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AcceptInvitePage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [invitationDetails, setInvitationDetails] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  console.log('AcceptInvitePage rendered with code:', code);

  useEffect(() => {
    console.log('useEffect triggered');
    checkAuthAndLoadInvitation();
  }, [code]);

  async function checkAuthAndLoadInvitation() {
    try {
      console.log('Checking auth and loading invitation for code:', code);
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      console.log('Session:', session ? 'Logged in' : 'Not logged in');

      if (code) {
        console.log('Fetching invitation with code:', code.toUpperCase());
        const { data, error: invError } = await supabase
          .from('organization_invitations')
          .select(`
            *,
            organizations:organization_id (name),
            inviter:invited_by (email)
          `)
          .eq('invitation_code', code.toUpperCase())
          .eq('status', 'pending')
          .maybeSingle();

        console.log('Invitation query result:', { data, error: invError });

        if (invError || !data) {
          console.error('Error loading invitation:', invError);
          setError('Invitación no encontrada o ya fue usada');
          setLoading(false);
          return;
        }

        if (new Date(data.expires_at) < new Date()) {
          setError('Esta invitación ha expirado');
          setLoading(false);
          return;
        }

        setInvitationDetails(data);

        if (session) {
          const userEmail = session.user.email?.toLowerCase();
          const invitedEmail = data.invited_email.toLowerCase();

          if (userEmail !== invitedEmail) {
            setError(`Esta invitación es para ${data.invited_email}. Por favor cierra sesión y accede con ese correo.`);
            setLoading(false);
            return;
          }

          await acceptInvitationAutomatically();
        } else {
          // No está logueado, mostrar formulario de registro automático
          setShowPasswordForm(true);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setError('Error al cargar la invitación: ' + (err as Error).message);
      setLoading(false);
    }
  }

  if (!code) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <XCircle className="mx-auto mb-4 text-red-600" size={64} />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Código Inválido</h1>
          <p className="text-gray-600 mb-6">No se proporcionó un código de invitación válido.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ir al Inicio
          </button>
        </div>
      </div>
    );
  }

  async function acceptInvitationAutomatically() {
    try {
      const { data, error } = await supabase.rpc('accept_invitation', {
        invitation_code_param: code?.toUpperCase()
      });

      if (error) throw error;

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        setError(data.error || 'Error al aceptar la invitación');
      }
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      setError('Error al aceptar la invitación');
    }
  }

  async function handleRegisterAndAccept(e: React.FormEvent) {
    e.preventDefault();
    
    if (!password || password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      // 1. Registrar usuario con el email de la invitación
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: invitationDetails.invited_email,
        password: password,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });

      if (signUpError) {
        // Si el error es que ya existe, intentar login
        if (signUpError.message.includes('already registered')) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: invitationDetails.invited_email,
            password: password,
          });

          if (signInError) {
            setError('Este correo ya está registrado. Por favor usa la contraseña correcta o recupera tu contraseña.');
            setProcessing(false);
            return;
          }
        } else {
          throw signUpError;
        }
      }

      // 2. Esperar un momento para que se complete la sesión
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. Aceptar la invitación
      const { data, error } = await supabase.rpc('accept_invitation', {
        invitation_code_param: code?.toUpperCase()
      });

      if (error) throw error;

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        setError(data.error || 'Error al aceptar la invitación');
      }
    } catch (err: any) {
      console.error('Error registering:', err);
      setError(err.message || 'Error al crear tu cuenta');
    } finally {
      setProcessing(false);
    }
  }

  async function handleLogin() {
    navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-gray-600 font-semibold mb-2">Cargando invitación...</p>
          <p className="text-sm text-gray-500">Código: {code}</p>
          <p className="text-xs text-gray-400 mt-4">Si esta pantalla no cambia, verifica la consola del navegador (F12)</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="mx-auto mb-4 text-green-600" size={64} />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Bienvenido!</h1>
          <p className="text-gray-600 mb-4">
            Te has unido exitosamente a la organización.
          </p>
          <p className="text-sm text-gray-500">
            Redirigiendo al dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <XCircle className="mx-auto mb-4 text-red-600" size={64} />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ir al Inicio
          </button>
        </div>
      </div>
    );
  }

  if (!isLoggedIn && invitationDetails && showPasswordForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <UserPlus className="mx-auto mb-4 text-blue-600" size={64} />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Te han invitado!
            </h1>
            <p className="text-gray-600">
              Crea tu cuenta para unirte a la organización
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900 mb-2">
              <strong>Organización:</strong> {invitationDetails.organizations?.name || 'N/A'}
            </p>
            <p className="text-sm text-blue-900 mb-2">
              <strong>Invitado por:</strong> {invitationDetails.inviter?.email || 'N/A'}
            </p>
            <p className="text-sm text-blue-900 mb-2">
              <strong>Rol:</strong> {invitationDetails.role === 'admin' ? 'Administrador' : 'Miembro'}
            </p>
            <p className="text-sm text-blue-900">
              <strong>Tu correo:</strong> {invitationDetails.invited_email}
            </p>
          </div>

          <form onSubmit={handleRegisterAndAccept} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                value={invitationDetails.invited_email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={processing}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Procesando...
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  Crear Cuenta y Unirme
                </>
              )}
            </button>

            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                ¿Ya tienes una cuenta?
              </p>
              <button
                type="button"
                onClick={handleLogin}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Iniciar sesión en su lugar
              </button>
            </div>
          </form>

          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-600 text-center">
              Al crear una cuenta, aceptarás automáticamente la invitación y te unirás a la organización.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
