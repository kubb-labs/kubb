import type { RecipientType } from '../models/ts/RecipientType.ts'
import { faker } from '@faker-js/faker'

/**
 * @description Specifies the type of the recipient. \n`ACCOUNT_ID` is the ID of a Brex Business account.\n`PAYMENT_INSTRUMENT_ID` is the ID of Payment Instrument of the receiving Brex account.\n
 */
export function createRecipientTypeFaker() {
  return faker.helpers.arrayElement<RecipientType>(['ACCOUNT_ID', 'PAYMENT_INSTRUMENT_ID'])
}
