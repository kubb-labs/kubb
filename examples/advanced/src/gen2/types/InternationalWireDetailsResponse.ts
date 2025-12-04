import type { Address } from './Address.ts'

export const internationalWireDetailsResponseTypeEnum = {
  INTERNATIONAL_WIRE: 'INTERNATIONAL_WIRE',
} as const

export type InternationalWireDetailsResponseTypeEnumKey =
  (typeof internationalWireDetailsResponseTypeEnum)[keyof typeof internationalWireDetailsResponseTypeEnum]

export type InternationalWireDetailsResponse = {
  type: InternationalWireDetailsResponseTypeEnumKey
  /**
   * @description Payment Instrument ID that can be passed to the /transfers endpoint to trigger a transfer.\nThe type of the payment instrument dictates the method.\n
   * @type string
   */
  payment_instrument_id: string
  /**
   * @description Counterparty\'s `SWIFT` code
   * @type string
   */
  swift_code: string
  /**
   * @description Counterparty\'s international bank account number
   * @type string
   */
  iban: string
  /**
   * @description Name of counterparty\'s bank
   * @type string
   */
  beneficiary_bank_name?: string | null
  /**
   * @description Company business address (must be in the US; no PO box or virtual/forwarding addresses allowed).
   * @type object
   */
  address: Address
}
