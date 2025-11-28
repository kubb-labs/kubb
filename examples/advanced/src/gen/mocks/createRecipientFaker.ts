import type { Recipient } from '../models/ts/Recipient.ts'
import { createRecipientTypeFaker } from './createRecipientTypeFaker.ts'
import { faker } from '@faker-js/faker'

export function createRecipientFaker(data?: Partial<Recipient>): Recipient {
  return {
    ...{ type: createRecipientTypeFaker(), id: faker.string.alpha() },
    ...(data || {}),
  }
}
