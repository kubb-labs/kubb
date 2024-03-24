import { z } from 'zod'
import { petSchema } from '../petSchema'

/**
 * @description Successful operation
 */
export const updatePet200Schema = z.lazy(() => petSchema)

/**
 * @description Invalid ID supplied
 */
export const updatePet400Schema = z.any()

/**
 * @description Pet not found
 */
export const updatePet404Schema = z.any()

/**
 * @description Validation exception
 */
export const updatePet405Schema = z.any()

/**
 * @description Update an existent pet in the store
 */
export const updatePetMutationRequestSchema = z.lazy(() => petSchema).schema.and(z.object({ id: z.never() }))

/**
 * @description Successful operation
 */
export const updatePetMutationResponseSchema = z.lazy(() => petSchema).schema.and(z.object({ name: z.never() }))
