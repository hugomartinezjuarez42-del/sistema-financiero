import React, { useState, useEffect } from 'react';
import { Shield, Car, Home, Gem, Smartphone, FileText, X, Upload, Image as ImageIcon, Trash2, Download, ZoomIn } from 'lucide-react';
import { Loan } from '../App';
import { supabase } from '../lib/supabase';

interface CollateralManagerProps {
  loan: Loan;
  onUpdate: (updates: Partial<Loan>) => void;
  onClose: () => void;
  isDark: boolean;
}

const collateralTypes = [
  { value: 'none', label: 'Sin Garantía', icon: X },
  { value: 'vehicle', label: 'Vehículo', icon: Car },
  { value: 'property', label: 'Propiedad', icon: Home },
  { value: 'jewelry', label: 'Joyería', icon: Gem },
  { value: 'electronics', label: 'Electrónicos', icon: Smartphone },
  { value: 'other', label: 'Otro', icon: FileText }
];

interface CollateralPhoto {
  id: string;
  url: string;
  name: string;
  filePath: string;
}

export default function CollateralManager({ loan, onUpdate, onClose, isDark }: CollateralManagerProps) {
  const [collateralType, setCollateralType] = useState<string>(loan.collateralType || 'none');
  const [description, setDescription] = useState(loan.collateralDescription || '');
  const [value, setValue] = useState(loan.collateralValue || 0);
  const [notes, setNotes] = useState(loan.collateralNotes || '');
  const [photos, setPhotos] = useState<CollateralPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<CollateralPhoto | null>(null);

  useEffect(() => {
    loadPhotos();
  }, [loan.id]);

  const loadPhotos = async () => {
    try {
      const { data: documents } = await supabase
        .from('collateral_documents')
        .select('*')
        .eq('loan_id', loan.id)
        .eq('document_type', 'photo');

      if (documents) {
        const photosWithUrls = await Promise.all(
          documents.map(async (doc) => {
            const { data } = await supabase.storage
              .from('collateral-photos')
              .createSignedUrl(doc.file_path, 3600);

            return {
              id: doc.id,
              url: data?.signedUrl || '',
              name: doc.file_name,
              filePath: doc.file_path
            };
          })
        );
        setPhotos(photosWithUrls.filter(p => p.url));
      }
    } catch (err) {
      console.error('Error loading photos:', err);
    }
  };

  const uploadPhoto = async (file: File) => {
    try {
      setUploading(true);
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${loan.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('collateral-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      await supabase.from('collateral_documents').insert({
        loan_id: loan.id,
        document_type: 'photo',
        file_name: file.name,
        file_path: fileName,
        file_size: file.size,
        uploaded_by: user.id
      });

      await loadPhotos();
    } catch (err) {
      console.error('Error uploading photo:', err);
      alert('Error al subir la foto');
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (photoId: string, filePath: string) => {
    try {
      await supabase.storage
        .from('collateral-photos')
        .remove([filePath]);

      await supabase
        .from('collateral_documents')
        .delete()
        .eq('id', photoId);

      await loadPhotos();
    } catch (err) {
      console.error('Error deleting photo:', err);
      alert('Error al eliminar la foto');
    }
  };

  const downloadPhoto = async (photo: CollateralPhoto) => {
    try {
      const { data, error } = await supabase.storage
        .from('collateral-photos')
        .download(photo.filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = photo.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading photo:', err);
      alert('Error al descargar la foto');
    }
  };

  const formatLempiras = (amount: number) => {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleSave = () => {
    onUpdate({
      collateralType: collateralType as any,
      collateralDescription: description,
      collateralValue: value,
      collateralNotes: notes
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Shield className="text-blue-500" size={24} />
              <h2 className="text-2xl font-bold">Gestión de Garantías</h2>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-3">Tipo de Garantía</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {collateralTypes.map(type => {
                  const Icon = type.icon;
                  const isSelected = collateralType === type.value;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setCollateralType(type.value)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : isDark
                          ? 'border-gray-600 hover:border-gray-500'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Icon className={isSelected ? 'text-blue-500' : ''} size={24} />
                      <p className={`text-sm mt-2 ${isSelected ? 'font-semibold' : ''}`}>
                        {type.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {collateralType !== 'none' && (
              <>
                <div>
                  <label className="block text-sm font-semibold mb-2">Descripción de la Garantía</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ej: Toyota Corolla 2015, Placa ABC-1234, Color Blanco"
                    className={`w-full px-4 py-2 border rounded-lg ${
                      isDark
                        ? 'bg-gray-700 border-gray-600'
                        : 'bg-white border-gray-300'
                    }`}
                    rows={3}
                  />
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Describe la garantía con el mayor detalle posible (marca, modelo, año, características)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Valor Estimado</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">L</span>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => setValue(Number(e.target.value))}
                      placeholder="0.00"
                      className={`w-full pl-8 pr-4 py-2 border rounded-lg ${
                        isDark
                          ? 'bg-gray-700 border-gray-600'
                          : 'bg-white border-gray-300'
                      }`}
                      step="0.01"
                    />
                  </div>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Valor comercial o de mercado de la garantía
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Fotos de la Garantía</label>

                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {photos.map((photo) => (
                      <div key={photo.id} className="relative group">
                        <img
                          src={photo.url}
                          alt={photo.name}
                          className="w-full h-24 object-cover rounded-lg cursor-pointer"
                          onClick={() => setSelectedPhoto(photo)}
                        />
                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPhoto(photo);
                            }}
                            className="p-1 bg-blue-500 text-white rounded-full"
                            title="Ver foto"
                          >
                            <ZoomIn size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadPhoto(photo);
                            }}
                            className="p-1 bg-green-500 text-white rounded-full"
                            title="Descargar foto"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePhoto(photo.id, photo.filePath);
                            }}
                            className="p-1 bg-red-500 text-white rounded-full"
                            title="Eliminar foto"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}

                    <label className={`flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      isDark
                        ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700'
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          files.forEach(file => uploadPhoto(file));
                        }}
                        disabled={uploading}
                      />
                      {uploading ? (
                        <div className="text-sm text-gray-500">Subiendo...</div>
                      ) : (
                        <>
                          <Upload size={24} className="text-gray-400 mb-1" />
                          <span className="text-xs text-gray-500">Subir foto</span>
                        </>
                      )}
                    </label>
                  </div>

                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Sube fotos de la garantía para documentación visual
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Notas Adicionales</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Condición física, ubicación, observaciones especiales..."
                    className={`w-full px-4 py-2 border rounded-lg ${
                      isDark
                        ? 'bg-gray-700 border-gray-600'
                        : 'bg-white border-gray-300'
                    }`}
                    rows={3}
                  />
                </div>

                {value > 0 && loan.principal > 0 && (
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <span className="font-semibold">Relación Préstamo/Garantía:</span>{' '}
                      {((loan.principal / value) * 100).toFixed(1)}%
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {value >= loan.principal * 1.5
                        ? '✅ Garantía suficiente (150%+ del préstamo)'
                        : value >= loan.principal
                        ? '⚠️ Garantía mínima (100% del préstamo)'
                        : '❌ Garantía insuficiente (menos del 100%)'}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 font-semibold"
            >
              Guardar Garantía
            </button>
            <button
              onClick={onClose}
              className={`px-6 py-2 rounded-lg font-semibold ${
                isDark
                  ? 'bg-gray-700 hover:bg-gray-600'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>

      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-6xl max-h-[90vh] w-full h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-lg font-semibold">{selectedPhoto.name}</h3>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadPhoto(selectedPhoto);
                  }}
                  className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                >
                  <Download size={18} />
                  Descargar
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPhoto(null);
                  }}
                  className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.name}
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
