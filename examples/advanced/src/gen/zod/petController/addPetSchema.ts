import { z } from 'zod'

import { addPetRequestSchema } from '../addPetRequestSchema'
import { petSchema } from '../petSchema'

/**
 * @description Invalid input
 */
export const addPet405Schema = z.any()

/**
 * @description Create a new pet in the store
 */
export const addPetMutationRequestSchema = z.lazy(() => addPetRequestSchema)

/**
 * @description Successful operation
 */
export const addPetMutationResponseSchema = z.lazy(() => petSchema)
