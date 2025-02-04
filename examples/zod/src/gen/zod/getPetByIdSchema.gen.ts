import type { GetPetByIdPathParamsType, GetPetById200Type, GetPetById400Type, GetPetById404Type, GetPetByIdQueryResponseType } from '../ts/GetPetByIdType.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from '../../zod.ts'
import { petSchema } from './petSchema.gen.ts'

export const getPetByIdPathParamsSchema = z.object({
  petId: z.number().int().describe('ID of pet to return'),
}) as unknown as ToZod<GetPetByIdPathParamsType>

export type GetPetByIdPathParamsSchema = GetPetByIdPathParamsType

/**
 * @description successful operation
 */
export const getPetById200Schema = z.lazy(() => petSchema) as unknown as ToZod<GetPetById200Type>

export type GetPetById200Schema = GetPetById200Type

/**
 * @description Invalid ID supplied
 */
export const getPetById400Schema = z.any() as unknown as ToZod<GetPetById400Type>

export type GetPetById400Schema = GetPetById400Type

/**
 * @description Pet not found
 */
export const getPetById404Schema = z.any() as unknown as ToZod<GetPetById404Type>

export type GetPetById404Schema = GetPetById404Type

export const getPetByIdQueryResponseSchema = z.lazy(() => getPetById200Schema) as unknown as ToZod<GetPetByIdQueryResponseType>

export type GetPetByIdQueryResponseSchema = GetPetByIdQueryResponseType