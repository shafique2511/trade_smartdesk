import { supabase } from './supabase'

export type TelegramAction = 'test_connection' | 'send_message'
export type TelegramMessageType = 'new_signal' | 'tp_update' | 'sl_update' | 'be_update' | 'daily_recap' | 'weekly_report'

type TelegramRequest = {
  action: TelegramAction
  message?: string
  tradeId?: string
  signalType?: string
  messageType?: TelegramMessageType
}

export type TelegramApiResponse = {
  ok: boolean
  error?: string
  result?: unknown
  signalLog?: unknown
}

export async function callTelegramApi(payload: TelegramRequest): Promise<TelegramApiResponse> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  if (!token) {
    return { ok: false, error: 'You must be logged in before using Telegram.' }
  }

  const response = await fetch('/api/telegram', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const result = await response.json().catch(() => null) as TelegramApiResponse | null

  if (!response.ok) {
    return {
      ok: false,
      error: result?.error ?? 'Telegram API request failed.',
    }
  }

  return result ?? { ok: false, error: 'Telegram API returned an empty response.' }
}
