import type { OriginatingAccountResponseType } from '../models/ts/OriginatingAccountResponseType.ts'
import { faker } from '@faker-js/faker'

export function createOriginatingAccountResponseTypeFaker() {
  return faker.helpers.arrayElement<OriginatingAccountResponseType>(['BREX_CASH'])
}
