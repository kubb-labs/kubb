import { faker } from '@faker-js/faker'
import type { CreateIncomingTransferRequest } from '../models/ts/CreateIncomingTransferRequest.ts'
import { createCounterPartyIncomingTransferFaker } from './createCounterPartyIncomingTransferFaker.ts'
import { createMoneyFaker } from './createMoneyFaker.ts'
import { createReceivingAccountFaker } from './createReceivingAccountFaker.ts'

export function createCreateIncomingTransferRequestFaker(data?: Partial<CreateIncomingTransferRequest>): CreateIncomingTransferRequest {
  return {
    ...{
      counterparty: createCounterPartyIncomingTransferFaker(),
      receiving_account: createReceivingAccountFaker(),
      amount: createMoneyFaker(),
      description: faker.string.alpha(),
    },
    ...(data || {}),
  }
}
