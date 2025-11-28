import type { BankDetails } from '../models/ts/BankDetails.ts'
import { createBankTypeFaker } from './createBankTypeFaker.ts'
import { faker } from '@faker-js/faker'

export function createBankDetailsFaker(data?: Partial<BankDetails>): BankDetails {
  return {
    ...{ name: faker.string.alpha(), type: Object.assign({}, createBankTypeFaker(), undefined) },
    ...(data || {}),
  }
}
