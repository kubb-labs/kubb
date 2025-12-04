import { faker } from '@faker-js/faker'
import type { PaymentType } from '../models/ts/PaymentType.ts'

export function createPaymentTypeFaker() {
  return faker.helpers.arrayElement<PaymentType>(['ACH', 'DOMESTIC_WIRE', 'CHEQUE', 'INTERNATIONAL_WIRE', 'BOOK_TRANSFER'])
}
