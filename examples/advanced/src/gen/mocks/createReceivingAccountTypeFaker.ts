import { faker } from '@faker-js/faker'
import type { ReceivingAccountType } from '../models/ts/ReceivingAccountType.ts'

export function createReceivingAccountTypeFaker() {
  return faker.helpers.arrayElement<ReceivingAccountType>(['BREX_CASH'])
}
