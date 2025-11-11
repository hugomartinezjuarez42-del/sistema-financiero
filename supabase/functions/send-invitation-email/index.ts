import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InvitationEmailRequest {
  invitationId: string
  recipientEmail: string
  organizationName: string
  inviterEmail: string
  role: string
  invitationCode: string
  expiresAt: string
}

async function sendEmail(data: InvitationEmailRequest) {
  const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173'
  const acceptUrl = appUrl + '/accept-invite/' + data.invitationCode.toUpperCase()
  
  const roleText = data.role === 'admin' ? 'Administrador' : 'Miembro'
  const expiresDate = new Date(data.expiresAt)
  const expiresStr = expiresDate.toLocaleDateString('es-ES')
  
  const htmlContent = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invitación</title></head><body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f3f4f6"><table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#fff;border-radius:8px"><tr><td style="background:#2563eb;padding:40px;text-align:center;border-radius:8px 8px 0 0"><h1 style="margin:0;color:#fff;font-size:28px">Invitación a Colaborar</h1></td></tr><tr><td style="padding:40px"><p>¡Hola!</p><p><strong>' + data.inviterEmail + '</strong> te ha invitado a <strong>' + data.organizationName + '</strong> como <strong>' + roleText + '</strong>.</p><div style="background-color:#eff6ff;border-left:4px solid #2563eb;padding:16px;margin:24px 0"><p style="margin:0;font-size:14px">📋 <strong>Detalles:</strong><br>Organización: ' + data.organizationName + '<br>Rol: ' + roleText + '<br>Código: <strong style="font-size:24px;letter-spacing:2px;color:#2563eb">' + data.invitationCode.toUpperCase() + '</strong><br>Expira: ' + expiresStr + '</p></div><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0"><a href="' + acceptUrl + '" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:16px 48px;border-radius:8px;font-weight:600">Aceptar Invitación</a></td></tr></table><p style="font-size:14px;color:#666">O visita:<br><a href="' + acceptUrl + '" style="color:#2563eb;word-break:break-all">' + acceptUrl + '</a></p><div style="background-color:#fef3c7;border-left:4px solid #f59e0b;padding:16px;margin:24px 0"><p style="margin:0;font-size:13px">⚡ <strong>Registro automático:</strong> Al hacer clic en el botón, podrás crear tu cuenta y unirte a la organización en un solo paso.</p></div></td></tr></table></td></tr></table></body></html>'

  const textContent = 'Invitación a ' + data.organizationName + '\n\n' + data.inviterEmail + ' te ha invitado como ' + roleText + '.\n\nCódigo: ' + data.invitationCode.toUpperCase() + '\nPara aceptar: ' + acceptUrl + '\n\nExpira: ' + expiresStr

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: 'Invitaciones <onboarding@resend.dev>',
      to: [data.recipientEmail],
      subject: 'Invitación a unirte a ' + data.organizationName + ' (Código: ' + data.invitationCode.toUpperCase() + ')',
      html: htmlContent,
      text: textContent,
    }),
  })

  const responseData = await res.json()

  if (!res.ok) {
    throw new Error('Failed to send email: ' + JSON.stringify(responseData))
  }

  return responseData
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { invitationId, recipientEmail, organizationName, inviterEmail, role, invitationCode, expiresAt } = await req.json()

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set')
    }

    const emailResult = await sendEmail({
      invitationId,
      recipientEmail,
      organizationName,
      inviterEmail,
      role,
      invitationCode,
      expiresAt,
    })

    const { error: updateError } = await supabaseClient
      .from('organization_invitations')
      .update({ 
        email_sent: true,
        email_sent_at: new Date().toISOString(),
        resend_message_id: emailResult.id
      })
      .eq('id', invitationId)

    if (updateError) {
      console.error('Failed to update invitation:', updateError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        emailId: emailResult.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
