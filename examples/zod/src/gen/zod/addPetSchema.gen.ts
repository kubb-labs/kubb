import { z } from 'zod'
import { petSchema } from './petSchema.gen'
import { addPetRequestSchema } from './addPetRequestSchema.gen'

/**
 * @description Successful operation
 */
export const addPet200Schema = z.lazy(() => petSchema).schema

/**
 * @description Pet not found
 */
export const addPet405Schema = z.object({ code: z.number().optional(), message: z.string().optional() })

/**
 * @description Create a new pet in the store
 */
export const addPetMutationRequestSchema = z.lazy(() => addPetRequestSchema).schema

/**
 * @description Successful operation
 */
export const addPetMutationResponseSchema = z.lazy(() => petSchema).schema
