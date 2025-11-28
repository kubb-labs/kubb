import type { BookTransferDetailsResponse } from '../models/ts/BookTransferDetailsResponse.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { counterPartyResponseTypeSchema } from './counterPartyResponseTypeSchema.ts'
import { z } from 'zod'

export const bookTransferDetailsResponseSchema = z.object({
  type: z.lazy(() => counterPartyResponseTypeSchema),
  deposit_account_id: z.string().describe('This feature is currently limited to certain customers, please reach out if you are interested'),
}) as unknown as ToZod<BookTransferDetailsResponse>

export type BookTransferDetailsResponseSchema = BookTransferDetailsResponse
