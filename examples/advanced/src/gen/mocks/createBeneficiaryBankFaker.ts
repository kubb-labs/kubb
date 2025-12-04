import { faker } from '@faker-js/faker'
import type { BeneficiaryBank } from '../models/ts/BeneficiaryBank.ts'
import { createAddressFaker } from './createAddressFaker.ts'

export function createBeneficiaryBankFaker(data?: Partial<BeneficiaryBank>): BeneficiaryBank {
  return {
    ...{ name: faker.string.alpha(), address: Object.assign({}, createAddressFaker()) },
    ...(data || {}),
  }
}
