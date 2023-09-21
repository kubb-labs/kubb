export enum OrderStatus {
  'placed' = 'placed',
  'approved' = 'approved',
  'delivered' = 'delivered',
}
export enum OrderHttpStatus {
  'OrderHttpStatus_200' = 200,
  'OrderHttpStatus_400' = 400,
  'OrderHttpStatus_500' = 500,
}
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
   * @type string | undefined date-time
   */
  shipDate?: string
  /**
   * @description Order Status
   * @type string | undefined
   * @example approved
   */
  status?: OrderStatus
  /**
   * @description HTTP Status
   * @type number | undefined
   * @example 200
   */
  http_status?: OrderHttpStatus
  /**
   * @type boolean | undefined
   */
  complete?: boolean
}
