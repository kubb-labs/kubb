import type { PaymentAccountRequest } from './PaymentAccountRequest.ts'

export type CreateVendorRequest = {
  /**
   * @description Name for vendor. The name must be unique.
   * @type string
   */
  company_name: string
  /**
   * @description Email for vendor.
   * @type string, email
   */
  email?: string | null
  /**
   * @description Phone number for vendor.
   * @type string
   */
  phone?: string | null
  /**
   * @description Payment accounts associated with the vendor.
   * @type array
   */
  payment_accounts?: PaymentAccountRequest[] | null
}
