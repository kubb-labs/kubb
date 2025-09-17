import type { GetWeldCreditsResponse } from '../models/ts/GetWeldCreditsResponse.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

export const getWeldCreditsResponseSchema = z.object({
  activeWeldCredits: z.number(),
  consumedWeldCredits: z.number(),
  totalWeldCredits: z.number(),
}) as unknown as ToZod<GetWeldCreditsResponse>

export type GetWeldCreditsResponseSchema = GetWeldCreditsResponse
