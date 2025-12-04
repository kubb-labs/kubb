import type { Money } from './Money.ts'

export type Balance = {
  /**
   * @description \nMoney fields can be signed or unsigned. Fields are signed (an unsigned value will be interpreted as positive). The amount of money will be represented in the smallest denomination\nof the currency indicated. For example, USD 7.00 will be represented in cents with an amount of 700.\n
   * @type object
   */
  amount: Money
  /**
   * @type string, date
   */
  as_of_date: string
}
