import { z } from '../../zod.ts'
import { petSchema } from './petSchema.gen'

/**
 * @description Successful operation
 */
export const updatePet200Schema = z.lazy(() => petSchema)

export type UpdatePet200Schema = z.infer<typeof updatePet200Schema>

/**
 * @description Invalid ID supplied
 */
export const updatePet400Schema = z.any()

export type UpdatePet400Schema = z.infer<typeof updatePet400Schema>

/**
 * @description Pet not found
 */
export const updatePet404Schema = z.any()

export type UpdatePet404Schema = z.infer<typeof updatePet404Schema>

/**
 * @description Validation exception
 */
export const updatePet405Schema = z.any()

export type UpdatePet405Schema = z.infer<typeof updatePet405Schema>

/**
 * @description Update an existent pet in the store
 */
export const updatePetMutationRequestSchema = z.lazy(() => petSchema)

export type UpdatePetMutationRequestSchema = z.infer<typeof updatePetMutationRequestSchema>

/**
 * @description Successful operation
 */
export const updatePetMutationResponseSchema = z.lazy(() => petSchema)

export type UpdatePetMutationResponseSchema = z.infer<typeof updatePetMutationResponseSchema>
