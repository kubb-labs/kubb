export interface Address {
  /**
   * @type string | undefined
   */
  streetName?: string
  /**
   * @type string | undefined
   */
  streetNumber?: string
  /**
   * @example Palo Alto
   * @type string | undefined
   */
  city?: string
  /**
   * @example CA
   * @type string | undefined
   */
  state?: string
  /**
   * @example 94301
   * @type string | undefined
   */
  zip?: string
}
