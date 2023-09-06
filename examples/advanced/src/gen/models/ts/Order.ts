export const OrderStatus = {
  placed: 'placed',
  approved: 'approved',
  delivered: 'delivered',
} as const
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus]
export const OrderHttpStatus = {
  '200': 200,
  '400': 400,
  '500': 500,
} as const
export type OrderHttpStatus = (typeof OrderHttpStatus)[keyof typeof OrderHttpStatus]
export type Order = {
  /**
   * @type integer | undefined int64
   * @example 10
   */
  id?: number | undefined
  /**
   * @type integer | undefined int64
   * @example 198772
   */
  petId?: number | undefined
  /**
   * @type integer | undefined int32
   * @example 7
   */
  quantity?: number | undefined
  /**
   * @type string | undefined date-time
   */
  shipDate?: Date | undefined
  /**
   * @description Order Status
   * @type string | undefined
   * @example approved
   */
  status?: OrderStatus | undefined
  /**
   * @description Http Status
   * @type number | undefined
   * @example 200
   */
  http_status?: OrderHttpStatus | undefined
  /**
   * @type boolean | undefined
   */
  complete?: boolean | undefined
}
