import { faker } from '@faker-js/faker'
import type { BrexCashDetails } from '../models/ts/BrexCashDetails.ts'
import { createReceivingAccountTypeFaker } from './createReceivingAccountTypeFaker.ts'

export function createBrexCashDetailsFaker(_data?: Partial<BrexCashDetails>): BrexCashDetails {
  return Object.assign({}, { type: createReceivingAccountTypeFaker(), id: faker.string.alpha() })
}
