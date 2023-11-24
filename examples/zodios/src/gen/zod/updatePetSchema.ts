import { z } from 'zod'
import { petSchema } from './petSchema'

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
export const updatePetMutationRequestSchema = z.lazy(() => petSchema).schema

/**
 * @description Successful operation
 */
export const updatePetMutationResponseSchema = z.lazy(() => petSchema).schema
