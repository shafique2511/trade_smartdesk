export type SignalTemplateType =
  | 'new_signal'
  | 'tp1_hit'
  | 'tp2_hit'
  | 'tp3_hit'
  | 'tp4_hit'
  | 'sl_hit'
  | 'move_sl_be'
  | 'trade_closed'
  | 'trade_cancelled'

export type SignalTemplateOption = {
  label: string
  value: SignalTemplateType
}
