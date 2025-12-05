import { faker } from '@faker-js/faker'
import type { PaymentAccountDetails } from '../models/ts/PaymentAccountDetails.ts'
import { createACHDetailsRequestFaker } from './createACHDetailsRequestFaker.ts'
import { createChequeDetailsRequestFaker } from './createChequeDetailsRequestFaker.ts'
import { createDomesticWireDetailsRequestFaker } from './createDomesticWireDetailsRequestFaker.ts'

/**
 * @description Payment Instruments associated with the vendor.\nEach vendor can only have one payment account per payment instrument type. For instance, a vendor may have associated details for each of ACH, DOMESTIC_WIRE, and CHEQUE, but they cannot have 2 entries for ACH. If you modify a vendor\'s existing payment instrument type with new details, it will overwrite any previous data.\n
 */
export function createPaymentAccountDetailsFaker(data?: Partial<PaymentAccountDetails>): PaymentAccountDetails {
  return (
    data ||
    faker.helpers.arrayElement<any>([
      Object.assign({}, createDomesticWireDetailsRequestFaker(), { type: 'DOMESTIC_WIRE' }),
      Object.assign({}, createACHDetailsRequestFaker(), { type: 'ACH' }),
      Object.assign({}, createChequeDetailsRequestFaker(), { type: 'CHEQUE' }),
    ])
  )
}
