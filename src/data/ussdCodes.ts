// Generic public USSD codes. Tapping one only opens the phone dialer with the
// code ready; the customer still navigates the bank's menu themselves.
export interface UssdBank { bankName: string; code: string }
export const USSD_BANKS: UssdBank[] = [
  { bankName: 'GTBank', code: '*737#' },
  { bankName: 'Access Bank', code: '*901#' },
  { bankName: 'Zenith Bank', code: '*966#' },
  { bankName: 'UBA', code: '*919#' },
  { bankName: 'First Bank', code: '*894#' },
]
