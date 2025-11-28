import type { BrexCashDetails } from '../models/ts/BrexCashDetails.ts'
import { createReceivingAccountTypeFaker } from './createReceivingAccountTypeFaker.ts'
import { faker } from '@faker-js/faker'

export function createBrexCashDetailsFaker(data?: Partial<BrexCashDetails>): BrexCashDetails {
  return Object.assign({}, { type: createReceivingAccountTypeFaker(), id: faker.string.alpha() })
}
