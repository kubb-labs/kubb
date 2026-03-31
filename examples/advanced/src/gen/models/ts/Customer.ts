import type { Address } from './Address.ts'

export const customerParamsStatusEnum = {
  placed: 'placed',
  approved: 'approved',
  delivered: 'delivered',
} as const

export type CustomerParamsStatusEnumKey = (typeof customerParamsStatusEnum)[keyof typeof customerParamsStatusEnum]

/**
 * @type object
 */
export type Customer = {
  /**
   * @example 100000
   * @type integer | undefined
   */
  id?: number
  /**
   * @example fehguy
   * @type string | undefined
   */
  username?: string
  /**
   * @type object | undefined
   */
  params?: {
    /**
     * @description Order Status
     * @example approved
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
