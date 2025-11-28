import type { RecipientType } from '../models/ts/RecipientType.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { z } from 'zod'

/**
 * @description Specifies the type of the recipient. \n`ACCOUNT_ID` is the ID of a Brex Business account.\n`PAYMENT_INSTRUMENT_ID` is the ID of Payment Instrument of the receiving Brex account.\n
 */
export const recipientTypeSchema = z
  .enum(['ACCOUNT_ID', 'PAYMENT_INSTRUMENT_ID'])
  .describe(
    'Specifies the type of the recipient. \n`ACCOUNT_ID` is the ID of a Brex Business account.\n`PAYMENT_INSTRUMENT_ID` is the ID of Payment Instrument of the receiving Brex account.\n',
  ) as unknown as ToZod<RecipientType>

export type RecipientTypeSchema = RecipientType
