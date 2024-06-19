export const orderStatus = {
  placed: 'placed',
  approved: 'approved',
  delivered: 'delivered',
} as const
export type OrderStatusType = (typeof orderStatus)[keyof typeof orderStatus]
export const orderHttpStatus = {
  ok: 200,
  not_found: 400,
} as const
export type OrderHttpStatusType = (typeof orderHttpStatus)[keyof typeof orderHttpStatus]
export type OrderType = {
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
   * @type string | undefined, date-time
   */
  shipDate?: string
  /**
   * @description Order Status
   * @type string | undefined
   */
  status?: OrderStatusType
  /**
   * @description HTTP Status
   * @type number | undefined
   */
  http_status?: OrderHttpStatusType
  /**
   * @type boolean | undefined
   */
  complete?: boolean
}
