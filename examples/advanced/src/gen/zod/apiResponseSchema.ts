import { z } from 'zod'
import type { ApiResponse } from '../models/ts/ApiResponse'

export const apiResponseSchema = z.object({
  code: z.coerce.number().optional(),
  type: z.coerce.string().optional(),
  message: z.coerce.string().optional(),
}) as z.ZodType<ApiResponse>
