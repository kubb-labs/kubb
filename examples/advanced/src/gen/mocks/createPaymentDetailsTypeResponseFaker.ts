import { faker } from '@faker-js/faker'
import type { PaymentDetailsTypeResponse } from '../models/ts/PaymentDetailsTypeResponse.ts'

export function createPaymentDetailsTypeResponseFaker() {
  return faker.helpers.arrayElement<PaymentDetailsTypeResponse>(['ACH', 'DOMESTIC_WIRE', 'CHEQUE', 'INTERNATIONAL_WIRE'])
}
