import { faker } from '@faker-js/faker'
import type { BankDetails } from '../models/ts/BankDetails.ts'
import { createBankTypeFaker } from './createBankTypeFaker.ts'

export function createBankDetailsFaker(data?: Partial<BankDetails>): BankDetails {
  return {
    ...{ name: faker.string.alpha(), type: Object.assign({}, createBankTypeFaker(), undefined) },
    ...(data || {}),
  }
}
