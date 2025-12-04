import { faker } from '@faker-js/faker'
import type { OriginatingAccountResponse } from '../models/ts/OriginatingAccountResponse.ts'
import { createBrexCashAccountDetailsResponseFaker } from './createBrexCashAccountDetailsResponseFaker.ts'

/**
 * @description Originating account details for the transfer
 */
export function createOriginatingAccountResponseFaker(data?: Partial<OriginatingAccountResponse>): OriginatingAccountResponse {
  return data || faker.helpers.arrayElement<any>([Object.assign({}, createBrexCashAccountDetailsResponseFaker(), { type: 'BREX_CASH' })])
}
