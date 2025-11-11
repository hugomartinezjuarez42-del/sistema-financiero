import React, { useState, useEffect } from 'react';
import { Upload, FileText, X, Download, Trash2, Eye, File } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Document {
  id: string;
  document_type: 'cedula' | 'contract' | 'pagare' | 'other';
  file_name: string;
  file_path: string;
  file_size: number;
  uploaded_at: string;
  notes?: string;
}

interface DocumentManagerProps {
  clientId: string;
  clientName: string;
}

const documentTypes = [
  { value: 'cedula', label: 'Cédula de Identidad', icon: FileText },
  { value: 'contract', label: 'Contrato', icon: FileText },
  { value: 'pagare', label: 'Pagaré', icon: FileText },
  { value: 'other', label: 'Otro', icon: File }
];

export default function DocumentManager({ clientId, clientName }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('cedula');
  const [notes, setNotes] = useState('');
  const [viewingDocument, setViewingDocument] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, [clientId]);

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('client_documents')
        .select('*')
        .eq('client_id', clientId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('El archivo es muy grande. Máximo 10MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Tipo de archivo no permitido. Solo JPG, PNG o PDF');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${clientId}/${selectedType}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(fileName, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { user } } = await supabase.auth.getUser();

      const { data: orgData } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!orgData?.organization_id) throw new Error('No organization found');

      const { error: dbError } = await supabase
        .from('client_documents')
        .insert({
          client_id: clientId,
          organization_id: orgData.organization_id,
          document_type: selectedType,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          uploaded_by: user?.id,
          notes: notes || null
        });

      if (dbError) throw dbError;

      alert('Documento subido exitosamente');
      setNotes('');
      loadDocuments();
    } catch (error: any) {
      console.error('Error uploading document:', error);
      alert('Error al subir el documento: ' + (error.message || 'Error desconocido'));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm('¿Eliminar este documento?')) return;

    try {
      const { error: storageError } = await supabase.storage
        .from('client-documents')
        .remove([doc.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('client_documents')
        .delete()
        .eq('id', doc.id);

      if (dbError) throw dbError;

      alert('Documento eliminado');
      loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error al eliminar el documento');
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('client-documents')
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Error al descargar el documento');
    }
  };

  const handleView = async (doc: Document) => {
    try {
      // Intentar obtener URL firmada primero para mejor seguridad
      const { data: signedData, error: signedError } = await supabase.storage
        .from('client-documents')
        .createSignedUrl(doc.file_path, 3600); // 1 hora

      if (signedError) {
        console.error('Error getting signed URL:', signedError);
        // Fallback a URL pública
        const { data: publicData } = supabase.storage
          .from('client-documents')
          .getPublicUrl(doc.file_path);

        setViewingDocument(publicData.publicUrl);
      } else {
        setViewingDocument(signedData.signedUrl);
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      alert('Error al abrir el documento');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getDocumentTypeLabel = (type: string) => {
    return documentTypes.find(t => t.value === type)?.label || type;
  };

  const groupedDocuments = documents.reduce((acc, doc) => {
    if (!acc[doc.document_type]) {
      acc[doc.document_type] = [];
    }
    acc[doc.document_type].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FileText className="text-blue-600" size={28} />
          Documentos de {clientName}
        </h3>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6 border border-blue-200">
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Upload className="text-blue-600" size={20} />
          Subir Nuevo Documento
        </h4>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Documento
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {documentTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas (opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Cédula vigente, ambos lados"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Archivo (Máx 10MB - JPG, PNG, PDF)
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              onChange={handleFileUpload}
              disabled={uploading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {uploading && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-600 mt-2">Subiendo documento...</p>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="mx-auto text-gray-400 mb-3" size={48} />
          <p className="text-gray-500">No hay documentos subidos</p>
        </div>
      ) : (
        <div className="space-y-6">
          {documentTypes.map(type => {
            const docs = groupedDocuments[type.value] || [];
            if (docs.length === 0) return null;

            return (
              <div key={type.value} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <type.icon className="text-blue-600" size={18} />
                  {type.label} ({docs.length})
                </h4>
                <div className="space-y-2">
                  {docs.map(doc => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{doc.file_name}</p>
                        <div className="flex gap-3 text-xs text-gray-500 mt-1">
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                          {doc.notes && <span>• {doc.notes}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleView(doc)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDownload(doc)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Descargar"
                        >
                          <Download size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(doc)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewingDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Vista Previa del Documento</h3>
              <button
                onClick={() => setViewingDocument(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-100">
              {viewingDocument.toLowerCase().endsWith('.pdf') ? (
                <div className="w-full h-full min-h-[600px] bg-gray-200 flex items-center justify-center">
                  <iframe
                    src={viewingDocument + '#view=FitH'}
                    className="w-full h-full"
                    title="Document Preview"
                    onError={(e) => {
                      console.error('Error loading PDF:', e);
                      alert('No se pudo cargar el PDF. Intenta descargarlo directamente.');
                    }}
                  />
                </div>
              ) : (
                <div className="p-4 flex items-center justify-center">
                  <img
                    src={viewingDocument}
                    alt="Document"
                    className="max-w-full max-h-[calc(90vh-120px)] object-contain"
                    onError={(e) => {
                      console.error('Error loading image:', e);
                      (e.target as HTMLImageElement).style.display = 'none';
                      alert('No se pudo cargar la imagen. Intenta descargarla directamente.');
                    }}
                  />
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setViewingDocument(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
