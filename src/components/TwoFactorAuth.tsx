import React, { useState, useEffect } from 'react';
import { Shield, Key, CheckCircle, AlertCircle, Copy, Smartphone } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function TwoFactorAuth() {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;

      const hasVerifiedFactor = data?.totp?.some(factor => factor.status === 'verified');
      setMfaEnabled(!!hasVerifiedFactor);
    } catch (error: any) {
      console.error('Error checking MFA status:', error);
    }
  };

  const startMFASetup = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Inversiones GVM'
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setShowSetup(true);
    } catch (error: any) {
      console.error('Error starting MFA setup:', error);
      setError(error.message || 'Error al iniciar la configuración de 2FA');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (verificationCode.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const factors = await supabase.auth.mfa.listFactors();
      if (factors.error) throw factors.error;

      const factorId = factors.data?.totp?.[factors.data.totp.length - 1]?.id;
      if (!factorId) throw new Error('No se encontró el factor de autenticación');

      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: factorId,
        code: verificationCode
      });

      if (error) throw error;

      setSuccess('Autenticación de dos factores habilitada exitosamente');
      setMfaEnabled(true);
      setShowSetup(false);
      setVerificationCode('');
    } catch (error: any) {
      console.error('Error verifying code:', error);
      setError(error.message || 'Código incorrecto. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const disableMFA = async () => {
    if (!confirm('¿Estás seguro de que deseas desactivar la autenticación de dos factores?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const factorId = factors?.totp?.[0]?.id;

      if (factorId) {
        const { error } = await supabase.auth.mfa.unenroll({ factorId });
        if (error) throw error;

        setSuccess('Autenticación de dos factores deshabilitada');
        setMfaEnabled(false);
      }
    } catch (error: any) {
      console.error('Error disabling MFA:', error);
      setError(error.message || 'Error al desactivar 2FA');
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setSuccess('Código secreto copiado al portapapeles');
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-3xl font-bold mb-2">Autenticación de Dos Factores</h2>
        <p className="text-purple-100">Protege tu cuenta con una capa adicional de seguridad</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className={`p-4 rounded-full ${mfaEnabled ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-700'}`}>
            <Shield className={mfaEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'} size={32} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Estado: {mfaEnabled ? 'Activado' : 'Desactivado'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {mfaEnabled
                ? 'Tu cuenta está protegida con 2FA'
                : 'Activa 2FA para mayor seguridad'}
            </p>
          </div>
          {mfaEnabled && (
            <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
          )}
        </div>

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-300 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-600 dark:text-green-300 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        {!showSetup && !mfaEnabled && (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">¿Qué es 2FA?</h4>
              <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
                La autenticación de dos factores añade una capa adicional de seguridad a tu cuenta.
                Necesitarás tu contraseña y un código de tu aplicación autenticadora para iniciar sesión.
              </p>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
                <li className="flex items-start gap-2">
                  <Smartphone size={16} className="mt-0.5" />
                  <span>Descarga una app como Google Authenticator o Authy</span>
                </li>
                <li className="flex items-start gap-2">
                  <Key size={16} className="mt-0.5" />
                  <span>Escanea el código QR que te proporcionaremos</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="mt-0.5" />
                  <span>Ingresa el código de 6 dígitos para verificar</span>
                </li>
              </ul>
            </div>

            <button
              onClick={startMFASetup}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 font-semibold"
            >
              <Shield size={20} />
              {loading ? 'Configurando...' : 'Activar Autenticación de Dos Factores'}
            </button>
          </div>
        )}

        {showSetup && !mfaEnabled && (
          <div className="space-y-6">
            <div className="text-center">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                Paso 1: Escanea este código QR
              </h4>
              {qrCode && (
                <div className="inline-block p-4 bg-white rounded-lg">
                  <img src={qrCode} alt="QR Code" className="w-48 h-48 mx-auto" />
                </div>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                O ingresa este código manualmente:
              </h4>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg font-mono text-sm">
                  {secret}
                </code>
                <button
                  onClick={copySecret}
                  className="p-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg transition-colors"
                  title="Copiar"
                >
                  <Copy size={20} />
                </button>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Paso 2: Ingresa el código de verificación
              </h4>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-2xl font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                maxLength={6}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSetup(false);
                  setVerificationCode('');
                  setError('');
                }}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={verifyAndEnable}
                disabled={loading || verificationCode.length !== 6}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 font-semibold"
              >
                {loading ? 'Verificando...' : 'Verificar y Activar'}
              </button>
            </div>
          </div>
        )}

        {mfaEnabled && (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
                <h4 className="font-semibold text-green-900 dark:text-green-200">
                  2FA Activado
                </h4>
              </div>
              <p className="text-sm text-green-800 dark:text-green-300">
                Tu cuenta está protegida con autenticación de dos factores.
                Necesitarás tu contraseña y el código de tu aplicación autenticadora para iniciar sesión.
              </p>
            </div>

            <button
              onClick={disableMFA}
              disabled={loading}
              className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-semibold"
            >
              {loading ? 'Desactivando...' : 'Desactivar Autenticación de Dos Factores'}
            </button>
          </div>
        )}
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2 flex items-center gap-2">
          <AlertCircle size={20} />
          Importante
        </h4>
        <ul className="text-sm text-yellow-800 dark:text-yellow-300 space-y-1 list-disc list-inside">
          <li>Guarda tu código secreto en un lugar seguro</li>
          <li>Si pierdes acceso a tu aplicación autenticadora, no podrás iniciar sesión</li>
          <li>Contacta al administrador si necesitas ayuda para recuperar tu cuenta</li>
        </ul>
      </div>
    </div>
  );
}
