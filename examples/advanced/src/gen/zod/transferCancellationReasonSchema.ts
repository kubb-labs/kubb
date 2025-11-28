import type { TransferCancellationReason } from '../models/ts/TransferCancellationReason.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { z } from 'zod'

/**
 * @description `USER_CANCELLED`: The transfer was canceled.\n`INSUFFICIENT_FUNDS`: The transfer could not be sent due to insufficient funds.\n`APPROVAL_DENIED`: The transfer was not sent because it was denied.\n`BLOCKED_BY_POSITIVE_PAY`: The transfer was blocked because of the ACH debit settings.\n
 */
export const transferCancellationReasonSchema = z
  .enum(['USER_CANCELLED', 'INSUFFICIENT_FUNDS', 'APPROVAL_DENIED', 'BLOCKED_BY_POSITIVE_PAY'])
  .describe(
    '`USER_CANCELLED`: The transfer was canceled.\n`INSUFFICIENT_FUNDS`: The transfer could not be sent due to insufficient funds.\n`APPROVAL_DENIED`: The transfer was not sent because it was denied.\n`BLOCKED_BY_POSITIVE_PAY`: The transfer was blocked because of the ACH debit settings.\n',
  ) as unknown as ToZod<TransferCancellationReason>

export type TransferCancellationReasonSchema = TransferCancellationReason
