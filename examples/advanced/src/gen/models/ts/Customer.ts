import type { Address } from './Address.ts'

export const customerParamsStatusEnum = {
  placed: 'placed',
  approved: 'approved',
  delivered: 'delivered',
} as const

export type CustomerParamsStatusEnumKey = (typeof customerParamsStatusEnum)[keyof typeof customerParamsStatusEnum]

export type Customer = {
  id?: number
  username?: string
  params?: {
    /**
     * @description Order Status
     */
    status: CustomerParamsStatusEnumKey
    type: string
  }
  address?: Array<Address>
}
