import type { BookTransferDetails } from '../models/ts/BookTransferDetails.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { counterPartyTypeSchema } from './counterPartyTypeSchema.ts'
import { recipientSchema } from './recipientSchema.ts'
import { z } from 'zod'

export const bookTransferDetailsSchema = z.object({
  type: z.lazy(() => counterPartyTypeSchema),
  recipient: z.lazy(() => recipientSchema),
}) as unknown as ToZod<BookTransferDetails>

export type BookTransferDetailsSchema = BookTransferDetails
