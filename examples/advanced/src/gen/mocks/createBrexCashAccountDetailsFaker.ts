import { faker } from '@faker-js/faker'
import type { BrexCashAccountDetails } from '../models/ts/BrexCashAccountDetails.ts'
import { createOriginatingAccountTypeFaker } from './createOriginatingAccountTypeFaker.ts'

export function createBrexCashAccountDetailsFaker(_data?: Partial<BrexCashAccountDetails>): BrexCashAccountDetails {
  return Object.assign({}, { type: createOriginatingAccountTypeFaker(), id: faker.string.alpha() })
}
