import { faker } from '@faker-js/faker'
import type { OriginatingAccountType } from '../models/ts/OriginatingAccountType.ts'

export function createOriginatingAccountTypeFaker() {
  return faker.helpers.arrayElement<OriginatingAccountType>(['BREX_CASH'])
}
