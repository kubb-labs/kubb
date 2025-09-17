import type { PartsControllerGetParts200, PartsControllerGetPartsQueryResponse } from '../../models/ts/partsController/PartsControllerGetParts.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { partSchema } from '../partSchema.ts'
import { z } from 'zod/v4'

export const partsControllerGetParts200Schema = z.array(partSchema) as unknown as ToZod<PartsControllerGetParts200>

export type PartsControllerGetParts200Schema = PartsControllerGetParts200

export const partsControllerGetPartsQueryResponseSchema = partsControllerGetParts200Schema as unknown as ToZod<PartsControllerGetPartsQueryResponse>

export type PartsControllerGetPartsQueryResponseSchema = PartsControllerGetPartsQueryResponse
