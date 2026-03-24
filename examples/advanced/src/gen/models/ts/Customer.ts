import type { Address } from './Address.ts'

export const customerParamsStatusEnum = {
  placed: 'placed',
  approved: 'approved',
  delivered: 'delivered',
} as const

export type CustomerParamsStatusEnumKey = (typeof customerParamsStatusEnum)[keyof typeof customerParamsStatusEnum]

export type Customer = {
  /**
   * @type integer | undefined, int64
   */
  id?: number
  /**
   * @type string | undefined
   */
  username?: string
  /**
   * @type object | undefined
   */
  params?: {
    /**
     * @description Order Status
     * @type string
     */
    status: CustomerParamsStatusEnumKey
    /**
     * @type string
     */
    type: string
  }
  /**
   * @type array | undefined
   */
  address?: Array<Address>
}
