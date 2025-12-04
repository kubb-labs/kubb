import { faker } from '@faker-js/faker'
import type { Money } from '../models/ts/Money.ts'

/**
 * @description \nMoney fields can be signed or unsigned. Fields are signed (an unsigned value will be interpreted as positive). The amount of money will be represented in the smallest denomination\nof the currency indicated. For example, USD 7.00 will be represented in cents with an amount of 700.\n
 */
export function createMoneyFaker(data?: Partial<Money>): Money {
  return {
    ...{ amount: faker.number.int(), currency: faker.string.alpha() },
    ...(data || {}),
  }
}
