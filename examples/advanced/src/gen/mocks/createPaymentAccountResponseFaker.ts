import type { PaymentAccountResponse } from '../models/ts/PaymentAccountResponse.ts'
import { createPaymentAccountDetailsResponseFaker } from './createPaymentAccountDetailsResponseFaker.ts'

export function createPaymentAccountResponseFaker(data?: Partial<PaymentAccountResponse>): PaymentAccountResponse {
  return {
    ...{ details: createPaymentAccountDetailsResponseFaker() },
    ...(data || {}),
  }
}
