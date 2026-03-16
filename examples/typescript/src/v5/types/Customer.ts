import type { Address } from './Address.ts'

export enum CustomerParamsStatusEnum {
  placed = 'placed',
  approved = 'approved',
  delivered = 'delivered',
}

export interface Customer {
  /**
   * @example 100000
   * @type integer | undefined
   */
  id?: number
  /**
   * @type object | undefined
   */
  params?: {
    /**
     * @description Order Status
     * @example approved
     * @type string
     */
    status: CustomerParamsStatusEnum
    /**
     * @type string
     */
    type: string
  }
  /**
   * @example fehguy
   * @type string | undefined
   */
  username?: string
  /**
   * @type array | undefined
   */
  address?: Address[]
}
