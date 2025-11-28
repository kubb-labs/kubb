import type { BankConnection } from '../models/ts/BankConnection.ts'
import { createBalanceFaker } from './createBalanceFaker.ts'
import { createBankDetailsFaker } from './createBankDetailsFaker.ts'
import { faker } from '@faker-js/faker'

export function createBankConnectionFaker(data?: Partial<BankConnection>): BankConnection {
  return {
    ...{
      id: faker.string.alpha(),
      bank_details: Object.assign({}, createBankDetailsFaker(), undefined),
      brex_account_id: faker.string.alpha(),
      last_four: faker.string.alpha(),
      available_balance: Object.assign({}, createBalanceFaker()),
      current_balance: Object.assign({}, createBalanceFaker()),
    },
    ...(data || {}),
  }
}
