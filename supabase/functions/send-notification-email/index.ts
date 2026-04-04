import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

type DeliveryRecord = {
  id: string
  notification_id: string
  user_id: string
  type: 'comment' | 'message'
  status: 'queued' | 'sent' | 'skipped' | 'failed'
  recipient_email: string | null
}

type NotificationRecord = {
  id: string
  user_id: string
  actor_id: string
  type: 'comment' | 'message'
  post_id: string | null
  conversation_id: string | null
  message: string | null
  actor?: {
    display_name: string
    username: string
  } | null
  recipient?: {
    display_name: string
    email_notify_comment: boolean
    email_notify_message: boolean
  } | null
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? ''
const emailFrom = Deno.env.get('EMAIL_FROM') ?? ''
const appUrl = (Deno.env.get('VITE_APP_URL') ?? 'http://localhost:5174').replace(/\/+$/, '')
const webhookSecret = Deno.env.get('EMAIL_WEBHOOK_SECRET') ?? ''

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

function extractDeliveryId(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null

  const record = payload as Record<string, unknown>
  if (typeof record.delivery_id === 'string') return record.delivery_id

  if (record.record && typeof record.record === 'object') {
    const webhookRecord = record.record as Record<string, unknown>
    if (typeof webhookRecord.id === 'string') return webhookRecord.id
  }

  return null
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function truncate(value: string, max = 180) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

function buildEmail(notification: NotificationRecord) {
  const actorName = notification.actor?.display_name ?? 'Iu'
  const snippet = truncate(notification.message?.trim() || '')

  if (notification.type === 'comment') {
    const targetUrl = notification.post_id ? `${appUrl}/afisxo/${notification.post_id}` : `${appUrl}/fonto`
    return {
      subject: `${actorName} komentis vian afiŝon`,
      html: `
        <div style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#111827;">
          <h1 style="font-size:20px;margin:0 0 16px;">Nova komento ĉe Verdkomunumo</h1>
          <p style="margin:0 0 12px;"><strong>${escapeHtml(actorName)}</strong> komentis vian afiŝon.</p>
          ${snippet ? `<blockquote style="margin:16px 0;padding:12px 16px;border-left:4px solid #16a34a;background:#f0fdf4;color:#14532d;">${escapeHtml(snippet)}</blockquote>` : ''}
          <p style="margin:20px 0 0;">
            <a href="${targetUrl}" style="display:inline-block;padding:10px 16px;border-radius:10px;background:#16a34a;color:#ffffff;text-decoration:none;font-weight:600;">Vidi la komenton</a>
          </p>
        </div>
      `.trim(),
      text: `${actorName} komentis vian afiŝon.${snippet ? `\n\n"${snippet}"` : ''}\n\nVidu ĝin: ${targetUrl}`,
    }
  }

  const targetUrl = notification.conversation_id ? `${appUrl}/mesagxoj/${notification.conversation_id}` : `${appUrl}/mesagxoj`
  return {
    subject: `${actorName} sendis al vi mesaĝon`,
    html: `
      <div style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#111827;">
        <h1 style="font-size:20px;margin:0 0 16px;">Nova mesaĝo ĉe Verdkomunumo</h1>
        <p style="margin:0 0 12px;"><strong>${escapeHtml(actorName)}</strong> sendis al vi novan mesaĝon.</p>
        ${snippet ? `<blockquote style="margin:16px 0;padding:12px 16px;border-left:4px solid #2563eb;background:#eff6ff;color:#1d4ed8;">${escapeHtml(snippet)}</blockquote>` : ''}
        <p style="margin:20px 0 0;">
          <a href="${targetUrl}" style="display:inline-block;padding:10px 16px;border-radius:10px;background:#16a34a;color:#ffffff;text-decoration:none;font-weight:600;">Malfermi la konversacion</a>
        </p>
      </div>
    `.trim(),
    text: `${actorName} sendis al vi novan mesaĝon.${snippet ? `\n\n"${snippet}"` : ''}\n\nMalfermu ĝin: ${targetUrl}`,
  }
}

async function updateDelivery(deliveryId: string, patch: Record<string, unknown>) {
  const { error } = await supabaseAdmin
    .from('notification_email_deliveries')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', deliveryId)

  if (error) {
    console.error('Failed to update delivery', deliveryId, error)
  }
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  if (!supabaseUrl || !serviceRoleKey || !resendApiKey || !emailFrom) {
    return json({ error: 'Missing required env vars' }, 500)
  }

  if (webhookSecret) {
    const received = request.headers.get('x-email-webhook-secret')
    if (received !== webhookSecret) {
      return json({ error: 'Unauthorized' }, 401)
    }
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return json({ error: 'Invalid JSON payload' }, 400)
  }

  const deliveryId = extractDeliveryId(payload)
  if (!deliveryId) {
    return json({ error: 'Missing delivery_id' }, 400)
  }

  const { data: delivery, error: deliveryError } = await supabaseAdmin
    .from('notification_email_deliveries')
    .select('id, notification_id, user_id, type, status, recipient_email')
    .eq('id', deliveryId)
    .single()

  if (deliveryError || !delivery) {
    return json({ error: 'Delivery not found' }, 404)
  }

  const currentDelivery = delivery as DeliveryRecord
  if (currentDelivery.status !== 'queued') {
    return json({ ok: true, skipped: 'already-processed' })
  }

  const { data: notification, error: notificationError } = await supabaseAdmin
    .from('notifications')
    .select('id, user_id, actor_id, type, post_id, conversation_id, message, actor:profiles!actor_id(display_name, username), recipient:profiles!user_id(display_name, email_notify_comment, email_notify_message)')
    .eq('id', currentDelivery.notification_id)
    .single()

  if (notificationError || !notification) {
    await updateDelivery(currentDelivery.id, { status: 'failed', error: 'notification_not_found' })
    return json({ error: 'Notification not found' }, 404)
  }

  const currentNotification = notification as unknown as NotificationRecord

  const preferenceEnabled =
    currentNotification.type === 'comment'
      ? currentNotification.recipient?.email_notify_comment !== false
      : currentNotification.recipient?.email_notify_message !== false

  if (!preferenceEnabled) {
    await updateDelivery(currentDelivery.id, { status: 'skipped', error: 'preference_disabled' })
    return json({ ok: true, skipped: 'preference-disabled' })
  }

  const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(currentDelivery.user_id)
  const recipientEmail = authUser?.user?.email ?? null

  if (authUserError || !recipientEmail) {
    await updateDelivery(currentDelivery.id, { status: 'skipped', error: 'recipient_email_missing' })
    return json({ ok: true, skipped: 'recipient-email-missing' })
  }

  const message = buildEmail(currentNotification)
  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${resendApiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: emailFrom,
      to: [recipientEmail],
      subject: message.subject,
      html: message.html,
      text: message.text,
      tags: [{ name: 'notification_type', value: currentNotification.type }],
    }),
  })

  const resendBody = await resendResponse.json().catch(() => ({}))

  if (!resendResponse.ok) {
    await updateDelivery(currentDelivery.id, {
      recipient_email: recipientEmail,
      status: 'failed',
      error: typeof resendBody?.message === 'string' ? resendBody.message : 'resend_request_failed',
    })
    return json({ error: 'Failed to send email', details: resendBody }, 502)
  }

  await updateDelivery(currentDelivery.id, {
    recipient_email: recipientEmail,
    status: 'sent',
    provider_message_id: typeof resendBody?.id === 'string' ? resendBody.id : null,
    error: null,
    sent_at: new Date().toISOString(),
  })

  return json({ ok: true, delivery_id: currentDelivery.id })
})
