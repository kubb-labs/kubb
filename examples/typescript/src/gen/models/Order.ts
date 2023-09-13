export enum OrderStatus {
  'placed' = 'placed',
  'approved' = 'approved',
  'delivered' = 'delivered',
}
export enum OrderHttpStatus {
  '200' = 200,
  '400' = 400,
  '500' = 500,
}
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
  shipDate?: string | undefined
  /**
   * @description Order Status
   * @type string | undefined
   * @example approved
   */
  status?: OrderStatus | undefined
  /**
   * @description HTTP Status
   * @type number | undefined
   * @example 200
   */
  http_status?: OrderHttpStatus | undefined
  /**
   * @type boolean | undefined
   */
  complete?: boolean | undefined
}
