import type {
  FindPetsByStatusQueryParamsType,
  FindPetsByStatus200Type,
  FindPetsByStatus400Type,
  FindPetsByStatusQueryResponseType,
} from '../ts/FindPetsByStatusType.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from '../../zod.ts'
import { petSchema } from './petSchema.gen.ts'

export const findPetsByStatusQueryParamsSchema = z
  .object({
    status: z.enum(['available', 'pending', 'sold']).default('available').describe('Status values that need to be considered for filter'),
  })
  .optional() as unknown as ToZod<FindPetsByStatusQueryParamsType>

export type FindPetsByStatusQueryParamsSchema = FindPetsByStatusQueryParamsType

/**
 * @description successful operation
 */
export const findPetsByStatus200Schema = z.array(z.lazy(() => petSchema)) as unknown as ToZod<FindPetsByStatus200Type>

export type FindPetsByStatus200Schema = FindPetsByStatus200Type

/**
 * @description Invalid status value
 */
export const findPetsByStatus400Schema = z.any() as unknown as ToZod<FindPetsByStatus400Type>

export type FindPetsByStatus400Schema = FindPetsByStatus400Type

export const findPetsByStatusQueryResponseSchema = z.lazy(() => findPetsByStatus200Schema) as unknown as ToZod<FindPetsByStatusQueryResponseType>

export type FindPetsByStatusQueryResponseSchema = FindPetsByStatusQueryResponseType