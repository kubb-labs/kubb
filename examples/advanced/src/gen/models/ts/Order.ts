export const orderParamsStatusEnum = {
  placed: 'placed',
  approved: 'approved',
  delivered: 'delivered',
} as const

export type OrderParamsStatusEnumKey = (typeof orderParamsStatusEnum)[keyof typeof orderParamsStatusEnum]

export const orderOrderTypeEnum = {
  foo: 'foo',
  bar: 'bar',
} as const

export type OrderOrderTypeEnumKey = (typeof orderOrderTypeEnum)[keyof typeof orderOrderTypeEnum]

export const orderStatusEnum = {
  placed: 'placed',
  approved: 'approved',
  delivered: 'delivered',
} as const

export type OrderStatusEnumKey = (typeof orderStatusEnum)[keyof typeof orderStatusEnum]

export const orderHttpStatusEnum = {
  ok: 200,
  not_found: 400,
} as const

export type OrderHttpStatusEnumKey = (typeof orderHttpStatusEnum)[keyof typeof orderHttpStatusEnum]

export type Order = {
  id?: number
  petId?: number
  params?: {
    /**
     * @description Order Status
     */
    status: OrderParamsStatusEnumKey
    type: string
  }
  quantity?: number
  orderType?: OrderOrderTypeEnumKey
  /**
   * @description Order Status
   */
  type?: string
  shipDate?: string
  /**
   * @description Order Status
   */
  status?: OrderStatusEnumKey
  /**
   * @description HTTP Status
   */
  http_status?: OrderHttpStatusEnumKey
  complete?: boolean
}
