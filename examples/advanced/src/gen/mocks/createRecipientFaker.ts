import { faker } from '@faker-js/faker'
import type { Recipient } from '../models/ts/Recipient.ts'
import { createRecipientTypeFaker } from './createRecipientTypeFaker.ts'

export function createRecipientFaker(data?: Partial<Recipient>): Recipient {
  return {
    ...{ type: createRecipientTypeFaker(), id: faker.string.alpha() },
    ...(data || {}),
  }
}
