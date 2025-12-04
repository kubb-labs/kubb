import { faker } from '@faker-js/faker'
import type { PaymentAccountDetailsResponse } from '../models/ts/PaymentAccountDetailsResponse.ts'
import { createACHDetailsResponseFaker } from './createACHDetailsResponseFaker.ts'
import { createChequeDetailsResponseFaker } from './createChequeDetailsResponseFaker.ts'
import { createDomesticWireDetailsResponseFaker } from './createDomesticWireDetailsResponseFaker.ts'
import { createInternationalWireDetailsResponseFaker } from './createInternationalWireDetailsResponseFaker.ts'

export function createPaymentAccountDetailsResponseFaker(data?: Partial<PaymentAccountDetailsResponse>): PaymentAccountDetailsResponse {
  return (
    data ||
    faker.helpers.arrayElement<any>([
      Object.assign({}, createDomesticWireDetailsResponseFaker(), { type: 'DOMESTIC_WIRE' }),
      Object.assign({}, createACHDetailsResponseFaker(), { type: 'ACH' }),
      Object.assign({}, createChequeDetailsResponseFaker(), { type: 'CHEQUE' }),
      Object.assign({}, createInternationalWireDetailsResponseFaker(), { type: 'INTERNATIONAL_WIRE' }),
    ])
  )
}
