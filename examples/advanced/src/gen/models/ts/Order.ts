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
   * @example 10
   */
  id?: number
  /**
   * @type integer | undefined int64
   * @example 198772
   */
  petId?: number
  /**
   * @type integer | undefined int32
   * @example 7
   */
  quantity?: number
  /**
   * @type string | undefined
   */
  orderType?: OrderOrderTypeEnum
  /**
   * @description Order Status
   * @type string | undefined
   * @example approved
   */
  type?: string
  /**
   * @type string | undefined date-time
   */
  shipDate?: Date
  /**
   * @description Order Status
   * @type string | undefined
   * @example approved
   */
  status?: OrderStatusEnum
  /**
   * @description HTTP Status
   * @type number | undefined
   * @example 200
   */
  http_status?: OrderHttpStatusEnum
  /**
   * @type boolean | undefined
   */
  complete?: boolean
}
