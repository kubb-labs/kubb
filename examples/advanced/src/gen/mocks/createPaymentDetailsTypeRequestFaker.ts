import { faker } from '@faker-js/faker'
import type { PaymentDetailsTypeRequest } from '../models/ts/PaymentDetailsTypeRequest.ts'

export function createPaymentDetailsTypeRequestFaker() {
  return faker.helpers.arrayElement<PaymentDetailsTypeRequest>(['ACH', 'DOMESTIC_WIRE', 'CHEQUE'])
}
