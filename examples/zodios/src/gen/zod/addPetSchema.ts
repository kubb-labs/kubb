import { z } from 'zod'
import { petSchema } from './petSchema'
import { addPetRequestSchema } from './addPetRequestSchema'

/**
 * @description Successful operation
 */
export const addPet200Schema = z.lazy(() => petSchema)
/**
 * @description Pet not found
 */
export const addPet405Schema = z.object({ code: z.number().int().optional(), message: z.string().optional() })
/**
 * @description Create a new pet in the store
 */
export const addPetMutationRequestSchema = z.lazy(() => addPetRequestSchema)
/**
 * @description Successful operation
 */
export const addPetMutationResponseSchema = z.lazy(() => petSchema)
