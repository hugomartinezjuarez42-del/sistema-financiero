import React, { useState, useEffect } from 'react';
import { FileText, Download, Save } from 'lucide-react';
import jsPDF from 'jspdf';
import { Client } from '../App';
import { supabase } from '../lib/supabase';

interface LoanContractPDFProps {
  client: Client;
  loan: any;
  formatLempiras: (amount: number) => string;
}

interface ManagerSignature {
  signature_data: string;
  full_name: string;
  title: string;
}

interface ClientSignature {
  signature_data: string;
}

export default function LoanContractPDF({ client, loan, formatLempiras }: LoanContractPDFProps) {
  const [managerSignature, setManagerSignature] = useState<ManagerSignature | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadManagerSignature();
  }, []);

  const loadManagerSignature = async () => {
    try {
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();

      if (!orgMember) return;

      const { data } = await supabase
        .from('manager_signatures')
        .select('signature_data, full_name, title')
        .eq('organization_id', orgMember.organization_id)
        .eq('is_active', true)
        .maybeSingle();

      if (data) {
        setManagerSignature(data);
      }
    } catch (error) {
      console.error('Error loading manager signature:', error);
    }
  };

  const loadClientSignature = async (): Promise<ClientSignature | null> => {
    try {
      const { data } = await supabase
        .from('digital_signatures')
        .select('signature_data')
        .eq('loan_id', loan.id)
        .eq('signature_type', 'client')
        .eq('document_type', 'contract')
        .order('signed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return data;
    } catch (error) {
      return null;
    }
  };

  const generateContract = async () => {
    const doc = new jsPDF();
    const today = new Date();
    const loanDate = new Date(loan.date);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTRATO DE PRÉSTAMO', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Inversiones GVM', 105, 28, { align: 'center' });
    doc.text(`Generado: ${today.toLocaleDateString('es-HN')}`, 105, 34, { align: 'center' });

    let yPos = 50;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL PRESTAMISTA:', 14, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Nombre: Inversiones GVM', 20, yPos);
    yPos += 6;
    doc.text('Tipo de persona: Persona Jurídica', 20, yPos);
    yPos += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL PRESTATARIO:', 14, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Nombre completo: ${client.name}`, 20, yPos);
    yPos += 6;
    if (client.id_number) {
      doc.text(`Identidad: ${client.id_number}`, 20, yPos);
      yPos += 6;
    }
    if (client.phone_number) {
      doc.text(`Teléfono: ${client.phone_number}`, 20, yPos);
      yPos += 6;
    }
    yPos += 4;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('CONDICIONES DEL PRÉSTAMO:', 14, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Monto del préstamo: ${formatLempiras(loan.principal)}`, 20, yPos);
    yPos += 6;
    doc.text(`Fecha del préstamo: ${loanDate.toLocaleDateString('es-HN')}`, 20, yPos);
    yPos += 6;
    doc.text(`Frecuencia de pago: Quincenal (cada 15 días)`, 20, yPos);
    yPos += 10;

    if (loan.collateral_type && loan.collateral_type !== 'none') {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('GARANTÍA:', 14, yPos);
      yPos += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const collateralTypes: { [key: string]: string } = {
        vehicle: 'Vehículo',
        property: 'Propiedad',
        jewelry: 'Joya',
        electronics: 'Electrónico',
        other: 'Otro'
      };
      doc.text(`Tipo: ${collateralTypes[loan.collateral_type] || loan.collateral_type}`, 20, yPos);
      yPos += 6;
      if (loan.collateral_description) {
        doc.text(`Descripción: ${loan.collateral_description}`, 20, yPos);
        yPos += 6;
      }
      if (loan.collateral_value > 0) {
        doc.text(`Valor estimado: ${formatLempiras(loan.collateral_value)}`, 20, yPos);
        yPos += 6;
      }
      yPos += 4;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('CLÁUSULAS:', 14, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const clausulas = [
      '1. El PRESTATARIO se compromete a pagar el préstamo según las condiciones establecidas.',
      '2. El interés se calculará de forma quincenal sobre el saldo pendiente.',
      '3. Los pagos de capital reducirán el saldo principal del préstamo.',
      '4. En caso de mora, se aplicarán los intereses correspondientes al tiempo vencido.',
      '5. El PRESTAMISTA se reserva el derecho de cobrar mediante los medios legales disponibles.',
      '6. Cualquier modificación a este contrato deberá ser acordada por ambas partes por escrito.'
    ];

    if (loan.collateral_type && loan.collateral_type !== 'none') {
      clausulas.push('7. La garantía mencionada respaldará el cumplimiento de este préstamo.');
      clausulas.push('8. En caso de incumplimiento, el PRESTAMISTA podrá ejecutar la garantía.');
    }

    clausulas.forEach(clausula => {
      const lines = doc.splitTextToSize(clausula, 175);
      lines.forEach((line: string) => {
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, 20, yPos);
        yPos += 5;
      });
    });

    yPos += 10;

    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    // Cargar firma del cliente
    const clientSignature = await loadClientSignature();

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('FIRMAS:', 14, yPos);
    yPos += 10;

    // Firma del Prestamista (Gerente)
    if (managerSignature) {
      try {
        const imgData = managerSignature.signature_data;
        doc.addImage(imgData, 'PNG', 25, yPos, 50, 20);
      } catch (error) {
        console.error('Error adding manager signature:', error);
      }
    }

    // Firma del Cliente
    if (clientSignature) {
      try {
        const imgData = clientSignature.signature_data;
        doc.addImage(imgData, 'PNG', 115, yPos, 50, 20);
      } catch (error) {
        console.error('Error adding client signature:', error);
      }
    }

    yPos += 22;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('_________________________', 30, yPos);
    doc.text('_________________________', 120, yPos);
    yPos += 6;
    doc.text('PRESTAMISTA', 50, yPos);
    doc.text('PRESTATARIO', 140, yPos);
    yPos += 2;
    doc.setFontSize(8);

    if (managerSignature) {
      doc.text(managerSignature.full_name, 35, yPos);
      yPos += 4;
      doc.text(managerSignature.title, 40, yPos);
      yPos -= 4;
    } else {
      doc.text('Inversiones GVM', 45, yPos);
    }

    doc.text(client.name, 130, yPos);

    if (client.id_number) {
      yPos += 4;
      doc.text(`ID: ${client.id_number}`, 130, yPos);
    }

    yPos += 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('Este documento constituye un acuerdo legal entre las partes mencionadas.', 105, yPos, { align: 'center' });

    if (!managerSignature) {
      yPos += 6;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(200, 0, 0);
      doc.text('Nota: Configure la firma del gerente en Configuración > Firma del Gerente', 105, yPos, { align: 'center' });
      doc.setTextColor(0, 0, 0);
    }

    if (!clientSignature) {
      yPos += 6;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(200, 100, 0);
      doc.text('Nota: El cliente puede firmar digitalmente usando el botón "Firmar" del préstamo', 105, yPos, { align: 'center' });
      doc.setTextColor(0, 0, 0);
    }

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    doc.save(`Contrato_${client.name.replace(/\s+/g, '_')}_${loan.date}.pdf`);
  };

  const saveContractToDocuments = async () => {
    if (saving) return;

    try {
      setSaving(true);

      const doc = new jsPDF();
      const today = new Date();
      const loanDate = new Date(loan.date);

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('CONTRATO DE PRÉSTAMO', 105, 20, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Inversiones GVM', 105, 28, { align: 'center' });
      doc.text(`Generado: ${today.toLocaleDateString('es-HN')}`, 105, 34, { align: 'center' });

      let yPos = 50;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('DATOS DEL PRESTAMISTA:', 14, yPos);
      yPos += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Nombre: Inversiones GVM', 20, yPos);
      yPos += 6;
      doc.text('Tipo de persona: Persona Jurídica', 20, yPos);
      yPos += 10;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('DATOS DEL PRESTATARIO:', 14, yPos);
      yPos += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Nombre: ${client.name}`, 20, yPos);
      yPos += 6;
      if (client.idNumber) {
        doc.text(`Identidad: ${client.idNumber}`, 20, yPos);
        yPos += 6;
      }
      if (client.phoneNumber) {
        doc.text(`Teléfono: ${client.phoneNumber}`, 20, yPos);
        yPos += 6;
      }
      if (client.residenceAddress) {
        doc.text(`Dirección: ${client.residenceAddress}`, 20, yPos);
        yPos += 6;
      }

      yPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('TÉRMINOS DEL PRÉSTAMO:', 14, yPos);
      yPos += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Monto del préstamo: ${formatLempiras(loan.principal)}`, 20, yPos);
      yPos += 6;
      doc.text(`Tasa de interés: ${client.rate}% quincenal`, 20, yPos);
      yPos += 6;
      doc.text(`Fecha del préstamo: ${loanDate.toLocaleDateString('es-HN')}`, 20, yPos);
      yPos += 6;

      if (loan.collateralType && loan.collateralType !== 'none') {
        const collateralTypes: Record<string, string> = {
          vehicle: 'Vehículo',
          property: 'Propiedad',
          jewelry: 'Joyería',
          electronics: 'Electrónicos',
          other: 'Otro'
        };
        doc.text(`Tipo de garantía: ${collateralTypes[loan.collateralType] || loan.collateralType}`, 20, yPos);
        yPos += 6;
        if (loan.collateralDescription) {
          doc.text(`Descripción: ${loan.collateralDescription}`, 20, yPos);
          yPos += 6;
        }
        if (loan.collateralValue) {
          doc.text(`Valor estimado: ${formatLempiras(loan.collateralValue)}`, 20, yPos);
          yPos += 6;
        }
      }

      yPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('CLÁUSULAS:', 14, yPos);
      yPos += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      const clausulas = [
        '1. El PRESTAMISTA entrega al PRESTATARIO la cantidad acordada en concepto de préstamo.',
        '2. El PRESTATARIO se compromete a pagar el interés quincenal pactado.',
        '3. El capital prestado podrá ser pagado en cualquier momento sin penalización.',
        '4. Los intereses se calcularán sobre el capital pendiente cada quincena.',
        '5. El incumplimiento en el pago de intereses por más de 30 días hará exigible el capital completo.',
        '6. Ambas partes acuerdan resolver cualquier disputa de manera amigable.'
      ];

      if (loan.collateralType && loan.collateralType !== 'none') {
        clausulas.push('7. La garantía mencionada respaldará el cumplimiento de este préstamo.');
        clausulas.push('8. En caso de incumplimiento, el PRESTAMISTA podrá ejecutar la garantía.');
      }

      clausulas.forEach(clausula => {
        const lines = doc.splitTextToSize(clausula, 175);
        lines.forEach((line: string) => {
          if (yPos > 260) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(line, 20, yPos);
          yPos += 5;
        });
      });

      yPos += 10;

      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }

      const clientSignature = await loadClientSignature();

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('FIRMAS:', 14, yPos);
      yPos += 10;

      if (managerSignature) {
        try {
          const imgData = managerSignature.signature_data;
          doc.addImage(imgData, 'PNG', 25, yPos, 50, 20);
        } catch (error) {
          console.error('Error adding manager signature:', error);
        }
      }

      if (clientSignature) {
        try {
          const imgData = clientSignature.signature_data;
          doc.addImage(imgData, 'PNG', 115, yPos, 50, 20);
        } catch (error) {
          console.error('Error adding client signature:', error);
        }
      }

      yPos += 22;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('_________________________', 30, yPos);
      doc.text('_________________________', 120, yPos);
      yPos += 6;
      doc.text('PRESTAMISTA', 50, yPos);
      doc.text('PRESTATARIO', 140, yPos);
      yPos += 2;
      doc.setFontSize(8);

      if (managerSignature) {
        doc.text(managerSignature.full_name, 35, yPos);
        yPos += 4;
        doc.text(managerSignature.title, 40, yPos);
        yPos -= 4;
      } else {
        doc.text('Inversiones GVM', 45, yPos);
      }

      doc.text(client.name, 130, yPos);

      if (client.idNumber) {
        yPos += 4;
        doc.text(`ID: ${client.idNumber}`, 130, yPos);
      }

      yPos += 10;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text('Este documento constituye un acuerdo legal entre las partes mencionadas.', 105, yPos, { align: 'center' });

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Página ${i} de ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

      const pdfBlob = doc.output('blob');
      const fileName = `${client.id}/contract/${Date.now()}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf',
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
          client_id: client.id,
          organization_id: orgData.organization_id,
          document_type: 'contract',
          file_name: `Contrato_${client.name}_${loan.date}.pdf`,
          file_path: fileName,
          file_size: pdfBlob.size,
          uploaded_by: user?.id,
          notes: `Contrato generado automáticamente para préstamo del ${loanDate.toLocaleDateString('es-HN')}`
        });

      if (dbError) throw dbError;

      alert('Contrato guardado exitosamente en documentos');
    } catch (error: any) {
      console.error('Error saving contract:', error);
      alert('Error al guardar el contrato en documentos: ' + (error.message || 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={generateContract}
        className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
      >
        <FileText size={16} />
        <span>Descargar</span>
        <Download size={14} />
      </button>
      <button
        onClick={saveContractToDocuments}
        disabled={saving}
        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Save size={16} />
        <span>{saving ? 'Guardando...' : 'Guardar'}</span>
      </button>
    </div>
  );
}
