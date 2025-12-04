import { faker } from '@faker-js/faker'
import type { Transfer } from '../models/ts/Transfer.ts'
import { createCounterPartyResponseFaker } from './createCounterPartyResponseFaker.ts'
import { createMoneyFaker } from './createMoneyFaker.ts'
import { createOriginatingAccountResponseFaker } from './createOriginatingAccountResponseFaker.ts'
import { createPaymentTypeFaker } from './createPaymentTypeFaker.ts'
import { createTransferCancellationReasonFaker } from './createTransferCancellationReasonFaker.ts'

export function createTransferFaker(data?: Partial<Transfer>): Transfer {
  return {
    ...{
      id: faker.string.alpha(),
      counterparty: Object.assign({}, createCounterPartyResponseFaker()),
      description: faker.string.alpha(),
      payment_type: createPaymentTypeFaker(),
      amount: createMoneyFaker(),
      process_date: faker.date.anytime().toISOString().substring(0, 10),
      originating_account: createOriginatingAccountResponseFaker(),
      status: faker.helpers.arrayElement<any>(['working', 'idle']),
      cancellation_reason: Object.assign({}, createTransferCancellationReasonFaker()),
      estimated_delivery_date: faker.date.anytime().toISOString().substring(0, 10),
      creator_user_id: faker.string.alpha(),
      created_at: faker.date.anytime().toISOString().substring(0, 10),
      display_name: faker.string.alpha(),
      external_memo: faker.string.alpha({ length: 90 }),
      is_ppro_enabled: faker.datatype.boolean(),
    },
    ...(data || {}),
  }
}
