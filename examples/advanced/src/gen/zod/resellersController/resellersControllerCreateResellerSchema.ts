import type {
  ResellersControllerCreateReseller201,
  ResellersControllerCreateResellerMutationRequest,
  ResellersControllerCreateResellerMutationResponse,
} from '../../models/ts/resellersController/ResellersControllerCreateReseller.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { createResellerDtoSchema } from '../createResellerDtoSchema.ts'
import { resellerSchema } from '../resellerSchema.ts'

export const resellersControllerCreateReseller201Schema = resellerSchema as unknown as ToZod<ResellersControllerCreateReseller201>

export type ResellersControllerCreateReseller201Schema = ResellersControllerCreateReseller201

export const resellersControllerCreateResellerMutationRequestSchema =
  createResellerDtoSchema as unknown as ToZod<ResellersControllerCreateResellerMutationRequest>

export type ResellersControllerCreateResellerMutationRequestSchema = ResellersControllerCreateResellerMutationRequest

export const resellersControllerCreateResellerMutationResponseSchema =
  resellersControllerCreateReseller201Schema as unknown as ToZod<ResellersControllerCreateResellerMutationResponse>

export type ResellersControllerCreateResellerMutationResponseSchema = ResellersControllerCreateResellerMutationResponse
