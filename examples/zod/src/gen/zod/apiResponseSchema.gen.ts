import type { ApiResponseType } from '../ts/ApiResponseType.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from '../../zod.ts'

export const apiResponseSchema = z.object({
  code: z.number().int().optional(),
  type: z.string().optional(),
  message: z.string().optional(),
}) as unknown as ToZod<ApiResponseType>

export type ApiResponseSchema = ApiResponseType