import type { PaymentType } from '../models/ts/PaymentType.ts'
import { faker } from '@faker-js/faker'

export function createPaymentTypeFaker() {
  return faker.helpers.arrayElement<PaymentType>(['ACH', 'DOMESTIC_WIRE', 'CHEQUE', 'INTERNATIONAL_WIRE', 'BOOK_TRANSFER'])
}
