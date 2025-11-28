import type { BookTransferDetailsResponse } from '../models/ts/BookTransferDetailsResponse.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { counterPartyResponseSchema } from './counterPartyResponseSchema.ts'
import { counterPartyResponseTypeSchema } from './counterPartyResponseTypeSchema.ts'
import { z } from 'zod'

export const bookTransferDetailsResponseSchema = z
  .lazy(() => counterPartyResponseSchema)
  .and(
    z.object({
      type: z.literal('BOOK_TRANSFER'),
    }),
  )
  .and(
    z.object({
      type: z.lazy(() => counterPartyResponseTypeSchema),
      deposit_account_id: z.string().describe('This feature is currently limited to certain customers, please reach out if you are interested'),
    }),
  ) as unknown as ToZod<BookTransferDetailsResponse>

export type BookTransferDetailsResponseSchema = BookTransferDetailsResponse
