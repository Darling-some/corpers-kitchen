// EDIT THIS FILE with your real bank account details. Customers can choose
// between any of these at checkout — handy backup if one bank's network
// or app is having issues. Add or remove entries freely; at least one is
// required.
export interface BankAccount {
  label: string
  accountName: string
  bankName: string
  accountNumber: string
}

export const BANK_ACCOUNTS: BankAccount[] = [
  {
    label: 'Opay',
    accountName: 'Nwaogu Darlington Chigaemezu',
    bankName: 'Opay',
    accountNumber: '8146649547',
  },
  {
    label: 'Zenith Bank',
    accountName: 'Nwaogu Darlington Chigaemezu',
    bankName: 'Zenith Bank',
    accountNumber: '2266358479',
  },
  // Add more accounts here if you have them, e.g. PalmPay, Kuda, Moniepoint:
  // {
  //   label: 'PalmPay',
  //   accountName: 'YOUR NAME HERE',
  //   bankName: 'PalmPay',
  //   accountNumber: '0000000000',
  // },
]
