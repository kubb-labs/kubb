import type { BrexCashAccountDetailsResponse } from '../models/ts/BrexCashAccountDetailsResponse.ts'
import { createOriginatingAccountResponseTypeFaker } from './createOriginatingAccountResponseTypeFaker.ts'
import { faker } from '@faker-js/faker'

export function createBrexCashAccountDetailsResponseFaker(data?: Partial<BrexCashAccountDetailsResponse>): BrexCashAccountDetailsResponse {
  return Object.assign({}, { type: createOriginatingAccountResponseTypeFaker(), id: faker.string.alpha() })
}
