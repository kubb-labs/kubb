import { z } from 'zod'
import { petNotFoundSchema } from './petNotFoundSchema.gen'

export const createPetsPathParamsSchema = z.object({ uuid: z.string().describe('UUID') })

export const createPetsQueryParamsSchema = z.object({ offset: z.number().describe('Offset').optional() }).optional()

export const createPetsHeaderParamsSchema = z.object({ 'X-EXAMPLE': z.enum(['ONE', 'TWO', 'THREE']).describe('Header parameters') })

/**
 * @description Null response
 */
export const createPets201Schema = z.any()

/**
 * @description unexpected error
 */
export const createPetsErrorSchema = z.lazy(() => petNotFoundSchema).schema.describe('Pet not found')

export const createPetsMutationRequestSchema = z.object({ name: z.string(), tag: z.string() })

export const createPetsMutationResponseSchema = z.any()
