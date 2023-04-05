import z from 'zod'

import { petSchema } from '../petSchema'

/**
 * @description Update an existent pet in the store
 */
export const updatePetRequestSchema = z.lazy(() => petSchema)

/**
 * @description Successful operation
 */
export const updatePetResponseSchema = z.lazy(() => petSchema)
