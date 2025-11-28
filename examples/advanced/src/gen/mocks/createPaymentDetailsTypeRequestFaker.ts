import type { PaymentDetailsTypeRequest } from '../models/ts/PaymentDetailsTypeRequest.ts'
import { faker } from '@faker-js/faker'

export function createPaymentDetailsTypeRequestFaker() {
  return faker.helpers.arrayElement<PaymentDetailsTypeRequest>(['ACH', 'DOMESTIC_WIRE', 'CHEQUE'])
}
