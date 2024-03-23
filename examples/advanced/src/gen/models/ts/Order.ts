export const OrderOrderTypeEnum = {
  'foo': 'foo',
  'bar': 'bar',
} as const
export type OrderOrderTypeEnum = (typeof OrderOrderTypeEnum)[keyof typeof OrderOrderTypeEnum]
export const OrderStatusEnum = {
  'placed': 'placed',
  'approved': 'approved',
  'delivered': 'delivered',
} as const
export type OrderStatusEnum = (typeof OrderStatusEnum)[keyof typeof OrderStatusEnum]
export const OrderHttpStatusEnum = {
  'ok': 200,
  'not_found': 400,
} as const
export type OrderHttpStatusEnum = (typeof OrderHttpStatusEnum)[keyof typeof OrderHttpStatusEnum]
export type Order = {
  /**
   * @type integer | undefined int64
   */
  id?: number
  /**
   * @type integer | undefined int64
   */
  petId?: number
  /**
   * @type integer | undefined int32
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
   * @type string | undefined date-time
   */
  shipDate?: Date
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
