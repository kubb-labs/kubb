export const paramsStatusEnum = {
  placed: 'placed',
  approved: 'approved',
  delivered: 'delivered',
} as const

export type ParamsStatusEnumKey = (typeof paramsStatusEnum)[keyof typeof paramsStatusEnum]

export type ParamsStatusEnum = ParamsStatusEnumKey

export const orderOrderTypeEnum = {
  foo: 'foo',
  bar: 'bar',
} as const

export type OrderOrderTypeEnumKey = (typeof orderOrderTypeEnum)[keyof typeof orderOrderTypeEnum]

export type OrderOrderTypeEnum = OrderOrderTypeEnumKey

export const orderStatusEnum = {
  placed: 'placed',
  approved: 'approved',
  delivered: 'delivered',
} as const

export type OrderStatusEnumKey = (typeof orderStatusEnum)[keyof typeof orderStatusEnum]

export type OrderStatusEnum = OrderStatusEnumKey

export const orderHttpStatusEnum = {
  ok: 200,
  not_found: 400,
} as const

export type OrderHttpStatusEnumKey = (typeof orderHttpStatusEnum)[keyof typeof orderHttpStatusEnum]

export type OrderHttpStatusEnum = OrderHttpStatusEnumKey

export type Order = {
  /**
   * @example 10
   * @type integer | undefined
   */
  id?: number
  /**
   * @example 198772
   * @type integer | undefined
   */
  petId?: number
  /**
   * @type object | undefined
   */
  params?: {
    /**
     * @description Order Status
     * @example approved
     * @type string
     */
    status: ParamsStatusEnumKey
    /**
     * @type string
     */
    type: string
  }
  /**
   * @example 7
   * @type integer | undefined
   */
  quantity?: number
  /**
   * @type string | undefined
   */
  orderType?: OrderOrderTypeEnumKey
  /**
   * @description Order Status
   * @example approved
   * @type string | undefined
   */
  type?: string
  /**
   * @type string | undefined
   */
  shipDate?: string
  /**
   * @description Order Status
   * @example approved
   * @type string | undefined
   */
  status?: OrderStatusEnumKey
  /**
   * @description HTTP Status
   * @example 200
   * @type number | undefined
   */
  http_status?: OrderHttpStatusEnumKey
  /**
   * @type boolean | undefined
   */
  complete?: boolean
}
