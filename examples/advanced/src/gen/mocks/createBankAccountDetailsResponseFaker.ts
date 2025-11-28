import type { BankAccountDetailsResponse } from '../models/ts/BankAccountDetailsResponse.ts'
import { createBeneficiaryBankFaker } from './createBeneficiaryBankFaker.ts'
import { createCounterPartyResponseTypeFaker } from './createCounterPartyResponseTypeFaker.ts'
import { faker } from '@faker-js/faker'

export function createBankAccountDetailsResponseFaker(data?: Partial<BankAccountDetailsResponse>): BankAccountDetailsResponse {
  return Object.assign(
    {},
    {
      type: createCounterPartyResponseTypeFaker(),
      routing_number: faker.string.alpha(),
      account_number: faker.string.alpha(),
      description: faker.string.alpha(),
      beneficiary_bank: Object.assign({}, createBeneficiaryBankFaker(), undefined),
      fed_reference_number: faker.string.alpha(),
      external_memo: faker.string.alpha(),
    },
  )
}
