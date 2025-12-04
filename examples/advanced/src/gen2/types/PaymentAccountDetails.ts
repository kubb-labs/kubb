import type { ACHDetailsRequest } from './ACHDetailsRequest.ts'
import type { ChequeDetailsRequest } from './ChequeDetailsRequest.ts'
import type { DomesticWireDetailsRequest } from './DomesticWireDetailsRequest.ts'

/**
 * @description Payment Instruments associated with the vendor.\nEach vendor can only have one payment account per payment instrument type. For instance, a vendor may have associated details for each of ACH, DOMESTIC_WIRE, and CHEQUE, but they cannot have 2 entries for ACH. If you modify a vendor\'s existing payment instrument type with new details, it will overwrite any previous data.\n
 */
export type PaymentAccountDetails = ACHDetailsRequest | DomesticWireDetailsRequest | ChequeDetailsRequest
