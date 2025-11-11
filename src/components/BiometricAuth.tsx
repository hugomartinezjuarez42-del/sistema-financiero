import { useState, useEffect } from 'react';
import { Fingerprint, Smartphone, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface BiometricCredential {
  id: string;
  device_name: string;
  created_at: string;
  last_used_at: string;
}

export default function BiometricAuth() {
  const [isSupported, setIsSupported] = useState(false);
  const [credentials, setCredentials] = useState<BiometricCredential[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deviceName, setDeviceName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  useEffect(() => {
    checkBiometricSupport();
    loadCredentials();
  }, []);

  async function checkBiometricSupport() {
    const supported = window.PublicKeyCredential !== undefined &&
                     navigator.credentials !== undefined;
    setIsSupported(supported);
  }

  async function loadCredentials() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('biometric_credentials')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCredentials(data || []);
    } catch (error) {
      console.error('Error loading credentials:', error);
    }
  }

  async function registerBiometric() {
    if (!deviceName.trim()) {
      setMessage({ type: 'error', text: 'Por favor ingresa un nombre para este dispositivo' });
      return;
    }

    if (!currentPassword.trim()) {
      setMessage({ type: 'error', text: 'Por favor ingresa tu contraseña actual' });
      return;
    }

    setIsRegistering(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      });

      if (authError) {
        throw new Error('Contraseña incorrecta');
      }

      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'Sistema de Gestión Financiera',
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(user.id),
          name: user.email || 'usuario',
          displayName: user.email || 'Usuario',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyOptions,
      }) as PublicKeyCredential;

      if (!credential) throw new Error('No se pudo crear la credencial');

      const response = credential.response as AuthenticatorAttestationResponse;

      const { error } = await supabase
        .from('biometric_credentials')
        .insert({
          user_id: user.id,
          user_email: user.email,
          credential_id: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
          public_key: btoa(String.fromCharCode(...new Uint8Array(response.attestationObject))),
          device_name: deviceName.trim(),
        });

      if (error) throw error;

      localStorage.setItem(`biometric_pwd_${user.email}`, btoa(currentPassword));
      localStorage.setItem('lastBiometricEmail', user.email!);

      setMessage({ type: 'success', text: 'Biometría registrada exitosamente. Ahora puedes usar tu huella para iniciar sesión.' });
      setDeviceName('');
      setCurrentPassword('');
      await loadCredentials();
    } catch (error: any) {
      console.error('Error registering biometric:', error);
      let errorMessage = 'Error al registrar biometría';

      if (error.name === 'NotAllowedError') {
        errorMessage = 'Permiso denegado. Por favor autoriza el uso de biometría.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Tu dispositivo no soporta autenticación biométrica.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsRegistering(false);
    }
  }

  async function deleteCredential(credentialId: string) {
    if (!confirm('¿Estás seguro de eliminar esta credencial biométrica?')) return;

    try {
      const { error } = await supabase
        .from('biometric_credentials')
        .delete()
        .eq('id', credentialId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Credencial eliminada' });
      await loadCredentials();
    } catch (error) {
      console.error('Error deleting credential:', error);
      setMessage({ type: 'error', text: 'Error al eliminar credencial' });
    }
  }

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 text-yellow-800">
          <AlertCircle size={20} />
          <p className="text-sm">
            Tu navegador no soporta autenticación biométrica.
            Intenta usar Chrome, Safari, o Edge en un dispositivo compatible.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Fingerprint className="text-blue-600" size={24} />
          <h3 className="text-lg font-semibold">Autenticación Biométrica</h3>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Registra tu huella digital o Face ID para iniciar sesión de forma rápida y segura.
            </p>

            <div className="space-y-3 mb-4">
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="Nombre del dispositivo (ej: iPhone de Juan)"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Tu contraseña actual"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={registerBiometric}
                disabled={isRegistering || !deviceName.trim() || !currentPassword.trim()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Smartphone size={18} />
                {isRegistering ? 'Registrando...' : 'Registrar'}
              </button>
            </div>
          </div>

          {credentials.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Dispositivos Registrados:</h4>
              <div className="space-y-2">
                {credentials.map((cred) => (
                  <div
                    key={cred.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <Fingerprint size={18} className="text-gray-600" />
                      <div>
                        <p className="font-medium text-sm">{cred.device_name}</p>
                        <p className="text-xs text-gray-500">
                          Registrado: {new Date(cred.created_at).toLocaleDateString()}
                        </p>
                        {cred.last_used_at && (
                          <p className="text-xs text-gray-500">
                            Último uso: {new Date(cred.last_used_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteCredential(cred.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar credencial"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
