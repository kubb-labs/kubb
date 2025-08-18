import type { ApiResponse } from '../models/ts/ApiResponse.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

export const apiResponseSchema = z.object({
  code: z.optional(z.int()),
  type: z.optional(z.string()),
  message: z.optional(z.string()),
}) as unknown as ToZod<ApiResponse>

export type ApiResponseSchema = ApiResponse
