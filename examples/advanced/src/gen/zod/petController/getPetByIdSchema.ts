import type { GetPetByIdPathParams, GetPetById200, GetPetById400, GetPetById404, GetPetByIdQueryResponse } from '../../models/ts/petController/GetPetById.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { petSchema } from '../petSchema.ts'
import { z } from 'zod'

export const getPetByIdPathParamsSchema = z.object({
  petId: z.number().int().describe('ID of pet to return'),
} satisfies ToZod<GetPetByIdPathParams>)

export type GetPetByIdPathParamsSchema = GetPetByIdPathParams

/**
 * @description successful operation
 */
export const getPetById200Schema = z.lazy(() => petSchema).and(z.object({ name: z.never() }))

export type GetPetById200Schema = GetPetById200

/**
 * @description Invalid ID supplied
 */
export const getPetById400Schema = z.any()

export type GetPetById400Schema = GetPetById400

/**
 * @description Pet not found
 */
export const getPetById404Schema = z.any()

export type GetPetById404Schema = GetPetById404

export const getPetByIdQueryResponseSchema = z.lazy(() => getPetById200Schema)

export type GetPetByIdQueryResponseSchema = GetPetByIdQueryResponse
