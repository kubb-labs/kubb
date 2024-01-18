import { z } from 'zod'
import type { ApiResponse } from '../models/ts/ApiResponse'

export const apiResponseSchema: z.ZodType<ApiResponse> = z.object({
  'code': z.number().optional(),
  'type': z.string().optional(),
  'message': z.string().optional(),
})
