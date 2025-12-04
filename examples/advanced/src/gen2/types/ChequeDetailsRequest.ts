import type { Address } from './Address.ts'

export const chequeDetailsRequestTypeEnum = {
  CHEQUE: 'CHEQUE',
} as const

export type ChequeDetailsRequestTypeEnumKey = (typeof chequeDetailsRequestTypeEnum)[keyof typeof chequeDetailsRequestTypeEnum]

export type ChequeDetailsRequest = {
  type: ChequeDetailsRequestTypeEnumKey
  /**
   * @description Company business address (must be in the US; no PO box or virtual/forwarding addresses allowed).
   * @type object
   */
  mailing_address: Address
  /**
   * @maxLength 40
   * @type string
   */
  recipient_name: string
  /**
   * @type string
   */
  beneficiary_name?: string | null
}
