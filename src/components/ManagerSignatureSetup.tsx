import React, { useRef, useState, useEffect } from 'react';
import { X, Check, Trash2, PenTool, Upload, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ManagerSignature {
  id: string;
  signature_data: string;
  full_name: string;
  title: string;
  is_active: boolean;
  uploaded_at: string;
}

interface ManagerSignatureSetupProps {
  onClose: () => void;
  onSignatureSaved?: () => void;
}

export default function ManagerSignatureSetup({ onClose, onSignatureSaved }: ManagerSignatureSetupProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentSignature, setCurrentSignature] = useState<ManagerSignature | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    title: 'Gerente General'
  });

  useEffect(() => {
    loadCurrentSignature();
  }, []);

  const loadCurrentSignature = async () => {
    try {
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();

      if (!orgMember) return;

      const { data, error } = await supabase
        .from('manager_signatures')
        .select('*')
        .eq('organization_id', orgMember.organization_id)
        .eq('is_active', true)
        .maybeSingle();

      if (data) {
        setCurrentSignature(data);
        setFormData({
          fullName: data.full_name,
          title: data.title
        });

        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const img = new Image();
            img.onload = () => {
              ctx.drawImage(img, 0, 0);
              setHasSignature(true);
            };
            img.src = data.signature_data;
          }
        }
      }
    } catch (error) {
      console.error('Error loading signature:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);

    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let x, y;
    if ('touches' in e) {
      e.preventDefault();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor seleccione un archivo de imagen');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;

        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        setHasSignature(true);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const saveSignature = async () => {
    if (!hasSignature || !formData.fullName.trim()) {
      alert('Por favor complete todos los campos y agregue su firma');
      return;
    }

    setSaving(true);

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const signatureData = canvas.toDataURL('image/png');

      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();

      if (!orgMember) throw new Error('No se encontró la organización');

      if (currentSignature) {
        const { error } = await supabase
          .from('manager_signatures')
          .update({
            signature_data: signatureData,
            full_name: formData.fullName,
            title: formData.title,
            uploaded_at: new Date().toISOString()
          })
          .eq('id', currentSignature.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('manager_signatures')
          .insert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            organization_id: orgMember.organization_id,
            signature_data: signatureData,
            full_name: formData.fullName,
            title: formData.title,
            is_active: true
          });

        if (error) throw error;
      }

      alert('✅ Firma guardada exitosamente. Ahora se incluirá automáticamente en todos los contratos.');
      if (onSignatureSaved) onSignatureSaved();
      onClose();
    } catch (error) {
      console.error('Error saving signature:', error);
      alert('Error al guardar la firma. Por favor intente nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const deleteSignature = async () => {
    if (!currentSignature) return;

    if (!confirm('¿Está seguro que desea eliminar la firma actual? Tendrá que crear una nueva.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('manager_signatures')
        .delete()
        .eq('id', currentSignature.id);

      if (error) throw error;

      setCurrentSignature(null);
      clearSignature();
      setFormData({ fullName: '', title: 'Gerente General' });
      alert('Firma eliminada exitosamente');
    } catch (error) {
      console.error('Error deleting signature:', error);
      alert('Error al eliminar la firma');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6">
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PenTool size={24} />
              <div>
                <h2 className="text-xl font-bold">Firma del Gerente/Prestamista</h2>
                <p className="text-indigo-100 text-sm">
                  {currentSignature ? 'Actualizar firma existente' : 'Configurar firma para contratos'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Información Importante</h3>
            <p className="text-sm text-blue-800">
              Configure su firma una vez y se incluirá automáticamente en todos los contratos PDF.
              No tendrá que firmar cada contrato manualmente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ej: Juan Pérez González"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Cargo
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ej: Gerente General"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Firma Digital
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="w-full cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Dibuje su firma con el mouse o su dedo, o cargue una imagen
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={clearSignature}
              disabled={!hasSignature}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={18} />
              Limpiar
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Upload size={18} />
              Cargar Imagen
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            {currentSignature && (
              <button
                onClick={deleteSignature}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors ml-auto"
              >
                <Trash2 size={18} />
                Eliminar Firma
              </button>
            )}
          </div>

          {currentSignature && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">✓ Firma Activa</h4>
              <p className="text-sm text-green-800">
                Firma actual de: <strong>{currentSignature.full_name}</strong> ({currentSignature.title})
              </p>
              <p className="text-xs text-green-700 mt-1">
                Subida: {new Date(currentSignature.uploaded_at).toLocaleString('es-HN')}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={saveSignature}
              disabled={!hasSignature || !formData.fullName.trim() || saving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={20} />
              {saving ? 'Guardando...' : currentSignature ? 'Actualizar Firma' : 'Guardar Firma'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
