import React, { useState, useEffect } from 'react';
import { User, Lock, Mail, Fingerprint } from 'lucide-react';
import PasswordRecovery from './PasswordRecovery';
import { supabase } from '../lib/supabase';

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasBiometric, setHasBiometric] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'password' | 'biometric'>('password');

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  async function checkBiometricAvailability() {
    const isSupported = window.PublicKeyCredential !== undefined && navigator.credentials !== undefined;
    setHasBiometric(isSupported);

    if (!isSupported) return;

    const lastEmail = localStorage.getItem('lastBiometricEmail');
    if (lastEmail) {
      setEmail(lastEmail);
    }
  }

  async function handleBiometricLogin() {
    setBiometricLoading(true);
    setError('');

    try {
      if (!email) {
        throw new Error('Por favor ingresa tu correo electrónico');
      }

      const { data: credentials } = await supabase
        .from('biometric_credentials')
        .select('*')
        .eq('user_email', email);

      if (!credentials || credentials.length === 0) {
        throw new Error('No tienes credenciales biométricas registradas para este correo');
      }

      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const allowCredentials = credentials.map(cred => ({
        id: Uint8Array.from(atob(cred.credential_id), c => c.charCodeAt(0)),
        type: 'public-key' as const,
      }));

      const publicKeyOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        allowCredentials,
        timeout: 60000,
        userVerification: 'required',
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyOptions,
      }) as PublicKeyCredential;

      if (!assertion) {
        throw new Error('No se pudo verificar la biometría');
      }

      const credentialId = btoa(String.fromCharCode(...new Uint8Array(assertion.rawId)));
      const credential = credentials.find(c => c.credential_id === credentialId);

      if (!credential) {
        throw new Error('Credencial no válida');
      }

      await supabase
        .from('biometric_credentials')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', credential.id);

      const storedPassword = localStorage.getItem(`biometric_pwd_${email}`);
      if (!storedPassword) {
        throw new Error('Por favor inicia sesión con contraseña primero para habilitar el acceso biométrico');
      }

      const decryptedPassword = atob(storedPassword);
      await onLogin(email, decryptedPassword);

      localStorage.setItem('lastBiometricEmail', email);

    } catch (error: any) {
      console.error('Error biometric login:', error);
      let errorMessage = 'Error al autenticar con biometría';

      if (error.name === 'NotAllowedError') {
        errorMessage = 'Autenticación cancelada o denegada';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Tu dispositivo no soporta autenticación biométrica';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setBiometricLoading(false);
    }
  }

  if (showPasswordRecovery) {
    return <PasswordRecovery onBack={() => setShowPasswordRecovery(false)} />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (isRegistering && password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (isRegistering && password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (err: any) {
      setError(err.message || 'Error al autenticar. Por favor verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <User size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sistema de Préstamos
          </h1>
          <p className="text-gray-600">
            {isRegistering ? 'Crea tu cuenta para comenzar' : 'Ingresa a tu cuenta'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="tu@email.com"
                disabled={loading}
              />
            </div>
          </div>

          {(loginMethod === 'password' || isRegistering) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {isRegistering && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {!isRegistering && hasBiometric && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Método de inicio de sesión
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setLoginMethod('password')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    loginMethod === 'password'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Lock className="mx-auto mb-1" size={24} />
                  <div className="text-sm font-medium">Contraseña</div>
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod('biometric')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    loginMethod === 'biometric'
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Fingerprint className="mx-auto mb-1" size={24} />
                  <div className="text-sm font-medium">Huella</div>
                </button>
              </div>
            </div>
          )}

          {loginMethod === 'biometric' && !isRegistering ? (
            <button
              type="button"
              onClick={handleBiometricLogin}
              disabled={biometricLoading || loading || !email}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {biometricLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Verificando huella...
                </>
              ) : (
                <>
                  <Fingerprint size={20} />
                  Entrar con huella
                </>
              )}
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Procesando...
                </span>
              ) : (
                isRegistering ? 'Crear cuenta' : 'Iniciar sesión'
              )}
            </button>
          )}
        </form>

        <div className="mt-6 space-y-3">
          <div className="text-center">
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
                setPassword('');
                setConfirmPassword('');
                setLoginMethod('password');
              }}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              disabled={loading}
            >
              {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>
          {!isRegistering && (
            <div className="text-center">
              <button
                onClick={() => setShowPasswordRecovery(true)}
                className="text-gray-600 hover:text-gray-800 text-sm"
                disabled={loading}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
