import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { ApiResponse } from '../models/ts/ApiResponse.ts'

export const apiResponseSchema = z.object({
  code: z.optional(z.number().int()),
  type: z.optional(z.string()),
  message: z.optional(z.string()),
}) as unknown as ToZod<ApiResponse>

export type ApiResponseSchema = ApiResponse
