import { z } from 'zod'
import { petNotFoundSchema } from '../petNotFoundSchema'

export const createPetsPathParamsSchema = z.object({ uuid: z.coerce.string().describe('UUID') })

export const createPetsQueryParamsSchema = z.object({ offset: z.coerce.number().describe('Offset').optional() }).optional()

export const createPetsHeaderParamsSchema = z.object({ 'X-EXAMPLE': z.enum(['ONE', 'TWO', 'THREE']).describe('Header parameters') })
/**
 * @description Null response
 */
export const createPets201Schema = z.any()
/**
 * @description unexpected error
 */
export const createPetsErrorSchema = z.lazy(() => petNotFoundSchema)

export const createPetsMutationRequestSchema = z.object({ name: z.coerce.string(), tag: z.coerce.string() })

export const createPetsMutationResponseSchema = z.any()
