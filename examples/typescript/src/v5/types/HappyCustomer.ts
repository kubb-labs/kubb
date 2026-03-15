import type { Customer } from './Customer.ts'

export type HappyCustomer = Customer & {
  /**
   * @type boolean | undefined
   */
  isHappy?: true
}
