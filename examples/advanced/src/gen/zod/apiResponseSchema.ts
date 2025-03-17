import type { ApiResponse } from '../models/ts/ApiResponse.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from 'zod'

export const apiResponseSchema = z.object({
  code: z.number().int().optional(),
  type: z.string().optional(),
  message: z.string().optional(),
}) as unknown as ToZod<ApiResponse>

export type ApiResponseSchema = ApiResponse
