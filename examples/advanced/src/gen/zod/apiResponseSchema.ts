import type { ApiResponse } from '../models/ts/ApiResponse'
import { z } from 'zod'

export const apiResponseSchema = z.object({
  code: z.number().optional(),
  type: z.string().optional(),
  message: z.string().optional(),
}) as z.ZodType<ApiResponse>
