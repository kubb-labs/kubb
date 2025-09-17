import type {
  ResellersControllerGetResellerPathParams,
  ResellersControllerGetReseller200,
  ResellersControllerGetResellerQueryResponse,
} from '../../models/ts/resellersController/ResellersControllerGetReseller.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { resellerSchema } from '../resellerSchema.ts'
import { z } from 'zod/v4'

export const resellersControllerGetResellerPathParamsSchema = z.object({
  id: z.coerce.number(),
}) as unknown as ToZod<ResellersControllerGetResellerPathParams>

export type ResellersControllerGetResellerPathParamsSchema = ResellersControllerGetResellerPathParams

export const resellersControllerGetReseller200Schema = resellerSchema as unknown as ToZod<ResellersControllerGetReseller200>

export type ResellersControllerGetReseller200Schema = ResellersControllerGetReseller200

export const resellersControllerGetResellerQueryResponseSchema =
  resellersControllerGetReseller200Schema as unknown as ToZod<ResellersControllerGetResellerQueryResponse>

export type ResellersControllerGetResellerQueryResponseSchema = ResellersControllerGetResellerQueryResponse
