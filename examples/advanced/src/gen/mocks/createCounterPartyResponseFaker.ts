import { faker } from '@faker-js/faker'
import type { CounterPartyResponse } from '../models/ts/CounterPartyResponse.ts'
import { createVendorDetailsResponseFaker } from './createVendorDetailsResponseFaker.ts'

/**
 * @description Counterparty Details for the transfer - Currently only supports vendors that are returned in the \nresponse from the /vendors endpoint\nBOOK_TRANSFER is a limited feature. Please reach out if you are interested.\n
 */
export function createCounterPartyResponseFaker(data?: Partial<CounterPartyResponse>): CounterPartyResponse {
  return data || faker.helpers.arrayElement<any>([Object.assign({}, createVendorDetailsResponseFaker(), { type: 'VENDOR' })])
}
