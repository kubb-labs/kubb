import { z } from 'zod'

import { petNotFoundSchema } from '../petNotFoundSchema'

/**
 * @description Null response
 */
export const createPets201Schema = z.any()
export const createPetsMutationRequestSchema = z.object({ name: z.string(), tag: z.string() })
export const createPetsMutationResponseSchema = z.any()
export const createPetsPathParamsSchema = z.object({ uuid: z.string().describe(`UUID`) })
export const createpetsHeaderparamsSchema = z.object({ 'X-EXAMPLE': z.enum([`ONE`, `TWO`, `THREE`]).describe(`Header parameters`) })
export const createpetsQueryparamsSchema = z.object({ offset: z.number().describe(`Offset`).optional() })

/**
 * @description unexpected error
 */
export const createPetserrorSchema = z.lazy(() => petNotFoundSchema)
