import { faker } from '@faker-js/faker'
import type { ReceivingAccount } from '../models/ts/ReceivingAccount.ts'
import { createBrexCashDetailsFaker } from './createBrexCashDetailsFaker.ts'

/**
 * @description Receiving account details for the transfer
 */
export function createReceivingAccountFaker(data?: Partial<ReceivingAccount>): ReceivingAccount {
  return data || faker.helpers.arrayElement<any>([Object.assign({}, createBrexCashDetailsFaker(), { type: 'BREX_CASH' })])
}
