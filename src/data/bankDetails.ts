// EDIT THIS FILE with your real bank account details. Customers can choose
// between any of these at checkout — handy backup if one bank's network
// or app is having issues. Order here sets the default display order
// (primary first); admin can also enable/disable individual accounts
// live from the dashboard without touching this file.
export interface BankAccount {
  label: string
  accountName: string
  bankName: string
  accountNumber: string
}

export const BANK_ACCOUNTS: BankAccount[] = [
  {
    label: 'Zenith Bank',
    accountName: 'Nwaogu Darlington Chigaemezu',
    bankName: 'Zenith Bank',
    accountNumber: '2266358479',
  },
  {
    label: 'Opay',
    accountName: 'Nwaogu Darlington Chigaemezu',
    bankName: 'Opay',
    accountNumber: '8146649547',
  },
]
