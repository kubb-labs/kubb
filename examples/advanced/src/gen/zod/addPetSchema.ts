import { petSchema } from './petSchema'

/**
 * @description Create a new pet in the store
 */
export const addPetRequestSchema = petSchema

/**
 * @description Successful operation
 */
export const addPetResponseSchema = petSchema
