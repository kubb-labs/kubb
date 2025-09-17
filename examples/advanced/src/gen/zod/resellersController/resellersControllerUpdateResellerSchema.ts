import type {
  ResellersControllerUpdateResellerPathParams,
  ResellersControllerUpdateReseller200,
  ResellersControllerUpdateResellerMutationRequest,
  ResellersControllerUpdateResellerMutationResponse,
} from '../../models/ts/resellersController/ResellersControllerUpdateReseller.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { resellerSchema } from '../resellerSchema.ts'
import { updateResellerDtoSchema } from '../updateResellerDtoSchema.ts'
import { z } from 'zod/v4'

export const resellersControllerUpdateResellerPathParamsSchema = z.object({
  id: z.coerce.number(),
}) as unknown as ToZod<ResellersControllerUpdateResellerPathParams>

export type ResellersControllerUpdateResellerPathParamsSchema = ResellersControllerUpdateResellerPathParams

export const resellersControllerUpdateReseller200Schema = resellerSchema as unknown as ToZod<ResellersControllerUpdateReseller200>

export type ResellersControllerUpdateReseller200Schema = ResellersControllerUpdateReseller200

export const resellersControllerUpdateResellerMutationRequestSchema =
  updateResellerDtoSchema as unknown as ToZod<ResellersControllerUpdateResellerMutationRequest>

export type ResellersControllerUpdateResellerMutationRequestSchema = ResellersControllerUpdateResellerMutationRequest

export const resellersControllerUpdateResellerMutationResponseSchema =
  resellersControllerUpdateReseller200Schema as unknown as ToZod<ResellersControllerUpdateResellerMutationResponse>

export type ResellersControllerUpdateResellerMutationResponseSchema = ResellersControllerUpdateResellerMutationResponse
