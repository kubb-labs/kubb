export const vendorDetailsTypeEnum = {
  VENDOR: 'VENDOR',
} as const

export type VendorDetailsTypeEnumKey = (typeof vendorDetailsTypeEnum)[keyof typeof vendorDetailsTypeEnum]

export type VendorDetails = {
  type: VendorDetailsTypeEnumKey
  /**
   * @description ID of the vendor\'s payment instrument: this will dictate the payment method and the\ncounterparty of the transaction.\nThe payment instrument ID is returned from the /vendors response and the type of the\ninstrument will dictate the payment method.\neg. Passing an instrument ID of type ACH will trigger an ACH payment to the associated vendor.\nSince a payment instrument can be updated while retaining the same payment_instrument_id, \nplease make sure to double check the details.\n
   * @type string
   */
  payment_instrument_id: string
}
