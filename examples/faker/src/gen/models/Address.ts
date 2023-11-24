export type Address = {
  /**
   * @type string | undefined
   * @example 437 Lytton
   */
  street?: string
  /**
   * @type string | undefined
   * @example Palo Alto
   */
  city?: string
  /**
   * @type string | undefined
   * @example CA
   */
  state?: string
  /**
   * @type string | undefined
   * @example 94301
   */
  zip?: string
  /**
   * @type array | undefined
   */
  identifier?: [
    number,
    string,
    'NW' | 'NE' | 'SW' | 'SE',
  ]
}
