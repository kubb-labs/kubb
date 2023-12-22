import { z } from 'zod'
import { addPetRequestSchema } from '../addPetRequestSchema'
import { petSchema } from '../petSchema'

export const addPet405Schema = z.object({ 'code': z.number().optional(), 'message': z.string().optional() })

/**
 * @description Create a new pet in the store
 */
export const addPetMutationRequestSchema = z.lazy(() => addPetRequestSchema)

/**
 * @description Successful operation
 */
export const addPetMutationResponseSchema = z.lazy(() => petSchema).schema.omit({ name: true })
