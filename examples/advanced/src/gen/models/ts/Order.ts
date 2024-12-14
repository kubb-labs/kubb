export const orderOrderTypeEnum = {
  foo: 'foo',
  bar: 'bar',
} as const

export type OrderOrderTypeEnum = (typeof orderOrderTypeEnum)[keyof typeof orderOrderTypeEnum]

export const orderStatusEnum = {
  placed: 'placed',
  approved: 'approved',
  delivered: 'delivered',
} as const

export type OrderStatusEnum = (typeof orderStatusEnum)[keyof typeof orderStatusEnum]

export const orderHttpStatusEnum = {
  ok: 200,
  not_found: 400,
} as const

export type OrderHttpStatusEnum = (typeof orderHttpStatusEnum)[keyof typeof orderHttpStatusEnum]

export type Order = {
  /**
   * @type integer | undefined, int64
   */
  id?: number
  /**
   * @type integer | undefined, int64
   */
  petId?: number
  /**
   * @type integer | undefined, int32
   */
  quantity?: number
  /**
   * @type string | undefined
   */
  orderType?: OrderOrderTypeEnum
  /**
   * @description Order Status
   * @type string | undefined
   */
  type?: string
  /**
   * @type string | undefined, date-time
   */
  shipDate?: string
  /**
   * @description Order Status
   * @type string | undefined
   */
  status?: OrderStatusEnum
  /**
   * @description HTTP Status
   * @type number | undefined
   */
  http_status?: OrderHttpStatusEnum
  /**
   * @type boolean | undefined
   */
  complete?: boolean
}
