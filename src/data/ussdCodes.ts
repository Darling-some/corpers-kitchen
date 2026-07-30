// Generic, publicly-published USSD codes for major Nigerian banks — NOT
// tied to any specific account. Dialing one of these opens the phone's own
// dialer pre-loaded with the code (a `tel:` link reliably does this on
// mobile), but the customer still has to navigate that bank's own USSD
// menu themselves to actually complete a transfer — this is a genuine
// convenience (no need to remember or type the code), not a fully
// automated payment. Update this list if any of these codes change.
export interface UssdBank {
  bankName: string
  code: string
}

export const USSD_BANKS: UssdBank[] = [
  { bankName: 'GTBank', code: '*737#' },
  { bankName: 'Access Bank', code: '*901#' },
  { bankName: 'Zenith Bank', code: '*966#' },
  { bankName: 'UBA', code: '*919#' },
  { bankName: 'First Bank', code: '*894#' },
]
