export const vendorDetailsResponseTypeEnum = {
  VENDOR: 'VENDOR',
} as const

export type VendorDetailsResponseTypeEnumKey = (typeof vendorDetailsResponseTypeEnum)[keyof typeof vendorDetailsResponseTypeEnum]

export type VendorDetailsResponse = {
  type: VendorDetailsResponseTypeEnumKey
  /**
   * @type string
   */
  payment_instrument_id: string
  /**
   * @description Vendor ID returned from `/vendors` endpoint
   * @type string
   */
  id: string
  /**
   * @description Routing number of a bank account (or SWIFT/BIC code for international transfer).
   * @type string
   */
  routing_number?: string | null
  /**
   * @description Account number of a bank account (or IBAN code for international transfer).
   * @type string
   */
  account_number?: string | null
}
