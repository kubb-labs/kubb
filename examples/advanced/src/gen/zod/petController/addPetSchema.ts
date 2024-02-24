import { z } from 'zod'
import { petSchema } from '../petSchema'
import { addPetRequestSchema } from '../addPetRequestSchema'

export const addPet405Schema = z.object({ 'code': z.number().optional(), 'message': z.string().optional() })

/**
 * @description Successful operation
 */
export const addPet200Schema = z.lazy(() => petSchema)

/**
 * @description Create a new pet in the store
 */
export const addPetMutationRequestSchema = z.lazy(() => addPetRequestSchema)

/**
 * @description Successful operation
 */
export const addPetMutationResponseSchema = z.lazy(() => petSchema).schema.and(z.object({ name: z.never() }))
