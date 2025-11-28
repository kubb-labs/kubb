import type { OriginatingAccountType } from '../models/ts/OriginatingAccountType.ts'
import { faker } from '@faker-js/faker'

export function createOriginatingAccountTypeFaker() {
  return faker.helpers.arrayElement<OriginatingAccountType>(['BREX_CASH'])
}
