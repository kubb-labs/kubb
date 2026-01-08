import { z } from 'zod'
import type { ToZod } from '../../.kubb/ToZod.ts'
import type {
  GetPetByIdPathParams,
  GetPetByIdResponseData,
  GetPetByIdStatus200,
  GetPetByIdStatus400,
  GetPetByIdStatus404,
} from '../../models/ts/petController/GetPetById.ts'
import { petSchema } from '../petSchema.ts'

export const getPetByIdPathParamsSchema = z.object({
  petId: z.coerce.number().int().describe('ID of pet to return'),
}) as unknown as ToZod<GetPetByIdPathParams>

export type GetPetByIdPathParamsSchema = GetPetByIdPathParams

/**
 * @description successful operation
 */
export const getPetByIdStatus200Schema = z.lazy(() => petSchema).schema.omit({ name: true }) as unknown as ToZod<GetPetByIdStatus200>

export type GetPetByIdStatus200Schema = GetPetByIdStatus200

/**
 * @description Invalid ID supplied
 */
export const getPetByIdStatus400Schema = z.any() as unknown as ToZod<GetPetByIdStatus400>

export type GetPetByIdStatus400Schema = GetPetByIdStatus400

/**
 * @description Pet not found
 */
export const getPetByIdStatus404Schema = z.any() as unknown as ToZod<GetPetByIdStatus404>

export type GetPetByIdStatus404Schema = GetPetByIdStatus404

export const getPetByIdResponseDataSchema = z.lazy(() => getPetByIdStatus200Schema) as unknown as ToZod<GetPetByIdResponseData>

export type GetPetByIdResponseDataSchema = GetPetByIdResponseData
