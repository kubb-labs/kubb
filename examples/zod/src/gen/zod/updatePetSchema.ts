import { petSchema } from './petSchema'

/**
 * @description Update an existent pet in the store
 */
export const updatePetRequestSchema = petSchema

/**
 * @description Successful operation
 */
export const updatePetResponseSchema = petSchema
