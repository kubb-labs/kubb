import type { AccountClass } from './AccountClass.ts'
import type { AccountType } from './AccountType.ts'
import type { PaymentDetailsTypeRequest } from './PaymentDetailsTypeRequest.ts'

export type ACHDetailsRequest = {
  /**
   * @type string
   */
  type: PaymentDetailsTypeRequest
  /**
   * @description The routing number must follow proper format.
   * @type string
   */
  routing_number: string
  /**
   * @type string
   */
  account_number: string
  /**
   * @type string
   */
  account_type: AccountType
  /**
   * @type string
   */
  account_class: AccountClass
  /**
   * @type string
   */
  beneficiary_name?: string | null
}
