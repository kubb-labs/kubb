import type { PaymentAccountResponse } from './PaymentAccountResponse.ts'

export type VendorResponse = {
  /**
   * @description Vendor ID: Can be passed to /transfers endpoint to specify counterparty.\n
   * @type string
   */
  id: string
  /**
   * @type string
   */
  company_name?: string | null
  /**
   * @type string
   */
  email?: string | null
  /**
   * @type string
   */
  phone?: string | null
  /**
   * @type array
   */
  payment_accounts?: PaymentAccountResponse[] | null
}
