import type { PaymentAccountRequest } from '../models/ts/PaymentAccountRequest.ts'
import { createPaymentAccountDetailsFaker } from './createPaymentAccountDetailsFaker.ts'

export function createPaymentAccountRequestFaker(data?: Partial<PaymentAccountRequest>): PaymentAccountRequest {
  return {
    ...{ details: createPaymentAccountDetailsFaker() },
    ...(data || {}),
  }
}
