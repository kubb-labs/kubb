import { faker } from '@faker-js/faker'
import type { Balance } from '../models/ts/Balance.ts'
import { createMoneyFaker } from './createMoneyFaker.ts'

export function createBalanceFaker(data?: Partial<Balance>): Balance {
  return {
    ...{ amount: createMoneyFaker(), as_of_date: faker.date.anytime().toISOString().substring(0, 10) },
    ...(data || {}),
  }
}
