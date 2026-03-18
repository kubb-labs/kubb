import type { Customer } from './Customer.ts'

export type UnhappyCustomer = Customer & {
  /**
   * @type string | undefined
   */
  reasonToBeUnhappy?: string
  /**
   * @type boolean | undefined
   */
  isHappy?: false
}
