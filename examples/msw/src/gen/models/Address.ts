export type Address = {
  /**
   * @type string | undefined
   * @example 437 Lytton
   */
  street?: string | undefined
  /**
   * @type string | undefined
   * @example Palo Alto
   */
  city?: string | undefined
  /**
   * @type string | undefined
   * @example CA
   */
  state?: string | undefined
  /**
   * @type string | undefined
   * @example 94301
   */
  zip?: string | undefined
  /**
   * @type array | undefined
   */
  identifier?: [number, string, 'NW' | 'NE' | 'SW' | 'SE'] | undefined
}
