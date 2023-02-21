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
  status?: string | undefined
  /**
   * @type boolean | undefined
   */
  complete?: boolean | undefined
}
