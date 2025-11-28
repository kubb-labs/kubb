import type { CounterPartyResponse } from '../models/ts/CounterPartyResponse.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { vendorDetailsResponseSchema } from './vendorDetailsResponseSchema.ts'
import { z } from 'zod'

/**
 * @description Counterparty Details for the transfer - Currently only supports vendors that are returned in the \nresponse from the /vendors endpoint\nBOOK_TRANSFER is a limited feature. Please reach out if you are interested.\n
 */
export const counterPartyResponseSchema = z
  .lazy(() => vendorDetailsResponseSchema)
  .and(
    z.object({
      type: z.literal('VENDOR'),
    }),
  )
  .describe(
    'Counterparty Details for the transfer - Currently only supports vendors that are returned in the \nresponse from the /vendors endpoint\nBOOK_TRANSFER is a limited feature. Please reach out if you are interested.\n    ',
  ) as unknown as ToZod<CounterPartyResponse>

export type CounterPartyResponseSchema = CounterPartyResponse
