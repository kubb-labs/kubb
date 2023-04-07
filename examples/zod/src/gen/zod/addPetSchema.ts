import z from 'zod'

import { petSchema } from './petSchema'

/**
 * @description Invalid input
 */
export const addPet405Schema = z.any()

/**
 * @description Create a new pet in the store
 */
export const addPetRequestSchema = z.lazy(() => petSchema)

/**
 * @description Successful operation
 */
export const addPetResponseSchema = z.lazy(() => petSchema)
