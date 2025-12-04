import { faker } from '@faker-js/faker'
import type { OriginatingAccountResponseType } from '../models/ts/OriginatingAccountResponseType.ts'

export function createOriginatingAccountResponseTypeFaker() {
  return faker.helpers.arrayElement<OriginatingAccountResponseType>(['BREX_CASH'])
}
