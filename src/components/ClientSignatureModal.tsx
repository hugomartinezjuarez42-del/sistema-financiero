import React, { useRef, useState, useEffect } from 'react';
import { X, Save, Trash2, Pen } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ClientSignatureModalProps {
  loanId: string;
  clientId: string;
  clientName: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function ClientSignatureModal({
  loanId,
  clientId,
  clientName,
  onClose,
  onSaved
}: ClientSignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const startDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const touch = e.touches[0];
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
  };

  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const touch = e.touches[0];
    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    ctx.stroke();
    setHasDrawn(true);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const saveSignature = async () => {
    if (!hasDrawn) {
      alert('Por favor dibuje su firma primero');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    setSaving(true);

    try {
      const signatureData = canvas.toDataURL('image/png');

      const deviceInfo = `${navigator.userAgent.substring(0, 200)}`;
      const ipAddress = 'client';

      const documentHash = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(signatureData)
      ).then(hash =>
        Array.from(new Uint8Array(hash))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
      );

      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();

      const { error } = await supabase
        .from('digital_signatures')
        .insert({
          loan_id: loanId,
          client_id: clientId,
          signature_data: signatureData,
          signature_type: 'client',
          document_type: 'contract',
          ip_address: ipAddress,
          device_info: deviceInfo,
          document_hash: documentHash,
          organization_id: orgMember?.organization_id || null
        });

      if (error) throw error;

      onClose();

      setTimeout(() => {
        onSaved();
        alert('Firma guardada exitosamente');
      }, 100);
    } catch (error) {
      console.error('Error saving signature:', error);
      alert('Error al guardar la firma');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full">
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Firma Digital
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {clientName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Pen size={18} className="text-blue-600" />
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Dibuje su firma en el espacio de abajo usando el mouse o su dedo
              </p>
            </div>
          </div>

          <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden mb-4 bg-white">
            <canvas
              ref={canvasRef}
              width={600}
              height={250}
              className="w-full cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawingTouch}
              onTouchMove={drawTouch}
              onTouchEnd={stopDrawing}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={clearSignature}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              disabled={saving}
            >
              <Trash2 size={18} />
              Limpiar
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              onClick={saveSignature}
              disabled={!hasDrawn || saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {saving ? 'Guardando...' : 'Guardar Firma'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
