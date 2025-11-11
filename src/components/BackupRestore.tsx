import React, { useRef } from 'react';
import { Download, Upload, Database } from 'lucide-react';
import { Client } from '../App';

interface BackupRestoreProps {
  clients: Client[];
  onRestore: (clients: Client[]) => void;
  onClose: () => void;
}

export default function BackupRestore({ clients, onRestore, onClose }: BackupRestoreProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = () => {
    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: clients
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_prestamos_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      if (!backup.data || !Array.isArray(backup.data)) {
        alert('Archivo de respaldo inválido');
        return;
      }

      const confirm = window.confirm(
        `¿Estás seguro de restaurar este respaldo?\n\n` +
        `Fecha del respaldo: ${new Date(backup.timestamp).toLocaleString()}\n` +
        `Clientes: ${backup.data.length}\n\n` +
        `ADVERTENCIA: Esto reemplazará todos los datos actuales.`
      );

      if (confirm) {
        onRestore(backup.data);
        alert('Respaldo restaurado exitosamente');
        onClose();
      }
    } catch (error) {
      console.error('Error al restaurar:', error);
      alert('Error al leer el archivo de respaldo');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-4 rounded-t-xl">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database size={28} />
            Respaldo y Restauración
          </h2>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Información</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• El respaldo incluye todos los clientes, préstamos y pagos</li>
              <li>• Los respaldos se guardan en formato JSON</li>
              <li>• Al restaurar, se reemplazarán todos los datos actuales</li>
            </ul>
          </div>

          <div className="space-y-4">
            <div>
              <button
                onClick={handleBackup}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Descargar Respaldo
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Guarda una copia de todos tus datos
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">o</span>
              </div>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleRestore}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Upload size={20} />
                Restaurar desde Archivo
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Selecciona un archivo de respaldo previo
              </p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              <strong>⚠️ Advertencia:</strong> La restauración reemplazará todos los datos actuales.
              Asegúrate de hacer un respaldo antes de restaurar.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
