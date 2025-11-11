import React, { useState, useEffect } from 'react';
import { UserPlus, Mail, X, Check, Clock, Trash2, Users, AlertCircle, Copy, MessageCircle, Share2, QrCode, FileDown } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../lib/supabase';

interface Invitation {
  id: string;
  organization_id: string;
  invited_email: string;
  role: string;
  status: string;
  invitation_code: string;
  expires_at: string;
  created_at: string;
}

interface PendingInvitation {
  id: string;
  organization_id: string;
  organization_name: string;
  invited_by_email: string;
  role: string;
  invitation_code: string;
  expires_at: string;
  created_at: string;
}

interface OrganizationMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user_email: string;
}

interface InvitationManagerProps {
  userId: string;
  organizationId: string;
  userRole: string;
}

export default function InvitationManager({ userId, organizationId, userRole }: InvitationManagerProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'member'>('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'members' | 'invitations' | 'pending'>('members');
  const [organizationName, setOrganizationName] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrInvitation, setQrInvitation] = useState<Invitation | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    loadData();
  }, [organizationId]);

  async function loadData() {
    await Promise.all([
      loadInvitations(),
      loadMembers(),
      loadPendingInvitations(),
      loadOrganizationName()
    ]);
  }

  async function loadOrganizationName() {
    const { data } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .maybeSingle();

    if (data) {
      setOrganizationName(data.name);
    }
  }

  async function loadInvitations() {
    if (userRole !== 'admin') return;

    const { data, error } = await supabase
      .from('organization_invitations')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading invitations:', error);
    } else {
      setInvitations(data || []);
    }
  }

  async function loadMembers() {
    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        id,
        user_id,
        role,
        joined_at
      `)
      .eq('organization_id', organizationId)
      .order('joined_at', { ascending: false });

    if (error) {
      console.error('Error loading members:', error);
      return;
    }

    const membersWithEmails = await Promise.all(
      (data || []).map(async (member) => {
        const { data: userData } = await supabase.auth.admin.getUserById(member.user_id);
        return {
          ...member,
          user_email: userData?.user?.email || 'Email no disponible'
        };
      })
    );

    setMembers(membersWithEmails);
  }

  async function loadPendingInvitations() {
    const { data, error } = await supabase.rpc('get_my_invitations');

    if (error) {
      console.error('Error loading pending invitations:', error);
    } else {
      setPendingInvitations(data || []);
    }
  }

  async function sendInvitation() {
    if (!newEmail.trim()) {
      setError('Por favor ingresa un correo electrónico');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setError('Por favor ingresa un correo electrónico válido');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .limit(1)
        .maybeSingle();

      if (existingMember) {
        const { data: userData } = await supabase.auth.admin.getUserById(existingMember.id);
        if (userData?.user?.email === newEmail) {
          setError('Este usuario ya es miembro de la organización');
          return;
        }
      }

      const { data: newInvitation, error: inviteError } = await supabase
        .from('organization_invitations')
        .insert({
          organization_id: organizationId,
          invited_email: newEmail.toLowerCase().trim(),
          invited_by: userId,
          role: newRole,
          status: 'pending'
        })
        .select()
        .single();

      if (inviteError) {
        if (inviteError.message.includes('duplicate')) {
          setError('Ya existe una invitación pendiente para este correo');
        } else {
          throw inviteError;
        }
        return;
      }

      setSuccess(`Invitación creada exitosamente`);
      await loadInvitations();

      // Mostrar automáticamente el QR de la invitación recién creada
      if (newInvitation) {
        setQrInvitation(newInvitation as Invitation);
        setShowQRModal(true);
        setPreviewMode(false);
      }

      setNewEmail('');
      setNewRole('member');
    } catch (err: any) {
      console.error('Error sending invitation:', err);
      setError('Error al enviar la invitación');
    } finally {
      setLoading(false);
    }
  }

  async function cancelInvitation(invitationId: string) {
    if (!confirm('¿Estás seguro de cancelar esta invitación?')) return;

    const { error } = await supabase
      .from('organization_invitations')
      .delete()
      .eq('id', invitationId);

    if (error) {
      setError('Error al cancelar la invitación');
    } else {
      setSuccess('Invitación cancelada');
      await loadInvitations();
    }
  }

  async function acceptInvitation(invitationCode: string) {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data, error } = await supabase.rpc('accept_invitation', {
        invitation_code_param: invitationCode
      });

      if (error) throw error;

      if (data.success) {
        setSuccess('¡Invitación aceptada! Recarga la página para ver los cambios.');
        await loadPendingInvitations();
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setError(data.error || 'Error al aceptar la invitación');
      }
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      setError('Error al aceptar la invitación');
    } finally {
      setLoading(false);
    }
  }

  async function removeMember(memberId: string, memberEmail: string) {
    if (!confirm(`¿Estás seguro de remover a ${memberEmail} de la organización?`)) return;

    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      setError('Error al remover el miembro');
    } else {
      setSuccess('Miembro removido de la organización');
      await loadMembers();
    }
  }

  function copyInvitationCode(code: string) {
    navigator.clipboard.writeText(code);
    setSuccess('Código copiado al portapapeles');
    setTimeout(() => setSuccess(''), 2000);
  }

  function getInvitationLink(code: string) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/accept-invite/${code.toUpperCase()}`;
  }

  function generatePreviewCode(): string {
    return 'PREVIEW' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  function sharePreviewViaWhatsApp() {
    if (!newEmail.trim()) {
      setError('Por favor ingresa un correo electrónico primero');
      return;
    }
    const previewCode = generatePreviewCode();
    const roleText = newRole === 'admin' ? 'Administrador' : 'Miembro';
    const link = getInvitationLink(previewCode);
    const message = `¡Hola! 👋\n\nTe he invitado a unirte a *${organizationName}* como *${roleText}*.\n\n🔑 *Código:* ${previewCode}\n\n🔗 *Link directo:* ${link}\n\n¡Solo crea tu contraseña y listo! 🚀\n\n_Nota: Este es un ejemplo. Presiona "Enviar Invitación" para crear el link real._`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  function showPreviewQR() {
    if (!newEmail.trim()) {
      setError('Por favor ingresa un correo electrónico primero');
      return;
    }
    const previewCode = generatePreviewCode();
    const mockInvitation: Invitation = {
      id: 'preview',
      organization_id: organizationId,
      invited_email: newEmail,
      role: newRole,
      status: 'pending',
      invitation_code: previewCode,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString()
    };
    setQrInvitation(mockInvitation);
    setShowQRModal(true);
    setPreviewMode(true);
  }

  function shareViaWhatsApp(invitation: Invitation, orgName: string) {
    const link = getInvitationLink(invitation.invitation_code);
    const roleText = invitation.role === 'admin' ? 'Administrador' : 'Miembro';
    const expiresDate = new Date(invitation.expires_at).toLocaleDateString('es-ES');

    const message = `¡Hola! 👋\n\nTe he invitado a unirte a *${orgName}* como *${roleText}*.\n\n🔑 *Código:* ${invitation.invitation_code.toUpperCase()}\n\n🔗 *Link directo:* ${link}\n\n📅 *Expira:* ${expiresDate}\n\n¡Solo crea tu contraseña y listo! 🚀`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  function copyInvitationLink(code: string) {
    const link = getInvitationLink(code);
    navigator.clipboard.writeText(link);
    setSuccess('Link copiado al portapapeles');
    setTimeout(() => setSuccess(''), 2000);
  }

  function showQRCode(invitation: Invitation) {
    setQrInvitation(invitation);
    setShowQRModal(true);
    setPreviewMode(false);
  }

  function downloadQRCode() {
    const canvas = document.querySelector('.qr-code-canvas canvas') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `invitacion-${qrInvitation?.invitation_code}.png`;
      link.href = url;
      link.click();
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pendiente', icon: Clock },
      accepted: { color: 'bg-green-100 text-green-800', text: 'Aceptada', icon: Check },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rechazada', icon: X },
      expired: { color: 'bg-gray-100 text-gray-800', text: 'Expirada', icon: Clock }
    };

    const badge = badges[status as keyof typeof badges] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon size={12} />
        {badge.text}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    return role === 'admin' ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        Admin
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Miembro
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <Users className="text-blue-600" size={28} />
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <Check size={20} />
          {success}
        </div>
      )}

      {pendingInvitations.length > 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Mail size={20} />
            Invitaciones Recibidas
          </h3>
          <div className="space-y-2">
            {pendingInvitations.map((inv) => (
              <div key={inv.id} className="bg-white rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{inv.organization_name}</p>
                  <p className="text-sm text-gray-600">
                    Invitado por: {inv.invited_by_email} • Rol: {inv.role === 'admin' ? 'Admin' : 'Miembro'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Expira: {new Date(inv.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => acceptInvitation(inv.invitation_code)}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Aceptar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('members')}
            className={`pb-2 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'members'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Miembros ({members.length})
          </button>
          {userRole === 'admin' && (
            <button
              onClick={() => setActiveTab('invitations')}
              className={`pb-2 px-1 border-b-2 font-medium transition-colors ${
                activeTab === 'invitations'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Invitaciones ({invitations.length})
            </button>
          )}
        </nav>
      </div>

      {activeTab === 'members' && (
        <div className="space-y-4">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {member.user_email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{member.user_email}</p>
                  <p className="text-sm text-gray-600">
                    Unido: {new Date(member.joined_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getRoleBadge(member.role)}
                {userRole === 'admin' && member.user_id !== userId && (
                  <button
                    onClick={() => removeMember(member.id, member.user_email)}
                    className="text-red-600 hover:text-red-700 p-2"
                    title="Remover miembro"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'invitations' && userRole === 'admin' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl border-2 border-blue-200 dark:border-gray-600">
            <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <UserPlus size={24} />
              Invitar Nuevo Usuario
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Rol
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'admin' | 'member')}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="member">Miembro</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
              <h4 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Share2 size={20} />
                Compartir Invitación
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={sendInvitation}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-2 text-base disabled:opacity-50"
                >
                  <Mail size={20} />
                  Crear y Enviar
                </button>
                <button
                  onClick={sharePreviewViaWhatsApp}
                  disabled={!newEmail.trim()}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-4 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-2 text-base disabled:opacity-50"
                >
                  <MessageCircle size={20} />
                  WhatsApp
                </button>
                <button
                  onClick={showPreviewQR}
                  disabled={!newEmail.trim()}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-6 py-4 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-2 text-base disabled:opacity-50"
                >
                  <QrCode size={20} />
                  Ver QR
                </button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-4 text-center">
                Los botones WhatsApp y QR generan una vista previa. Usa "Crear y Enviar" para la invitación oficial.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-medium text-gray-900">{invitation.invited_email}</p>
                      {getStatusBadge(invitation.status)}
                      {getRoleBadge(invitation.role)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Creada: {new Date(invitation.created_at).toLocaleDateString()} •
                      Expira: {new Date(invitation.expires_at).toLocaleDateString()}
                    </p>
                    {invitation.status === 'pending' && (
                      <div className="space-y-4 mt-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Código de Invitación:</span>
                          <code className="text-lg bg-white dark:bg-gray-700 px-4 py-2 rounded-lg font-mono font-bold text-blue-600 border-2 border-blue-200">
                            {invitation.invitation_code.toUpperCase()}
                          </code>
                          <button
                            onClick={() => copyInvitationCode(invitation.invitation_code.toUpperCase())}
                            className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Copiar código"
                          >
                            <Copy size={20} />
                          </button>
                        </div>

                        <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-4">
                          <h4 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <Share2 size={20} />
                            Compartir Invitación
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <button
                              onClick={() => copyInvitationLink(invitation.invitation_code)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-3 text-base font-semibold transition-all hover:scale-105 shadow-lg"
                              title="Copiar link completo"
                            >
                              <Share2 size={20} />
                              <span>Copiar Link</span>
                            </button>
                            <button
                              onClick={() => shareViaWhatsApp(invitation, organizationName)}
                              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-3 text-base font-semibold transition-all hover:scale-105 shadow-lg"
                              title="Compartir por WhatsApp"
                            >
                              <MessageCircle size={20} />
                              <span>WhatsApp</span>
                            </button>
                            <button
                              onClick={() => showQRCode(invitation)}
                              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-3 text-base font-semibold transition-all hover:scale-105 shadow-lg"
                              title="Mostrar código QR"
                            >
                              <QrCode size={20} />
                              <span>Código QR</span>
                            </button>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 text-center">
                            Comparte la invitación usando el link directo, WhatsApp o código QR
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  {invitation.status === 'pending' && (
                    <button
                      onClick={() => cancelInvitation(invitation.id)}
                      className="text-red-600 hover:text-red-700 p-2"
                      title="Cancelar invitación"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {invitations.length === 0 && (
              <p className="text-gray-500 text-center py-8">No hay invitaciones</p>
            )}
          </div>
        </div>
      )}

      {/* Modal de Código QR */}
      {showQRModal && qrInvitation && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-lg w-full border-4 border-gradient-to-r from-violet-500 to-indigo-500">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-2 rounded-lg">
                  <QrCode className="text-white" size={28} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {previewMode ? 'Vista Previa - QR' : 'Código QR'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowQRModal(false);
                  setPreviewMode(false);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={28} />
              </button>
            </div>

            {previewMode ? (
              <div className="bg-yellow-50 dark:bg-yellow-900 border-2 border-yellow-400 dark:border-yellow-600 rounded-xl p-4 mb-4">
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                  <AlertCircle size={18} />
                  Esto es una vista previa. El código es temporal y no funcionará.
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  Presiona "Crear y Enviar" para generar una invitación real.
                </p>
              </div>
            ) : (
              <div className="bg-green-50 dark:bg-green-900 border-2 border-green-400 dark:border-green-600 rounded-xl p-4 mb-4">
                <p className="text-sm font-semibold text-green-800 dark:text-green-200 flex items-center gap-2">
                  <Check size={18} />
                  Invitación creada exitosamente. ¡Lista para compartir!
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Usa los botones de abajo para enviar por WhatsApp o descargar el código QR.
                </p>
              </div>
            )}

            <div className="text-center space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 p-5 rounded-xl border-2 border-blue-200 dark:border-gray-500">
                <p className="text-sm text-gray-700 dark:text-gray-200 mb-2">
                  <strong className="font-semibold">Para:</strong> {qrInvitation.invited_email}
                </p>
                <p className="text-base text-gray-900 dark:text-white mb-2 font-mono font-bold">
                  <strong className="font-semibold">Código:</strong> {qrInvitation.invitation_code.toUpperCase()}
                  {previewMode && <span className="text-xs text-yellow-600 ml-2">(temporal)</span>}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <strong className="font-semibold">Expira:</strong> {new Date(qrInvitation.expires_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>

              <div className="qr-code-canvas bg-white p-8 rounded-2xl inline-block shadow-xl border-4 border-gray-200">
                <QRCodeSVG
                  value={getInvitationLink(qrInvitation.invitation_code)}
                  size={280}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="bg-blue-50 dark:bg-gray-700 p-4 rounded-xl">
                <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                  Escanea el código QR con la cámara de tu teléfono para abrir la invitación directamente
                </p>
              </div>

              {!previewMode && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={downloadQRCode}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-2 text-base"
                    >
                      <FileDown size={22} />
                      Descargar QR
                    </button>
                    <button
                      onClick={() => shareViaWhatsApp(qrInvitation, organizationName)}
                      className="bg-green-500 hover:bg-green-600 text-white px-6 py-4 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-2 text-base"
                    >
                      <MessageCircle size={22} />
                      WhatsApp
                    </button>
                  </div>
                  <button
                    onClick={() => copyInvitationLink(qrInvitation.invitation_code)}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-4 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-2 text-base"
                  >
                    <Copy size={22} />
                    Copiar Link de Invitación
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
