import type {
  PartsControllerGetPartPathParams,
  PartsControllerGetPart200,
  PartsControllerGetPartQueryResponse,
} from '../../models/ts/partsController/PartsControllerGetPart.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { partSchema } from '../partSchema.ts'
import { z } from 'zod/v4'

export const partsControllerGetPartPathParamsSchema = z.object({
  urn: z.string(),
}) as unknown as ToZod<PartsControllerGetPartPathParams>

export type PartsControllerGetPartPathParamsSchema = PartsControllerGetPartPathParams

export const partsControllerGetPart200Schema = partSchema as unknown as ToZod<PartsControllerGetPart200>

export type PartsControllerGetPart200Schema = PartsControllerGetPart200

export const partsControllerGetPartQueryResponseSchema = partsControllerGetPart200Schema as unknown as ToZod<PartsControllerGetPartQueryResponse>

export type PartsControllerGetPartQueryResponseSchema = PartsControllerGetPartQueryResponse
