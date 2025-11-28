import type { ReceivingAccountType } from '../models/ts/ReceivingAccountType.ts'
import { faker } from '@faker-js/faker'

export function createReceivingAccountTypeFaker() {
  return faker.helpers.arrayElement<ReceivingAccountType>(['BREX_CASH'])
}
