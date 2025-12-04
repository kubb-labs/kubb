import type { AccountClass } from './AccountClass.ts'
import type { AccountType } from './AccountType.ts'

export const ACHDetailsRequestTypeEnum = {
  ACH: 'ACH',
} as const

export type ACHDetailsRequestTypeEnumKey = (typeof ACHDetailsRequestTypeEnum)[keyof typeof ACHDetailsRequestTypeEnum]

export type ACHDetailsRequest = {
  type: ACHDetailsRequestTypeEnumKey
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
