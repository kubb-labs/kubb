import type { BankDetails } from '../models/ts/BankDetails.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { bankTypeSchema } from './bankTypeSchema.ts'
import { z } from 'zod'

export const bankDetailsSchema = z.object({
  name: z.string().describe('\nThe name of the bank\n'),
  type: z.lazy(() => bankTypeSchema).and(z.any()),
}) as unknown as ToZod<BankDetails>

export type BankDetailsSchema = BankDetails
