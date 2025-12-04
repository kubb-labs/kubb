import { faker } from '@faker-js/faker'
import type { CreateTransferRequest } from '../models/ts/CreateTransferRequest.ts'
import { createApprovalTypeFaker } from './createApprovalTypeFaker.ts'
import { createCounterPartyFaker } from './createCounterPartyFaker.ts'
import { createMoneyFaker } from './createMoneyFaker.ts'
import { createOriginatingAccountFaker } from './createOriginatingAccountFaker.ts'

export function createCreateTransferRequestFaker(data?: Partial<CreateTransferRequest>): CreateTransferRequest {
  return {
    ...{
      counterparty: createCounterPartyFaker(),
      amount: createMoneyFaker(),
      description: faker.string.alpha(),
      external_memo: faker.string.alpha({ length: 90 }),
      originating_account: Object.assign({}, createOriginatingAccountFaker(), undefined),
      approval_type: Object.assign({}, createApprovalTypeFaker()),
      is_ppro_enabled: faker.datatype.boolean(),
    },
    ...(data || {}),
  }
}
