import type {
  PartsControllerSimulatePartPathParams,
  PartsControllerSimulatePart200,
  PartsControllerSimulatePartMutationRequest,
  PartsControllerSimulatePartMutationResponse,
} from '../../models/ts/partsController/PartsControllerSimulatePart.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { partSchema } from '../partSchema.ts'
import { simulatePartDtoSchema } from '../simulatePartDtoSchema.ts'
import { z } from 'zod/v4'

export const partsControllerSimulatePartPathParamsSchema = z.object({
  urn: z.string(),
}) as unknown as ToZod<PartsControllerSimulatePartPathParams>

export type PartsControllerSimulatePartPathParamsSchema = PartsControllerSimulatePartPathParams

export const partsControllerSimulatePart200Schema = partSchema as unknown as ToZod<PartsControllerSimulatePart200>

export type PartsControllerSimulatePart200Schema = PartsControllerSimulatePart200

export const partsControllerSimulatePartMutationRequestSchema = simulatePartDtoSchema as unknown as ToZod<PartsControllerSimulatePartMutationRequest>

export type PartsControllerSimulatePartMutationRequestSchema = PartsControllerSimulatePartMutationRequest

export const partsControllerSimulatePartMutationResponseSchema =
  partsControllerSimulatePart200Schema as unknown as ToZod<PartsControllerSimulatePartMutationResponse>

export type PartsControllerSimulatePartMutationResponseSchema = PartsControllerSimulatePartMutationResponse
