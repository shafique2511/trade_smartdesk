import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function sendJson(response, status, payload) {
  response.status(status).json(payload)
}

function getBearerToken(request) {
  const header = request.headers.authorization || ''
  return header.startsWith('Bearer ') ? header.slice(7) : null
}

function sanitizeTelegramResult(result) {
  if (!result || typeof result !== 'object') return result

  return {
    ok: result.ok,
    result: result.result
      ? {
          message_id: result.result.message_id,
          date: result.result.date,
          chat: result.result.chat
            ? {
                id: result.result.chat.id,
                title: result.result.chat.title,
                username: result.result.chat.username,
                type: result.result.chat.type,
              }
            : undefined,
        }
      : undefined,
    description: result.description,
    error_code: result.error_code,
  }
}

async function callTelegram(botToken, method, body) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const result = await response.json()

  if (!response.ok || !result.ok) {
    throw new Error(result.description || 'Telegram request failed.')
  }

  return sanitizeTelegramResult(result)
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    sendJson(response, 405, { ok: false, error: 'Method not allowed.' })
    return
  }

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    sendJson(response, 500, { ok: false, error: 'Telegram server environment variables are not configured.' })
    return
  }

  const accessToken = getBearerToken(request)
  if (!accessToken) {
    sendJson(response, 401, { ok: false, error: 'Missing Supabase access token.' })
    return
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey)
  const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  })

  const { data: userData, error: userError } = await authClient.auth.getUser(accessToken)
  if (userError || !userData.user) {
    sendJson(response, 401, { ok: false, error: 'Invalid Supabase session.' })
    return
  }

  const { action, message, tradeId, signalType, messageType } = request.body || {}
  const userId = userData.user.id

  const { data: settings, error: settingsError } = await serviceClient
    .from('telegram_settings')
    .select('bot_token, channel_id, default_footer, branding_enabled')
    .eq('user_id', userId)
    .maybeSingle()

  if (settingsError) {
    sendJson(response, 500, { ok: false, error: settingsError.message })
    return
  }

  if (!settings?.bot_token || !settings?.channel_id) {
    sendJson(response, 400, { ok: false, error: 'Telegram bot token and channel ID are required.' })
    return
  }

  try {
    if (action === 'test_connection') {
      const result = await callTelegram(settings.bot_token, 'getMe', {})
      await serviceClient
        .from('telegram_settings')
        .update({ is_connected: true })
        .eq('user_id', userId)

      sendJson(response, 200, { ok: true, result })
      return
    }

    if (action === 'send_message') {
      if (!message || typeof message !== 'string') {
        sendJson(response, 400, { ok: false, error: 'Message is required.' })
        return
      }

      const result = await callTelegram(settings.bot_token, 'sendMessage', {
        chat_id: settings.channel_id,
        text: message,
        disable_web_page_preview: true,
      })

      const { data: signalLog } = await serviceClient
        .from('signal_logs')
        .insert({
          user_id: userId,
          trade_id: tradeId || null,
          signal_type: signalType || messageType || 'telegram_message',
          message,
          sent_to_telegram: true,
          telegram_response: result,
        })
        .select('*')
        .single()

      sendJson(response, 200, { ok: true, result, signalLog })
      return
    }

    sendJson(response, 400, { ok: false, error: 'Unsupported Telegram action.' })
  } catch (error) {
    if (action === 'send_message' && message) {
      await serviceClient.from('signal_logs').insert({
        user_id: userId,
        trade_id: tradeId || null,
        signal_type: signalType || messageType || 'telegram_message_error',
        message,
        sent_to_telegram: false,
        telegram_response: { ok: false, error: error instanceof Error ? error.message : 'Telegram request failed.' },
      })
    }

    sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : 'Telegram request failed.' })
  }
}
