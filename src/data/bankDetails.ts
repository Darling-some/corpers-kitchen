export interface BankAccount { label: string; accountName: string; bankName: string; accountNumber: string }
// Order here = display order (primary first). Admin can switch accounts on/off live.
export const BANK_ACCOUNTS: BankAccount[] = [
  { label: 'Zenith Bank', accountName: 'Nwaogu Darlington Chigaemezu', bankName: 'Zenith Bank', accountNumber: '2266358479' },
  { label: 'Opay', accountName: 'Nwaogu Darlington Chigaemezu', bankName: 'Opay', accountNumber: '8146649547' },
]
