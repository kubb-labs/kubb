/**
 * @description Company business address (must be in the US; no PO box or virtual/forwarding addresses allowed).
 */
export type Address = {
  /**
   * @description Address line 1, no PO Box.
   * @type string
   */
  line1?: string | null
  /**
   * @description Address line 2 (e.g., apartment, suite, unit, or building).
   * @type string
   */
  line2?: string | null
  /**
   * @description City, district, suburb, town, or village.
   * @type string
   */
  city?: string | null
  /**
   * @description For US-addressed the 2-letter State abbreviation. For international-addresses the county, providence, or region.
   * @type string
   */
  state?: string | null
  /**
   * @description Two-letter country code (ISO 3166-1 alpha-2).
   * @type string
   */
  country?: string | null
  /**
   * @description ZIP or postal code.
   * @type string
   */
  postal_code?: string | null
  /**
   * @description Phone number.
   * @type string
   */
  phone_number?: string | null
}
