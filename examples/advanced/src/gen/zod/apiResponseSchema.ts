import type { ApiResponse } from '../models/ts/ApiResponse.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

export const apiResponseSchema = z.object({
  code: z.int().optional(),
  type: z.string().optional(),
  message: z.string().optional(),
}) as unknown as ToZod<ApiResponse>

export type ApiResponseSchema = ApiResponse
