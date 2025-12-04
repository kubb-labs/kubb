import { faker } from '@faker-js/faker'
import type { BrexCashAccountDetailsResponse } from '../models/ts/BrexCashAccountDetailsResponse.ts'
import { createOriginatingAccountResponseTypeFaker } from './createOriginatingAccountResponseTypeFaker.ts'

export function createBrexCashAccountDetailsResponseFaker(_data?: Partial<BrexCashAccountDetailsResponse>): BrexCashAccountDetailsResponse {
  return Object.assign({}, { type: createOriginatingAccountResponseTypeFaker(), id: faker.string.alpha() })
}
