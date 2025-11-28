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
  /**
   * @minLength 3
   * @maxLength 100
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
  orderType?: OrderOrderTypeEnumKey
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
  status?: OrderStatusEnumKey
  /**
   * @description HTTP Status
   * @type number | undefined
   */
  http_status?: OrderHttpStatusEnumKey
  /**
   * @type boolean | undefined
   */
  complete?: boolean
}
