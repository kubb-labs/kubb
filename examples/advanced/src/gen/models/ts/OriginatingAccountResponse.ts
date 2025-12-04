import type { BrexCashAccountDetailsResponse } from './BrexCashAccountDetailsResponse.ts'

/**
 * @description Originating account details for the transfer
 */
export type OriginatingAccountResponse = BrexCashAccountDetailsResponse & {
  type: 'BREX_CASH'
}
