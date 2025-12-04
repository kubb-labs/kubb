import { faker } from '@faker-js/faker'
import type { OriginatingAccount } from '../models/ts/OriginatingAccount.ts'
import { createBrexCashAccountDetailsFaker } from './createBrexCashAccountDetailsFaker.ts'

/**
 * @description Originating account details for the transfer
 */
export function createOriginatingAccountFaker(data?: Partial<OriginatingAccount>): OriginatingAccount {
  return data || faker.helpers.arrayElement<any>([Object.assign({}, createBrexCashAccountDetailsFaker(), { type: 'BREX_CASH' })])
}
