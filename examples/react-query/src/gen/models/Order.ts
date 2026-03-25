// version: 1.0.11

export const orderStatusEnum = {
  placed: 'placed',
  approved: 'approved',
  delivered: 'delivered',
} as const

export type OrderStatusEnumKey = (typeof orderStatusEnum)[keyof typeof orderStatusEnum]

export const orderHttpStatusEnum = {
  '200': 200,
  '400': 400,
  '500': 500,
} as const

export type OrderHttpStatusEnumKey = (typeof orderHttpStatusEnum)[keyof typeof orderHttpStatusEnum]

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
   * @example 7
   * @type integer | undefined
   */
  quantity?: number
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
