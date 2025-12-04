import type { BeneficiaryBank } from './BeneficiaryBank.ts'

export const bankAccountDetailsResponseTypeEnum = {
  BANK_ACCOUNT: 'BANK_ACCOUNT',
} as const

export type BankAccountDetailsResponseTypeEnumKey = (typeof bankAccountDetailsResponseTypeEnum)[keyof typeof bankAccountDetailsResponseTypeEnum]

export type BankAccountDetailsResponse = {
  type: BankAccountDetailsResponseTypeEnumKey
  /**
   * @description Routing number of a bank account (or SWIFT/BIC code for international transfer). For incoming cheques, this field might be null.
   * @type string
   */
  routing_number?: string | null
  /**
   * @description Account number of a bank account (or IBAN code for international transfer). For incoming cheques, this field might be null.
   * @type string
   */
  account_number?: string | null
  /**
   * @description Description of the transfer.
   * @type string
   */
  description?: string | null
  beneficiary_bank?: (BeneficiaryBank & any) | null
  /**
   * @description Fed reference number for incoming wires
   * @type string
   */
  fed_reference_number?: string | null
  /**
   * @description External Memo populated by the sender
   * @type string
   */
  external_memo?: string | null
}
