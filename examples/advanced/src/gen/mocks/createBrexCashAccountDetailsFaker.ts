import type { BrexCashAccountDetails } from '../models/ts/BrexCashAccountDetails.ts'
import { createOriginatingAccountTypeFaker } from './createOriginatingAccountTypeFaker.ts'
import { faker } from '@faker-js/faker'

export function createBrexCashAccountDetailsFaker(data?: Partial<BrexCashAccountDetails>): BrexCashAccountDetails {
  return Object.assign({}, { type: createOriginatingAccountTypeFaker(), id: faker.string.alpha() })
}
