import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { BankDetails } from '../models/ts/BankDetails.ts'
import { bankTypeSchema } from './bankTypeSchema.ts'

export const bankDetailsSchema = z.object({
  name: z.string().describe('\nThe name of the bank\n'),
  type: z.lazy(() => bankTypeSchema).and(z.any()),
}) as unknown as ToZod<BankDetails>

export type BankDetailsSchema = BankDetails
